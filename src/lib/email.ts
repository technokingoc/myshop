import { appendEmailLog } from "@/lib/dev-store";

type EmailInput = {
  to: string;
  subject: string;
  body: string;
};

async function sendViaResend(input: EmailInput) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: `<p>${input.body.replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  return res.ok;
}

export async function sendEmail(input: EmailInput) {
  try {
    const sent = await sendViaResend(input);
    if (!sent) {
      await appendEmailLog(input.to, input.subject, input.body);
      console.log("[email-dev-log]", input);
    }
  } catch {
    await appendEmailLog(input.to, input.subject, input.body);
  }
}
