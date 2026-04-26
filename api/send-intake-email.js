// api/send-intake-email.js
// Vercel Serverless Function — Node.js (no Deno needed)
// Vercel auto-detects anything in /api and deploys it as a serverless endpoint.
//
// Required env vars (set in Vercel dashboard → Settings → Environment Variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   TO_EMAIL        (default: tajbizllc@gmail.com)
//   FROM_EMAIL      (must be verified in Resend)

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TO_EMAIL   = process.env.TO_EMAIL   ?? "tajbizllc@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "intake@trinitysolutionsva.com";

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { submissionId } = req.body;
    if (!submissionId) return res.status(400).json({ error: "Missing submissionId" });

    // 1. Fetch submission from Supabase
    const { data: sub, error: fetchErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchErr || !sub) throw new Error(fetchErr?.message ?? "Submission not found");

    // 2. Build PDF
    const pdfBytes  = await buildPDF(sub);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    // 3. Build email
    const primaryDriver = sub.drivers.find((d) => d.relation === "self") ?? sub.drivers[0];
    const clientName    = `${primaryDriver?.firstName ?? ""} ${primaryDriver?.lastName ?? ""}`.trim() || "Unknown";
    const subject       = `Trinity Solutions — New Auto Intake: ${clientName} (${sub.drivers.length}D / ${sub.vehicles.length}V)`;
    const fileName      = `intake-${clientName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;

    // 4. Send via Resend
    const { error: sendErr } = await resend.emails.send({
      from:        `Trinity Solutions Intake <${FROM_EMAIL}>`,
      to:          [TO_EMAIL],
      subject,
      html:        buildEmailHTML(sub, clientName),
      attachments: [{ filename: fileName, content: pdfBase64 }],
    });

    if (sendErr) throw new Error(sendErr.message);

    // 5. Update status in DB
    await supabase
      .from("submissions")
      .update({ status: "emailed", email_sent_at: new Date().toISOString() })
      .eq("id", submissionId);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("[send-intake-email]", err);

    // Try to record error on submission
    try {
      const { submissionId } = req.body ?? {};
      if (submissionId) {
        await supabase
          .from("submissions")
          .update({ status: "error", error_message: String(err) })
          .eq("id", submissionId);
      }
    } catch (_) {}

    return res.status(500).json({ error: String(err) });
  }
}

// ── PDF Builder ───────────────────────────────────────────────────────────────
async function buildPDF(sub) {
  const doc  = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 612, H = 792, M = 50;
  let page = doc.addPage([W, H]);
  let y = H - 56;

  const newPage = () => { page = doc.addPage([W, H]); y = H - 56; };
  const guard   = (lines = 1) => { if (y < 70 + lines * 18) newPage(); };

  const text = (t, { x = M, size = 10, isBold = false, color = rgb(0.12, 0.12, 0.12) } = {}) => {
    guard();
    page.drawText(String(t || ""), { x, y, size, font: isBold ? bold : font, color });
    y -= size + 7;
  };

  const row = (label, value) => {
    guard();
    page.drawText(`${label}:`, { x: M,       y, size: 9.5, font: bold, color: rgb(0.45, 0.42, 0.37) });
    page.drawText(value || "—",{ x: M + 155, y, size: 9.5, font,       color: rgb(0.12, 0.12, 0.12) });
    y -= 17;
  };

  const section = (title) => {
    guard(3);
    y -= 6;
    page.drawRectangle({ x: M - 4, y: y - 4, width: W - 2 * M + 8, height: 20, color: rgb(0.875, 0.478, 0.098) });
    page.drawText(title, { x: M, y, size: 11, font: bold, color: rgb(1, 1, 1) });
    y -= 26;
  };

  const photoLink = (label, url) => {
    if (!url) return;
    guard();
    page.drawText(`${label}:`, { x: M,       y, size: 9, font: bold, color: rgb(0.45, 0.42, 0.37) });
    page.drawText(url,          { x: M + 155, y, size: 8, font,       color: rgb(0.1, 0.35, 0.7) });
    y -= 14;
  };

  // Header
  page.drawRectangle({ x: 0, y: H - 68, width: W, height: 68, color: rgb(0.102, 0.102, 0.102) });
  page.drawText("TRINITY SOLUTIONS INSURANCE AGENCY", { x: M, y: H - 32, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Auto Insurance Intake Summary",       { x: M, y: H - 50, size: 11, font,       color: rgb(0.85, 0.85, 0.85) });
  page.drawRectangle({ x: 0,         y: H - 72, width: W / 3, height: 4, color: rgb(0.875, 0.478, 0.098) });
  page.drawRectangle({ x: W / 3,     y: H - 72, width: W / 3, height: 4, color: rgb(0.18, 0.549, 0.227) });
  page.drawRectangle({ x: (W/3)*2,   y: H - 72, width: W / 3, height: 4, color: rgb(0.831, 0.627, 0.125) });
  y = H - 92;

  text(`Submitted: ${new Date(sub.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })} ET`, { size: 9, color: rgb(0.5, 0.5, 0.5) });
  text(`Reference ID: ${sub.id}`, { size: 8.5, color: rgb(0.65, 0.65, 0.65) });
  y -= 4;

  // Applicant
  section("APPLICANT CONTACT");
  row("Email",   sub.applicant_email);
  row("Phone",   sub.applicant_phone);
  const addr = [sub.applicant_address, sub.applicant_city, sub.applicant_state, sub.applicant_zip].filter(Boolean).join(", ");
  row("Address", addr);

  // Drivers
  for (let i = 0; i < sub.drivers.length; i++) {
    const d   = sub.drivers[i];
    const rel = d.relation === "self" ? "Applicant" : d.relation;
    section(`DRIVER ${i + 1}: ${d.firstName} ${d.lastName} (${rel})`);
    row("Email",          d.email);
    row("Phone",          d.phone);
    row("Date of Birth",  d.dob);
    row("License #",      d.licenseNumber);
    row("State",          d.licenseState);
    row("Accidents",      d.accidents || "0");
    row("Violations",     d.violations || "0");
    row("SR-22 / FR-44",  d.srFiling ? "Required" : "No");
    photoLink("License Photo", d.licenseFrontUrl);
  }

  // Vehicles
  for (let i = 0; i < sub.vehicles.length; i++) {
    const v = sub.vehicles[i];
    section(`VEHICLE ${i + 1}: ${v.year} ${v.make} ${v.model} ${v.trim}`.trim());
    row("VIN",           v.vin || (v.vinPhotoUrl ? "(see photo)" : "—"));
    photoLink("VIN Photo", v.vinPhotoUrl);
    row("Mileage",       v.mileage);
    row("Annual Miles",  v.annualMiles);
    row("Usage",         v.usage);
    row("Ownership",     v.ownership);
    row("Garage ZIP",    v.garageZip);
    y -= 4;
    text("Coverage:", { isBold: true, size: 9.5, color: rgb(0.45, 0.42, 0.37) });
    row("Bodily Injury",   v.bodilyInjury);
    row("Property Damage", "$" + v.propertyDamage);
    row("Collision",       v.collision === "none" ? "Declined" : "$" + v.collision);
    row("Comprehensive",   v.comprehensive === "none" ? "Declined" : "$" + v.comprehensive);
    const addons = [v.uninsured && "Uninsured Motorist", v.roadside && "Roadside", v.rental && "Rental"].filter(Boolean).join(", ");
    row("Add-ons", addons || "None");
  }

  // Binder
  if (sub.binder_photo_urls?.length > 0) {
    section(`INSURANCE BINDER (${sub.binder_photo_urls.length} page${sub.binder_photo_urls.length > 1 ? "s" : ""})`);
    sub.binder_photo_urls.forEach((url, i) => photoLink(`Page ${i + 1}`, url));
  }

  // Footer
  page.drawText(
    "5348 Twin Hickory Rd, Glen Allen VA 23059  |  804.944.6226  |  Tajbizllc@gmail.com",
    { x: M, y: 28, size: 8, font, color: rgb(0.6, 0.6, 0.6) }
  );

  return await doc.save();
}

// ── HTML Email Builder ────────────────────────────────────────────────────────
function buildEmailHTML(sub, clientName) {
  const cell = (l, v) =>
    `<tr>
       <td style="color:#6a6458;padding:5px 18px 5px 0;font-size:13.5px;white-space:nowrap;vertical-align:top">${l}</td>
       <td style="color:#1a1a1a;font-weight:500;font-size:13.5px;padding:5px 0;vertical-align:top">${v || "—"}</td>
     </tr>`;

  const photoBlock = (label, url) =>
    url ? `<div style="margin:14px 0 6px">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#9a9488;margin:0 0 7px">${label}</p>
      <a href="${url}" target="_blank" style="display:inline-block;border-radius:8px;overflow:hidden;border:1px solid #d8d4cc">
        <img src="${url}" alt="${label}" style="max-width:320px;max-height:200px;object-fit:cover;display:block" />
      </a>
      <p style="font-size:10px;color:#aaa;margin:5px 0 0;word-break:break-all">
        <a href="${url}" style="color:#aaa">${url}</a>
      </p>
    </div>` : "";

  const sectionTitle = (t) =>
    `<div style="background:#e07a1a;padding:8px 20px;margin:24px 0 0">
       <h2 style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;margin:0">${t}</h2>
     </div>
     <div style="padding:16px 24px;background:#faf8f4">`;

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#f0ede6;font-family:Arial,sans-serif">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
  <div style="background:#1a1a1a;padding:28px 32px">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#fff;margin:0 0 4px">Trinity Solutions Insurance Agency</h1>
    <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0">New Auto Intake — ${new Date(sub.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })} ET</p>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,#e07a1a 0%,#e07a1a 33%,#2e8c3a 33%,#2e8c3a 66%,#d4a020 66%)"></div>
  <div style="padding:20px 32px;border-bottom:1px solid #e8e4dc">
    <span style="background:#fef6ee;border:1.5px solid #e07a1a;border-radius:10px;padding:10px 18px;display:inline-block;margin-right:12px;text-align:center">
      <div style="font-size:22px;font-weight:700;color:#e07a1a">${sub.drivers.length}</div>
      <div style="font-size:11px;color:#9a9488">Driver${sub.drivers.length !== 1 ? "s" : ""}</div>
    </span>
    <span style="background:#f0f8f1;border:1.5px solid #2e8c3a;border-radius:10px;padding:10px 18px;display:inline-block;text-align:center">
      <div style="font-size:22px;font-weight:700;color:#2e8c3a">${sub.vehicles.length}</div>
      <div style="font-size:11px;color:#9a9488">Vehicle${sub.vehicles.length !== 1 ? "s" : ""}</div>
    </span>
    <span style="float:right;font-size:11px;color:#9a9488;font-family:monospace">ID: ${sub.id}</span>
  </div>`;

  html += sectionTitle("🏠 APPLICANT CONTACT");
  html += `<table style="border-collapse:collapse">
    ${cell("Email",   sub.applicant_email)}
    ${cell("Phone",   sub.applicant_phone)}
    ${cell("Address", [sub.applicant_address, sub.applicant_city, sub.applicant_state, sub.applicant_zip].filter(Boolean).join(", "))}
  </table></div>`;

  sub.drivers.forEach((d, i) => {
    const rel = d.relation === "self" ? "Applicant" : d.relation;
    html += sectionTitle(`👤 DRIVER ${i + 1}: ${d.firstName} ${d.lastName} (${rel})`);
    html += `<table style="border-collapse:collapse">
      ${cell("Email",           d.email)}
      ${cell("Phone",           d.phone)}
      ${cell("Date of Birth",   d.dob)}
      ${cell("License #",       d.licenseNumber)}
      ${cell("License State",   d.licenseState)}
      ${cell("Accidents (3yr)", d.accidents || "0")}
      ${cell("Violations (3yr)",d.violations || "0")}
      ${cell("SR-22 / FR-44",   d.srFiling ? "⚠️ Required" : "No")}
    </table>`;
    html += photoBlock("Driver's License", d.licenseFrontUrl);
    html += `</div>`;
  });

  sub.vehicles.forEach((v, i) => {
    html += sectionTitle(`🚘 VEHICLE ${i + 1}: ${v.year} ${v.make} ${v.model} ${v.trim}`.trim());
    html += `<table style="border-collapse:collapse">
      ${cell("VIN",           v.vin || (v.vinPhotoUrl ? "(see photo)" : "—"))}
      ${cell("Mileage",       v.mileage)}
      ${cell("Annual Miles",  v.annualMiles)}
      ${cell("Usage",         v.usage)}
      ${cell("Ownership",     v.ownership)}
      ${cell("Garage ZIP",    v.garageZip)}
      ${cell("Bodily Injury", v.bodilyInjury)}
      ${cell("Prop. Damage",  "$" + v.propertyDamage)}
      ${cell("Collision",     v.collision === "none" ? "Declined" : "$" + v.collision)}
      ${cell("Comprehensive", v.comprehensive === "none" ? "Declined" : "$" + v.comprehensive)}
      ${cell("Add-ons",       [v.uninsured && "UM", v.roadside && "Roadside", v.rental && "Rental"].filter(Boolean).join(", ") || "None")}
    </table>`;
    html += photoBlock("VIN Photo", v.vinPhotoUrl);
    html += `</div>`;
  });

  if (sub.binder_photo_urls?.length > 0) {
    html += sectionTitle(`📄 BINDER (${sub.binder_photo_urls.length} page${sub.binder_photo_urls.length > 1 ? "s" : ""})`);
    html += `<div style="display:flex;flex-wrap:wrap;gap:16px">`;
    sub.binder_photo_urls.forEach((url, i) => {
      html += `<div>
        <p style="font-size:11px;color:#9a9488;margin:0 0 5px">Page ${i + 1}</p>
        <a href="${url}"><img src="${url}" alt="Binder ${i+1}" style="width:200px;height:140px;object-fit:cover;border-radius:8px;border:1px solid #d8d4cc;display:block"/></a>
      </div>`;
    });
    html += `</div></div>`;
  }

  html += `
  <div style="padding:20px 32px;background:#f5f3ee;border-top:1px solid #e8e4dc;text-align:center">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a1a1a">Trinity Solutions Insurance Agency</p>
    <p style="margin:0 0 8px;font-size:12px;color:#9a9488">Auto · Home · Business · Property · Life · Health</p>
    <p style="margin:0;font-size:12px;color:#6a6458">5348 Twin Hickory Rd, Glen Allen VA 23059 &nbsp;|&nbsp; 804.944.6226</p>
  </div>
</div></body></html>`;

  return html;
}
