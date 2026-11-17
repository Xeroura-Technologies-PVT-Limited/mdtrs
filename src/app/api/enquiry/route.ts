import { NextResponse } from "next/server";

/** Receives the quote form.
 *  Delivery: if RESEND_API_KEY and ENQUIRY_TO are set, the enquiry (with attached reports) is emailed via Resend.
 *  Without them it is logged in development and refused in production, so a live site never pretends to send. */

const MAX_FILES_BYTES = 10 * 1024 * 1024;
const clean = (v: FormDataEntryValue | null, max = 2000) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return NextResponse.json({ error: "We couldn't read the form." }, { status: 400 });
  }

  const enquiry = {
    role: clean(data.get("role"), 20) || "patient",
    name: clean(data.get("name"), 120),
    country: clean(data.get("country"), 80),
    phone: clean(data.get("phone"), 40),
    email: clean(data.get("email"), 160),
    care: clean(data.get("care"), 60),
    message: clean(data.get("message"), 4000),
    consent: data.get("consent") === "yes",
  };
  if (!enquiry.name || !enquiry.country || !enquiry.phone) {
    return NextResponse.json({ error: "Please add your name, country and phone number." }, { status: 422 });
  }
  if (!enquiry.consent) {
    return NextResponse.json({ error: "Please tick the consent box so we can contact you." }, { status: 422 });
  }

  const files = data.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > MAX_FILES_BYTES) {
    return NextResponse.json({ error: "Attachments are larger than 10 MB. Please send fewer files, or share them on WhatsApp." }, { status: 413 });
  }

  const text = [
    `New treatment enquiry`,
    ``,
    `I am: ${enquiry.role}`,
    `Name: ${enquiry.name}`,
    `Country: ${enquiry.country}`,
    `Phone / WhatsApp: ${enquiry.phone}`,
    `Email: ${enquiry.email || "-"}`,
    `Care needed: ${enquiry.care || "-"}`,
    ``,
    `About the condition:`,
    enquiry.message || "-",
    ``,
    `Attachments: ${files.length ? files.map((f) => f.name).join(", ") : "none"}`,
  ].join("\n");

  const key = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  if (!key || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[enquiry] (not delivered: RESEND_API_KEY / ENQUIRY_TO not set)\n" + text);
      return NextResponse.json({ ok: true, delivered: false });
    }
    return NextResponse.json({ error: "Online enquiries aren't connected yet." }, { status: 503 });
  }

  const attachments = await Promise.all(
    files.map(async (f) => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()).toString("base64") })),
  );
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM || "Medtours website <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()),
      reply_to: enquiry.email || undefined,
      subject: `Enquiry: ${enquiry.name} (${enquiry.country}) · ${enquiry.care || "care not specified"}`,
      text,
      attachments,
    }),
  });
  if (!res.ok) {
    console.error("[enquiry] Resend error", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "We couldn't send your enquiry just now." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, delivered: true });
}
