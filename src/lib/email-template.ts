import type { Lead } from "./types";

export const DEFAULT_TEMPLATE_SUBJECT = "I built a free website for {{businessName}}";

export const DEFAULT_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#111111;padding:30px 40px;">
              <a href="https://zapex360.com" target="_blank" style="text-decoration:none;"><h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">Zapex360</h1></a>
              <p style="margin:4px 0 0;color:#888888;font-size:12px;">Web Design &bull; Marketing &bull; Booking Systems &bull; Lead Generation &bull; Payment Systems</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.7;">
                Hi there,
              </p>
              <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.7;">
                I came across <strong>{{businessName}}</strong> and was impressed by what you're building. I noticed you might not have a website yet &mdash; or your current one might not be doing your brand justice.
              </p>
              <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.7;">
                So I went ahead and built one for you. Completely free, no strings attached.
              </p>
              <p style="margin:0 0 24px;color:#333333;font-size:15px;line-height:1.7;">
                It's already live &mdash; take a look:
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#111111;border-radius:6px;padding:14px 28px;">
                    <a href="{{websiteUrl}}" target="_blank" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                      See Your Free Website &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#666666;font-size:13px;">
                <a href="{{websiteUrl}}" target="_blank" style="color:#2563eb;text-decoration:underline;">{{websiteUrl}}</a>
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0;">

              <p style="margin:0 0 16px;color:#333333;font-size:15px;line-height:1.7;font-weight:600;">
                Here's what's included:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="padding:4px 0;color:#333;font-size:14px;line-height:1.6;">&#10003;&nbsp;&nbsp;Custom design tailored to your brand</td></tr>
                <tr><td style="padding:4px 0;color:#333;font-size:14px;line-height:1.6;">&#10003;&nbsp;&nbsp;Mobile-friendly &amp; fast-loading</td></tr>
                <tr><td style="padding:4px 0;color:#333;font-size:14px;line-height:1.6;">&#10003;&nbsp;&nbsp;Your real business info, address &amp; contact details</td></tr>
                <tr><td style="padding:4px 0;color:#333;font-size:14px;line-height:1.6;">&#10003;&nbsp;&nbsp;Google Maps integration</td></tr>
                <tr><td style="padding:4px 0;color:#333;font-size:14px;line-height:1.6;">&#10003;&nbsp;&nbsp;Ready to share with customers today</td></tr>
              </table>

              <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.7;">
                If you like it, I can transfer ownership to you, connect a custom domain, or make any changes you need. And if you want help with anything else &mdash; marketing, booking systems, lead generation, payment processing &mdash; I'm here.
              </p>
              <p style="margin:0 0 0;color:#333333;font-size:15px;line-height:1.7;">
                Would love to hear what you think.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e5e5e5;padding:28px 40px;">
              <p style="margin:0 0 4px;color:#111111;font-size:14px;font-weight:600;"><a href="https://zapex360.com" target="_blank" style="color:#111111;text-decoration:none;">Zapex360</a></p>
              <p style="margin:0 0 8px;color:#666666;font-size:13px;">Web Design &bull; Marketing &bull; Booking &bull; Lead Gen &bull; Payments</p>
              <p style="margin:0 0 4px;color:#2563eb;font-size:13px;">
                <a href="https://zapex360.com" target="_blank" style="color:#2563eb;text-decoration:none;">zapex360.com</a>
              </p>
              <p style="margin:0 0 0;color:#2563eb;font-size:13px;">
                <a href="mailto:team@zapex360.com" style="color:#2563eb;text-decoration:none;">team@zapex360.com</a>
              </p>
            </td>
          </tr>

          <!-- Unsubscribe -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <p style="margin:0;color:#999999;font-size:11px;line-height:1.5;">
                You received this because we thought {{businessName}} could use a great website. No further emails will be sent unless you reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? ""
  );
}

export function generateEmailHtml(lead: Lead): string {
  return renderTemplate(DEFAULT_TEMPLATE_HTML, {
    businessName: lead.name,
    websiteUrl: lead.live_url || "#",
  });
}

export function generateSubject(lead: Lead): string {
  return renderTemplate(DEFAULT_TEMPLATE_SUBJECT, {
    businessName: lead.name,
  });
}
