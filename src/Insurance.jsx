// Insurance.jsx — Trinity Solutions Insurance Agency
// Frontend: React + Supabase JS client
// Setup:  npm install @supabase/supabase-js
//         Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client ────────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Photo upload helper ────────────────────────────────────────────────────────
// Converts a base64 data-URL to a Blob and uploads it to Supabase Storage.
// Returns the public URL of the stored file.
async function uploadPhoto(dataUrl, storagePath) {
  const res  = await fetch(dataUrl);
  const blob = await res.blob();
  const ext  = blob.type.includes("png") ? "png" : "jpg";
  const path = `${storagePath}.${ext}`;

  const { data, error } = await supabase.storage
    .from("intake-photos")
    .upload(path, blob, { contentType: blob.type, upsert: true });

  if (error) throw new Error(`Photo upload failed (${path}): ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from("intake-photos")
    .getPublicUrl(data.path);

  return publicUrl;
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;500;600;700&display=swap');`;

// ── Paste your original LOGO_SRC base64 string here ──────────────────────────
// const LOGO_SRC = "data:image/png;base64,iVBORw0KGgo...";
// (copy the full LOGO_SRC value from your original Insurance.jsx)
const LOGO_SRC = ""; // ← replace with your logo base64

/* ── Brand Colors ── */
const brand = {
  black: "#1a1a1a", darkGray: "#2d2d2d",
  orange: "#e07a1a", orangeLight: "#f0943a",
  green: "#2e8c3a",  greenLight: "#3da34a",
  gold: "#d4a020",   goldLight: "#e5b83a",
  accent: "#e07a1a",
  bg: "#fafaf7", bgWarm: "#f5f3ee", bgCard: "#ffffff", bgField: "#fafaf7",
  border: "#d8d4cc", borderLight: "#e8e4dc",
  text: "#1a1a1a", textMuted: "#6a6458", textLight: "#9a9488",
  success: "#2e8c3a", error: "#c0392b",
};

const makeDriver = (i) => ({
  id: Date.now() + i,
  firstName: "", lastName: "", email: "", phone: "", dob: "",
  licenseNumber: "", licenseState: "",
  relation: i === 0 ? "self" : "spouse",
  accidents: "0", violations: "0", srFiling: false,
  licenseFront: null,
});

const makeVehicle = (i) => ({
  id: Date.now() + i + 100,
  year: "", make: "", model: "", vin: "", vinPhoto: null, trim: "",
  mileage: "", annualMiles: "", usage: "commute",
  garageZip: "", ownership: "owned",
  bodilyInjury: "100/300", propertyDamage: "100000",
  collision: "500", comprehensive: "500",
  uninsured: true, roadside: false, rental: false,
});

const inputBase = {
  width: "100%", padding: "11px 14px", border: `1.5px solid ${brand.border}`,
  borderRadius: 8, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
  background: brand.bgField, color: brand.text, outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};
const focusRing = { borderColor: brand.orange, boxShadow: `0 0 0 3px rgba(224,122,26,0.12)` };

const Field = ({ label, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em",
      textTransform: "uppercase", color: brand.textMuted, marginBottom: 6,
      fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
    {children}
  </div>
);

const Input = ({ label, span, ...props }) => {
  const [f, setF] = useState(false);
  return (
    <Field label={label} span={span}>
      <input style={{ ...inputBase, ...(f ? focusRing : {}) }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} {...props} />
    </Field>
  );
};

const Select = ({ label, options, span, ...props }) => {
  const [f, setF] = useState(false);
  return (
    <Field label={label} span={span}>
      <select style={{ ...inputBase, ...(f ? focusRing : {}), appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236a6458' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} {...props}>
        {options.map(o => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
};

const Toggle = ({ label, checked, onChange }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: brand.text }}>
    <div onClick={onChange} style={{
      width: 42, height: 24, borderRadius: 12, padding: 2,
      background: checked ? brand.green : brand.border, transition: "background 0.2s",
      cursor: "pointer", display: "flex", alignItems: "center",
    }}>
      <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
    </div>
    {label}
  </label>
);

const Grid = ({ cols = 2, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "14px 18px" }}>{children}</div>
);

const Divider = () => <hr style={{ border: "none", borderTop: `1px solid ${brand.borderLight}`, margin: "24px 0" }} />;

const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 20, color: brand.black, margin: 0 }}>{title}</h3>
    </div>
    {subtitle && <p style={{ fontSize: 13, color: brand.textLight, margin: 0, paddingLeft: 30 }}>{subtitle}</p>}
  </div>
);

const ItemHeader = ({ number, title, onRemove, canRemove }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${brand.borderLight}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8,
        background: `linear-gradient(135deg, ${brand.orange}, ${brand.green})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{number}</div>
      <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 17, color: brand.black }}>{title}</span>
    </div>
    {canRemove && (
      <button onClick={onRemove} style={{
        background: "none", border: `1.5px solid ${brand.borderLight}`, borderRadius: 8,
        padding: "6px 14px", cursor: "pointer", fontSize: 13, color: brand.error,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.target.style.background = "#fef0ee"; e.target.style.borderColor = "#e8a9a3"; }}
        onMouseLeave={e => { e.target.style.background = "none"; e.target.style.borderColor = brand.borderLight; }}
      >Remove</button>
    )}
  </div>
);

const AddButton = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    width: "100%", padding: "14px", border: `2px dashed ${brand.border}`, borderRadius: 12,
    background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600,
    color: brand.orange, fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  }}
    onMouseEnter={e => { e.currentTarget.style.background = "#fef6ee"; e.currentTarget.style.borderColor = brand.orange; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = brand.border; }}
  >
    <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> {label}
  </button>
);

/* ── License Photo Capture ── */
const LicenseCapture = ({ label, image, onCapture, onRemove }) => {
  const fileRef = useRef(null);
  const [hover, setHover] = useState(false);
  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onCapture(ev.target.result);
    reader.readAsDataURL(file); e.target.value = "";
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em",
        textTransform: "uppercase", color: brand.textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
      {!image ? (
        <div onClick={() => fileRef.current?.click()} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{ border: `2px dashed ${hover ? brand.orange : brand.border}`, borderRadius: 12, padding: "28px 16px",
            cursor: "pointer", background: hover ? "#fef6ee" : brand.bgWarm,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={brand.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: brand.orange, fontFamily: "'DM Sans', sans-serif" }}>Take Photo or Upload</span>
          <span style={{ fontSize: 11.5, color: brand.textLight, fontFamily: "'DM Sans', sans-serif" }}>Tap to use camera or choose file</span>
        </div>
      ) : (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${brand.border}` }}>
          <img src={image} alt={label} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.25) 100%)" }} />
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 6 }}>
            <button onClick={() => fileRef.current?.click()} style={{ padding: "6px 12px", borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.92)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: brand.black, fontFamily: "'DM Sans', sans-serif" }}>Retake</button>
            <button onClick={onRemove} style={{ padding: "6px 12px", borderRadius: 8, border: "none",
              background: "rgba(192,57,43,0.9)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, padding: "4px 10px", borderRadius: 6,
            background: `rgba(46,140,58,0.9)`, fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>✓ Captured</div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
};

/* ── Driver Card ── */
const DriverCard = ({ driver, index, total, onChange, onRemove }) => {
  const u = (k) => (e) => onChange({ ...driver, [k]: e.target.value });
  const t = (k) => () => onChange({ ...driver, [k]: !driver[k] });
  return (
    <div style={{ background: brand.bgWarm, borderRadius: 14, padding: "24px 28px", marginBottom: 16, border: `1px solid ${brand.borderLight}` }}>
      <ItemHeader number={index + 1}
        title={driver.firstName && driver.lastName ? `${driver.firstName} ${driver.lastName}` : `Driver ${index + 1}`}
        onRemove={onRemove} canRemove={total > 1} />
      <Grid cols={2}>
        <Input label="First Name" value={driver.firstName} onChange={u("firstName")} />
        <Input label="Last Name" value={driver.lastName} onChange={u("lastName")} />
        <Input label="Email" type="email" value={driver.email} onChange={u("email")} />
        <Input label="Phone" type="tel" value={driver.phone} onChange={u("phone")} />
        <Input label="Date of Birth" type="date" value={driver.dob} onChange={u("dob")} />
        <Select label="Relation to Applicant" options={[
          { value: "self", label: "Self (Applicant)" }, { value: "spouse", label: "Spouse" },
          { value: "child", label: "Child" }, { value: "parent", label: "Parent" },
          { value: "other", label: "Other Household Member" },
        ]} value={driver.relation} onChange={u("relation")} />
      </Grid>
      <Divider />
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📸</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em",
            textTransform: "uppercase", color: brand.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Driver's License Photo</span>
        </div>
        <LicenseCapture label="Driver's License (Front)" image={driver.licenseFront}
          onCapture={(img) => onChange({ ...driver, licenseFront: img })}
          onRemove={() => onChange({ ...driver, licenseFront: null })} />
      </div>
      <Divider />
      <Grid cols={2}>
        <Input label="License Number" value={driver.licenseNumber} onChange={u("licenseNumber")} />
        <Input label="License State" value={driver.licenseState} onChange={u("licenseState")} />
        <Select label="Accidents (3 yr)" options={[
          { value: "0", label: "None" }, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3+", label: "3+" },
        ]} value={driver.accidents} onChange={u("accidents")} />
        <Select label="Violations (3 yr)" options={[
          { value: "0", label: "None" }, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3+", label: "3+" },
        ]} value={driver.violations} onChange={u("violations")} />
      </Grid>
      <div style={{ marginTop: 14 }}>
        <Toggle label="SR-22 / FR-44 Filing Required" checked={driver.srFiling} onChange={t("srFiling")} />
      </div>
    </div>
  );
};

/* ── VIN Input ── */
const VinInput = ({ vin, vinPhoto, onVinChange, onPhotoCapture, onPhotoRemove }) => {
  const [mode, setMode] = useState("type");
  const [focused, setFocused] = useState(false);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const handleFile = (ref) => (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = (ev) => onPhotoCapture(ev.target.result); r.readAsDataURL(file); e.target.value = "";
  };
  const tabStyle = (active) => ({
    flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
    fontSize: 12.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    background: active ? "#fff" : "transparent", color: active ? brand.black : brand.textLight,
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
    transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  });
  const photoArea = (onClick, hasImg, imgSrc, retakeRef, isUpload) => (
    <div>
      {!hasImg ? (
        <div onClick={onClick} style={{
          border: `2px dashed ${brand.border}`, borderRadius: 12, padding: "24px 16px", cursor: "pointer",
          background: brand.bgWarm, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fef6ee"; e.currentTarget.style.borderColor = brand.orange; }}
          onMouseLeave={e => { e.currentTarget.style.background = brand.bgWarm; e.currentTarget.style.borderColor = brand.border; }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={brand.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {isUpload ? (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>)
              : (<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>)}
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: brand.orange, fontFamily: "'DM Sans', sans-serif" }}>
            {isUpload ? "Upload from Binder or Gallery" : "Tap to Open Camera"}
          </span>
          <span style={{ fontSize: 11.5, color: brand.textLight, fontFamily: "'DM Sans', sans-serif" }}>
            {isUpload ? "Choose a photo showing the VIN" : "Take a clear photo of the VIN plate"}
          </span>
        </div>
      ) : (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${brand.border}` }}>
          <img src={imgSrc} alt="VIN" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%)" }} />
          <div style={{ position: "absolute", top: 8, right: 8, padding: "4px 10px", borderRadius: 6,
            background: `rgba(46,140,58,0.9)`, fontSize: 11, fontWeight: 700, color: "#fff" }}>
            ✓ {isUpload ? "Uploaded" : "Captured"}
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 6 }}>
            <button onClick={() => retakeRef.current?.click()} style={{
              padding: "6px 12px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.92)",
              cursor: "pointer", fontSize: 12, fontWeight: 600, color: brand.black, fontFamily: "'DM Sans', sans-serif",
            }}>{isUpload ? "Replace" : "Retake"}</button>
            <button onClick={onPhotoRemove} style={{
              padding: "6px 12px", borderRadius: 8, border: "none", background: "rgba(192,57,43,0.9)",
              cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans', sans-serif",
            }}>Remove</button>
          </div>
        </div>
      )}
      {vin && hasImg && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#e9f5eb", borderRadius: 8, fontSize: 13, color: brand.green }}>
          VIN also typed: <strong style={{ letterSpacing: "0.08em" }}>{vin}</strong>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ gridColumn: "span 2" }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em",
        textTransform: "uppercase", color: brand.textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>VIN Number</label>
      <div style={{ display: "flex", background: brand.borderLight, borderRadius: 10, padding: 3, marginBottom: 12, gap: 2 }}>
        <button style={tabStyle(mode === "type")} onClick={() => setMode("type")}><span style={{ fontSize: 14 }}>⌨️</span> Type</button>
        <button style={tabStyle(mode === "camera")} onClick={() => setMode("camera")}><span style={{ fontSize: 14 }}>📷</span> Take Photo</button>
        <button style={tabStyle(mode === "upload")} onClick={() => setMode("upload")}><span style={{ fontSize: 14 }}>📄</span> Upload</button>
      </div>
      {mode === "type" && (
        <input value={vin} onChange={(e) => onVinChange(e.target.value.toUpperCase())} placeholder="e.g. 1HGBH41JXMN109186" maxLength={17}
          style={{ ...inputBase, ...(focused ? focusRing : {}), fontFamily: "'DM Sans', monospace", letterSpacing: "0.12em" }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      )}
      {mode === "camera" && (<>{photoArea(() => cameraRef.current?.click(), !!vinPhoto, vinPhoto, cameraRef, false)}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile(cameraRef)} style={{ display: "none" }} /></>)}
      {mode === "upload" && (<>{photoArea(() => uploadRef.current?.click(), !!vinPhoto, vinPhoto, uploadRef, true)}
        <input ref={uploadRef} type="file" accept="image/*" onChange={handleFile(uploadRef)} style={{ display: "none" }} /></>)}
      {mode !== "type" && !vin && vinPhoto && (
        <div style={{ marginTop: 10 }}>
          <input value={vin} onChange={(e) => onVinChange(e.target.value.toUpperCase())} placeholder="Optionally type VIN here too" maxLength={17}
            style={{ ...inputBase, fontSize: 13, padding: "9px 12px", fontFamily: "'DM Sans', monospace", letterSpacing: "0.1em" }} />
        </div>
      )}
    </div>
  );
};

/* ── Vehicle Card ── */
const VehicleCard = ({ vehicle, index, total, onChange, onRemove }) => {
  const u = (k) => (e) => onChange({ ...vehicle, [k]: e.target.value });
  const t = (k) => () => onChange({ ...vehicle, [k]: !vehicle[k] });
  const vLabel = vehicle.year && vehicle.make && vehicle.model
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Vehicle ${index + 1}`;
  return (
    <div style={{ background: brand.bgWarm, borderRadius: 14, padding: "24px 28px", marginBottom: 16, border: `1px solid ${brand.borderLight}` }}>
      <ItemHeader number={index + 1} title={vLabel} onRemove={onRemove} canRemove={total > 1} />
      <Grid cols={3}>
        <Input label="Year" value={vehicle.year} onChange={u("year")} />
        <Input label="Make" value={vehicle.make} onChange={u("make")} />
        <Input label="Model" value={vehicle.model} onChange={u("model")} />
      </Grid>
      <div style={{ height: 14 }} />
      <Grid cols={2}>
        <Input label="Trim / Style" value={vehicle.trim} onChange={u("trim")} />
        <Input label="Current Mileage" value={vehicle.mileage} onChange={u("mileage")} />
        <VinInput vin={vehicle.vin} vinPhoto={vehicle.vinPhoto}
          onVinChange={(val) => onChange({ ...vehicle, vin: val })}
          onPhotoCapture={(img) => onChange({ ...vehicle, vinPhoto: img })}
          onPhotoRemove={() => onChange({ ...vehicle, vinPhoto: null })} />
        <Input label="Est. Annual Miles" value={vehicle.annualMiles} onChange={u("annualMiles")} />
        <Select label="Primary Use" options={[
          { value: "commute", label: "Commute to Work/School" }, { value: "pleasure", label: "Pleasure Only" },
          { value: "business", label: "Business Use" }, { value: "rideshare", label: "Rideshare / Delivery" },
        ]} value={vehicle.usage} onChange={u("usage")} />
        <Input label="Garage ZIP Code" value={vehicle.garageZip} onChange={u("garageZip")} />
        <Select label="Ownership Status" options={[
          { value: "owned", label: "Owned Outright" }, { value: "financed", label: "Financed" },
          { value: "leased", label: "Leased" },
        ]} value={vehicle.ownership} onChange={u("ownership")} />
      </Grid>
      <Divider />
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em",
          textTransform: "uppercase", color: brand.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Coverage for this Vehicle</span>
      </div>
      <Grid cols={2}>
        <Select label="Bodily Injury Limits" options={[
          { value: "25/50", label: "$25K / $50K" }, { value: "50/100", label: "$50K / $100K" },
          { value: "100/300", label: "$100K / $300K" }, { value: "250/500", label: "$250K / $500K" },
        ]} value={vehicle.bodilyInjury} onChange={u("bodilyInjury")} />
        <Select label="Property Damage" options={[
          { value: "25000", label: "$25,000" }, { value: "50000", label: "$50,000" },
          { value: "100000", label: "$100,000" }, { value: "250000", label: "$250,000" },
        ]} value={vehicle.propertyDamage} onChange={u("propertyDamage")} />
        <Select label="Collision Deductible" options={[
          { value: "250", label: "$250" }, { value: "500", label: "$500" },
          { value: "1000", label: "$1,000" }, { value: "none", label: "Decline Coverage" },
        ]} value={vehicle.collision} onChange={u("collision")} />
        <Select label="Comprehensive Deductible" options={[
          { value: "250", label: "$250" }, { value: "500", label: "$500" },
          { value: "1000", label: "$1,000" }, { value: "none", label: "Decline Coverage" },
        ]} value={vehicle.comprehensive} onChange={u("comprehensive")} />
      </Grid>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 16 }}>
        <Toggle label="Uninsured Motorist" checked={vehicle.uninsured} onChange={t("uninsured")} />
        <Toggle label="Roadside Assistance" checked={vehicle.roadside} onChange={t("roadside")} />
        <Toggle label="Rental Reimbursement" checked={vehicle.rental} onChange={t("rental")} />
      </div>
    </div>
  );
};

/* ── Insurance Binder Upload ── */
const BinderUpload = ({ photos, onAdd, onRemove }) => {
  const fileRef = useRef(null);
  const handleFiles = (e) => {
    Array.from(e.target.files || []).forEach(file => { const r = new FileReader(); r.onload = (ev) => onAdd(ev.target.result); r.readAsDataURL(file); });
    e.target.value = "";
  };
  return (
    <div style={{ background: brand.bgWarm, borderRadius: 14, padding: "24px 28px", marginTop: 20, border: `1px solid ${brand.borderLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>📄</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 17, color: brand.black }}>Current Insurance Binder</span>
      </div>
      <p style={{ fontSize: 13, color: brand.textLight, margin: "0 0 16px 30px" }}>Upload or take photos of the client's current insurance declaration page(s)</p>
      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
          {photos.map((img, i) => (
            <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${brand.border}` }}>
              <img src={img} alt={`Binder page ${i + 1}`} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%)" }} />
              <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 8px", borderRadius: 5,
                background: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, color: brand.black }}>Page {i + 1}</div>
              <button onClick={() => onRemove(i)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 6,
                border: "none", cursor: "pointer", background: "rgba(192,57,43,0.9)", color: "#fff",
                fontSize: 14, fontWeight: 700, lineHeight: "24px", textAlign: "center", padding: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div onClick={() => fileRef.current?.click()} style={{
        border: `2px dashed ${brand.border}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer",
        background: brand.bgField, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fef6ee"; e.currentTarget.style.borderColor = brand.orange; }}
        onMouseLeave={e => { e.currentTarget.style.background = brand.bgField; e.currentTarget.style.borderColor = brand.border; }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={brand.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, color: brand.orange, fontFamily: "'DM Sans', sans-serif" }}>
          {photos.length > 0 ? "Add Another Page" : "Take Photo or Upload"}
        </span>
        <span style={{ fontSize: 11.5, color: brand.textLight, fontFamily: "'DM Sans', sans-serif" }}>Tap to use camera or choose file</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} style={{ display: "none" }} />
    </div>
  );
};

/* ── Status Banner ── */
const StatusBanner = ({ status, message }) => {
  if (!status) return null;
  const c = {
    sending: { bg: "#fef6ee", bd: brand.border,  tx: brand.textMuted },
    success: { bg: "#e9f5eb", bd: "#a5d6a7",      tx: brand.success },
    error:   { bg: "#fce8e6", bd: "#f5b7b1",      tx: brand.error },
  }[status];
  return (
    <div style={{ padding: "14px 20px", borderRadius: 10, marginTop: 16, width: "100%",
      background: c.bg, border: `1.5px solid ${c.bd}`, color: c.tx,
      fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
      display: "flex", alignItems: "center", gap: 10, animation: "slideUp 0.3s ease-out" }}>
      {status === "sending" && (
        <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
          <circle cx="9" cy="9" r="7" fill="none" stroke={c.tx} strokeWidth="2" strokeDasharray="30 14" />
        </svg>
      )}
      {status === "success" && <span style={{ flexShrink: 0 }}>✓</span>}
      {status === "error"   && <span style={{ flexShrink: 0 }}>✕</span>}
      {message}
    </div>
  );
};

/* ── Step Indicator ── */
const StepIndicator = ({ current, steps }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: i <= current ? `linear-gradient(135deg, ${brand.orange}, ${brand.green})` : brand.borderLight,
            color: i <= current ? "#fff" : brand.textLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.3s ease",
            boxShadow: i === current ? `0 2px 10px rgba(224,122,26,0.35)` : "none",
          }}>{i + 1}</div>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
            color: i <= current ? brand.black : brand.textLight, fontFamily: "'DM Sans', sans-serif" }}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{ width: 60, height: 2, margin: "0 8px", marginBottom: 22,
            background: i < current ? brand.orange : brand.borderLight, borderRadius: 1, transition: "background 0.3s" }} />
        )}
      </div>
    ))}
  </div>
);

/* ── Main App ── */
export default function AutoInsuranceIntake() {
  const [step, setStep]               = useState(0);
  const [drivers, setDrivers]         = useState([makeDriver(0)]);
  const [vehicles, setVehicles]       = useState([makeVehicle(0)]);
  const [status, setStatus]           = useState(null);
  const [statusMsg, setStatusMsg]     = useState("");
  const [binderPhotos, setBinderPhotos] = useState([]);
  const [applicant, setApplicant]     = useState({
    email: "", phone: "", address: "", city: "", state: "", zip: "",
  });
  const ua = (k) => (e) => setApplicant({ ...applicant, [k]: e.target.value });

  const updateDriver  = (idx, d) => { const a = [...drivers];  a[idx] = d; setDrivers(a); };
  const removeDriver  = (idx)    => setDrivers(drivers.filter((_, i) => i !== idx));
  const addDriver     = ()       => setDrivers([...drivers, makeDriver(drivers.length)]);
  const updateVehicle = (idx, v) => { const a = [...vehicles]; a[idx] = v; setVehicles(a); };
  const removeVehicle = (idx)    => setVehicles(vehicles.filter((_, i) => i !== idx));
  const addVehicle    = ()       => setVehicles([...vehicles, makeVehicle(vehicles.length)]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const primary = drivers[0];
    if (!primary.firstName || !primary.lastName) {
      setStatus("error");
      setStatusMsg("Please fill in the primary driver's first and last name.");
      setTimeout(() => setStatus(null), 4000);
      return;
    }

    setStatus("sending");
    setStatusMsg("Uploading photos…");

    try {
      const submissionId = crypto.randomUUID();

      // 1. Upload all driver license photos → replace base64 with storage URLs
      const driversWithUrls = await Promise.all(
        drivers.map(async (d, i) => {
          const { licenseFront, ...rest } = d;
          const licenseFrontUrl = licenseFront
            ? await uploadPhoto(licenseFront, `${submissionId}/drivers/${i}/license-front`)
            : null;
          return { ...rest, licenseFrontUrl };
        })
      );

      // 2. Upload all VIN photos
      const vehiclesWithUrls = await Promise.all(
        vehicles.map(async (v, i) => {
          const { vinPhoto, ...rest } = v;
          const vinPhotoUrl = vinPhoto
            ? await uploadPhoto(vinPhoto, `${submissionId}/vehicles/${i}/vin`)
            : null;
          return { ...rest, vinPhotoUrl };
        })
      );

      // 3. Upload binder pages
      const binderPhotoUrls = await Promise.all(
        binderPhotos.map((img, i) =>
          uploadPhoto(img, `${submissionId}/binder/page-${i}`)
        )
      );

      setStatusMsg("Saving your application…");

      // 4. Insert row into Postgres
      const { error: dbError } = await supabase.from("submissions").insert({
        id:                submissionId,
        applicant_email:   applicant.email,
        applicant_phone:   applicant.phone,
        applicant_address: applicant.address,
        applicant_city:    applicant.city,
        applicant_state:   applicant.state,
        applicant_zip:     applicant.zip,
        drivers:           driversWithUrls,
        vehicles:          vehiclesWithUrls,
        binder_photo_urls: binderPhotoUrls,
      });

      if (dbError) throw new Error(dbError.message);

      setStatusMsg("Sending notification email…");

      // 5. Call Vercel API route → generates PDF + sends Resend email
      const fnRes = await fetch("/api/send-intake-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      if (!fnRes.ok) {
        const err = await fnRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Email API error ${fnRes.status}`);
      }

      setStatus("success");
      setStatusMsg("Application submitted! A Trinity Solutions agent will be in touch shortly.");
      setTimeout(() => setStatus(null), 6000);
    } catch (err) {
      console.error("[handleSubmit]", err);
      setStatus("error");
      setStatusMsg(`Something went wrong — please try again or call 804.944.6226. (${err.message})`);
      setTimeout(() => setStatus(null), 7000);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const steps = ["Drivers", "Vehicles", "Review"];
  const reviewLabel = (l, v) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${brand.borderLight}` }}>
      <span style={{ color: brand.textMuted, fontSize: 13 }}>{l}</span>
      <span style={{ color: brand.black, fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{v || "—"}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(170deg, #f0ede6 0%, ${brand.bg} 35%, #edeae3 100%)`,
      fontFamily: "'DM Sans', sans-serif", color: brand.text }}>
      <style>{FONTS}</style>
      <style>{`
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: none; }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>

      {/* ── Branded Header ── */}
      <div style={{ background: brand.black, position: "relative", overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${brand.orange} 0%, ${brand.orange} 33%, ${brand.green} 33%, ${brand.green} 66%, ${brand.gold} 66%, ${brand.gold} 100%)` }} />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
            {LOGO_SRC && <img src={LOGO_SRC} alt="Trinity Solutions" style={{ width: 64, height: 64, borderRadius: 12, background: "#fff", padding: 4 }} />}
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 26, color: "#fff", margin: 0 }}>Trinity Solutions</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "2px 0 0", fontWeight: 500, letterSpacing: "0.06em" }}>Insurance Agency</p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginBottom: 22, paddingLeft: 2 }}>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>📍</span> 5348 Twin Hickory Rd, Glen Allen VA 23059
            </span>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>📞</span> 804.944.6226
            </span>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>✉️</span> Tajbizllc@gmail.com
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 26px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 6, height: 36, borderRadius: 3, background: `linear-gradient(180deg, ${brand.orange}, ${brand.green})` }} />
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: 21, color: "#fff", margin: 0 }}>Auto Insurance Intake</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>Add all drivers and vehicles for your policy quote</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div style={{ maxWidth: 720, margin: "-16px auto 0", padding: "0 20px 60px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 36px 36px",
          boxShadow: "0 4px 24px rgba(26,26,26,0.06), 0 1px 3px rgba(26,26,26,0.04)",
          border: `1px solid ${brand.borderLight}` }}>

          <StepIndicator current={step} steps={steps} />

          <div key={step} style={{ animation: "slideUp 0.3s ease-out" }}>

            {/* ── Step 0: Drivers ── */}
            {step === 0 && (
              <div>
                <SectionHeader icon="🏠" title="Applicant Contact" subtitle="Primary contact and home address for the policy" />
                <div style={{ background: brand.bgWarm, borderRadius: 14, padding: "24px 28px", marginBottom: 24, border: `1px solid ${brand.borderLight}` }}>
                  <Grid cols={2}>
                    <Input label="Email Address" type="email" value={applicant.email} onChange={ua("email")} placeholder="you@email.com" />
                    <Input label="Phone Number" type="tel" value={applicant.phone} onChange={ua("phone")} placeholder="(804) 555-1234" />
                    <Input label="Home Address" value={applicant.address} onChange={ua("address")} span={2} placeholder="Street address" />
                    <Input label="City" value={applicant.city} onChange={ua("city")} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                      <Input label="State" value={applicant.state} onChange={ua("state")} placeholder="VA" />
                      <Input label="ZIP Code" value={applicant.zip} onChange={ua("zip")} placeholder="23059" />
                    </div>
                  </Grid>
                </div>

                <SectionHeader icon="👥" title="Drivers" subtitle={`${drivers.length} driver${drivers.length > 1 ? "s" : ""} — add everyone who will drive these vehicles`} />
                {drivers.map((d, i) => (
                  <DriverCard key={d.id} driver={d} index={i} total={drivers.length}
                    onChange={(v) => updateDriver(i, v)} onRemove={() => removeDriver(i)} />
                ))}
                {drivers.length < 6 && <AddButton label="Add Another Driver" onClick={addDriver} />}
                <BinderUpload photos={binderPhotos}
                  onAdd={(img) => setBinderPhotos([...binderPhotos, img])}
                  onRemove={(idx) => setBinderPhotos(binderPhotos.filter((_, i) => i !== idx))} />
              </div>
            )}

            {/* ── Step 1: Vehicles ── */}
            {step === 1 && (
              <div>
                <SectionHeader icon="🚘" title="Vehicles" subtitle={`${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""} — include all vehicles for this policy`} />
                {vehicles.map((v, i) => (
                  <VehicleCard key={v.id} vehicle={v} index={i} total={vehicles.length}
                    onChange={(val) => updateVehicle(i, val)} onRemove={() => removeVehicle(i)} />
                ))}
                {vehicles.length < 8 && <AddButton label="Add Another Vehicle" onClick={addVehicle} />}
              </div>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && (
              <div>
                <SectionHeader icon="📋" title="Review & Submit" subtitle="Please confirm all information is correct" />
                <div style={{ background: brand.bgWarm, borderRadius: 12, padding: "20px 24px", marginBottom: 14, border: `1px solid ${brand.borderLight}` }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 16, color: brand.black, marginBottom: 10 }}>🏠 Applicant Contact</div>
                  {reviewLabel("Email",   applicant.email)}
                  {reviewLabel("Phone",   applicant.phone)}
                  {reviewLabel("Address", `${applicant.address}${applicant.city ? `, ${applicant.city}` : ""}${applicant.state ? `, ${applicant.state}` : ""} ${applicant.zip}`)}
                </div>
                {drivers.map((d, i) => (
                  <div key={d.id} style={{ background: brand.bgWarm, borderRadius: 12, padding: "20px 24px", marginBottom: 14, border: `1px solid ${brand.borderLight}` }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 16, color: brand.black, marginBottom: 10 }}>
                      Driver {i + 1}: {d.firstName} {d.lastName} {d.relation === "self" ? "(Applicant)" : `(${d.relation})`}
                    </div>
                    {reviewLabel("Email",               d.email)}
                    {reviewLabel("Phone",               d.phone)}
                    {reviewLabel("DOB",                 d.dob)}
                    {reviewLabel("License",             `${d.licenseNumber} — ${d.licenseState}`)}
                    {reviewLabel("Accidents / Viol.",   `${d.accidents} / ${d.violations}`)}
                    {d.srFiling && reviewLabel("SR-22/FR-44", "Required")}
                    {d.licenseFront && (
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: brand.textMuted, textTransform: "uppercase" }}>Driver's License</span>
                        <img src={d.licenseFront} alt="License" style={{ width: 180, height: 115, objectFit: "cover", borderRadius: 8, display: "block", marginTop: 8, border: `1px solid ${brand.border}` }} />
                      </div>
                    )}
                  </div>
                ))}
                {vehicles.map((v, i) => (
                  <div key={v.id} style={{ background: brand.bgWarm, borderRadius: 12, padding: "20px 24px", marginBottom: 14, border: `1px solid ${brand.borderLight}` }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 16, color: brand.black, marginBottom: 10 }}>
                      Vehicle {i + 1}: {v.year} {v.make} {v.model} {v.trim}
                    </div>
                    {reviewLabel("VIN",             v.vin || (v.vinPhoto ? "See photo" : "—"))}
                    {reviewLabel("Mileage / Annual",`${v.mileage} / ${v.annualMiles}`)}
                    {reviewLabel("Usage",           v.usage)}
                    {reviewLabel("Ownership",       v.ownership)}
                    {reviewLabel("Garage ZIP",      v.garageZip)}
                    {reviewLabel("Bodily Injury",   v.bodilyInjury)}
                    {reviewLabel("Property Damage", `$${v.propertyDamage}`)}
                    {reviewLabel("Collision",       v.collision === "none" ? "Declined" : `$${v.collision}`)}
                    {reviewLabel("Comprehensive",   v.comprehensive === "none" ? "Declined" : `$${v.comprehensive}`)}
                    {reviewLabel("Add-ons",         [v.uninsured && "UM", v.roadside && "Roadside", v.rental && "Rental"].filter(Boolean).join(", ") || "None")}
                    {v.vinPhoto && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: brand.textLight }}>VIN Photo</span>
                        <img src={v.vinPhoto} alt="VIN" style={{ width: 200, height: 110, objectFit: "cover", borderRadius: 8, display: "block", marginTop: 4, border: `1px solid ${brand.border}` }} />
                      </div>
                    )}
                  </div>
                ))}
                {binderPhotos.length > 0 && (
                  <div style={{ background: brand.bgWarm, borderRadius: 12, padding: "20px 24px", marginBottom: 14, border: `1px solid ${brand.borderLight}` }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 16, color: brand.black, marginBottom: 12 }}>
                      📄 Insurance Binder ({binderPhotos.length} page{binderPhotos.length > 1 ? "s" : ""})
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {binderPhotos.map((img, i) => (
                        <div key={i}>
                          <span style={{ fontSize: 11, color: brand.textLight }}>Page {i + 1}</span>
                          <img src={img} alt={`Binder ${i + 1}`} style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8, display: "block", marginTop: 4, border: `1px solid ${brand.border}` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: step === 0 ? "flex-end" : "space-between",
            alignItems: "flex-start", flexWrap: "wrap" }}>
            {step > 0 && (
              <button onClick={() => { setStep(step - 1); setStatus(null); }} style={{
                padding: "13px 32px", border: `1.5px solid ${brand.border}`, borderRadius: 12,
                background: "transparent", cursor: "pointer", fontSize: 15, fontWeight: 600,
                color: brand.textMuted, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}>← Back</button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep(step + 1)} style={{
                padding: "13px 36px", border: "none", borderRadius: 12, cursor: "pointer",
                fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                background: `linear-gradient(135deg, ${brand.orange}, ${brand.green})`, color: "#fff",
                boxShadow: `0 4px 16px rgba(224,122,26,0.25)`, transition: "all 0.2s",
              }}>Continue →</button>
            ) : (
              <button onClick={handleSubmit} disabled={status === "sending"} style={{
                padding: "13px 40px", border: "none", borderRadius: 12,
                cursor: status === "sending" ? "not-allowed" : "pointer",
                fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                background: status === "success"
                  ? `linear-gradient(135deg, ${brand.green}, #1a6b2a)`
                  : `linear-gradient(135deg, ${brand.orange}, ${brand.green})`,
                color: "#fff", opacity: status === "sending" ? 0.7 : 1,
                boxShadow: `0 4px 16px rgba(224,122,26,0.25)`, transition: "all 0.3s",
              }}>
                {status === "sending" ? "Sending…" : status === "success" ? "✓ Submitted" : "Submit Application"}
              </button>
            )}
          </div>
          {step === 2 && <StatusBanner status={status} message={statusMsg} />}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 20 }}>
          {LOGO_SRC && <img src={LOGO_SRC} alt="Trinity Solutions" style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 8 }} />}
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 14, color: brand.black, margin: "0 0 4px" }}>Trinity Solutions Insurance Agency</p>
          <p style={{ fontSize: 11.5, color: brand.textLight, margin: "0 0 2px", letterSpacing: "0.03em" }}>Auto | Home | Business | Property | Life | Health</p>
          <p style={{ fontSize: 11.5, color: brand.textMuted, margin: "10px 0 2px", lineHeight: 1.6 }}>5348 Twin Hickory Rd, Glen Allen VA 23059</p>
          <p style={{ fontSize: 11.5, color: brand.textMuted, margin: "0 0 2px" }}>804.944.6226 &nbsp;|&nbsp; Tajbizllc@gmail.com</p>
          <p style={{ fontSize: 11, color: brand.textLight, lineHeight: 1.5, margin: "10px 0 0" }}>
            Information collected is used solely for quoting purposes. All data is handled per our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
