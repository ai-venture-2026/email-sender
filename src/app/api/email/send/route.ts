import { NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import { getSupabase } from "@/lib/supabase";
import { generateEmailHtml, renderTemplate } from "@/lib/email-template";
import type { Lead } from "@/lib/types";

export async function POST(req: Request) {
  const { to, subject, useTemplate, customBody, leadId, templateHtml } =
    await req.json();

  if (!to || !subject) {
    return NextResponse.json(
      { error: "to and subject are required" },
      { status: 400 }
    );
  }

  const resend = getResend();
  const supabase = getSupabase();

  // Build the HTML body
  let htmlBody: string;

  if (useTemplate && leadId) {
    // Fetch lead data and generate from template
    const { data: lead } = await supabase
      .from("client_websites")
      .select("*")
      .eq("id", leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    htmlBody = templateHtml
      ? renderTemplate(templateHtml, {
          businessName: lead.name,
          websiteUrl: lead.live_url || "#",
        })
      : generateEmailHtml(lead as Lead);
  } else if (customBody) {
    htmlBody = customBody;
  } else {
    return NextResponse.json(
      { error: "Either useTemplate with leadId or customBody is required" },
      { status: 400 }
    );
  }

  const { data, error } = await resend.emails.send({
    from: "Zapex360 <team@zapex360.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html: htmlBody,
    headers: {
      "X-Entity-Ref-ID": `${leadId || Date.now()}`,
    },
    tags: [
      { name: "category", value: "outreach" },
    ],
  });

  // Log to Supabase
  await supabase.from("email_log").insert({
    lead_id: leadId || null,
    to_email: Array.isArray(to) ? to.join(", ") : to,
    subject,
    body: htmlBody,
    status: error ? "failed" : "sent",
    error_message: error?.message || null,
  });

  // Mark the lead's updated_at timestamp
  if (leadId && !error) {
    await supabase
      .from("client_websites")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", leadId);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id, success: true });
}
