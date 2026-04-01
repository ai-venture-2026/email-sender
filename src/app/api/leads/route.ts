import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const TABLE = "client_websites";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .not("email", "is", null)
    .neq("email", "")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ leads: data });
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();

  // Support both single and batch inserts
  const leads = Array.isArray(body) ? body : [body];

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      leads.map((lead) => ({
        name: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        address: lead.address || null,
        category: lead.category || lead.business_type || null,
        rating: lead.rating || null,
        reviews: lead.reviews || null,
        place_id: lead.place_id || null,
        keyword: lead.keyword || null,
        location: lead.location || null,
      })),
      { onConflict: "place_id", ignoreDuplicates: true }
    )
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ leads: data });
}

export async function PATCH(req: Request) {
  const supabase = getSupabase();
  const { id, ...updates } = await req.json();

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lead: data });
}

export async function DELETE(req: Request) {
  const supabase = getSupabase();
  const { id } = await req.json();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
