import { useState, useCallback, useRef, useEffect } from "react";

/* ─── ID generator ─── */
let _id = 1000;
const uid = () => ++_id;

/* ─── Section Types ─── */
const SECTION_TYPES = {
  text: { label: "テキスト（自由記述）" },
  timeline: { label: "年月 ＋ 内容（経歴向け）" },
};

/* ─── Default Sections ─── */
const makeDefaults = () => [
  { id: uid(), title: "学歴", type: "timeline", items: [{ id: uid(), year: "", month: "", content: "" }], text: "" },
  { id: uid(), title: "職歴", type: "timeline", items: [{ id: uid(), year: "", month: "", content: "" }], text: "" },
  { id: uid(), title: "免許・資格", type: "timeline", items: [{ id: uid(), year: "", month: "", content: "" }], text: "" },
  { id: uid(), title: "志望動機", type: "text", items: [], text: "" },
  { id: uid(), title: "自己PR", type: "text", items: [], text: "" },
];

const INITIAL = {
  lastName: "", firstName: "",
  lastNameKana: "", firstNameKana: "",
  email: "", phone: "", postalCode: "",
  address: "",
  birthYear: "", birthMonth: "", birthDay: "",
  photo: null,
};

/* ─── A4 dimensions (mm) ─── */
const A4_W = 210;
const A4_H = 297;
const PAD_V = 14;
const PAD_H = 16;

/* ─── Palette ─── */
const T = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  border: "#CDCAC2",
  borderLight: "#E2DFD9",
  text: "#1C1B18",
  textSec: "#6B6760",
  textTer: "#9E9A93",
  accent: "#2B4A6F",
  accentLight: "#E9EFF5",
  danger: "#9E3324",
  dangerBg: "#FAF0ED",
  radius: "8px",
  radiusSm: "5px",
  shadow: "0 1px 2px rgba(0,0,0,0.06)",
  font: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
};

const btnBase = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  borderRadius: T.radiusSm, fontSize: "13px", fontWeight: 600,
  fontFamily: T.font, cursor: "pointer", transition: "all 0.15s",
  whiteSpace: "nowrap", lineHeight: 1,
};

const btn = (v = "primary") => ({
  ...btnBase,
  padding: "8px 16px",
  border: v === "outline" ? `1px solid ${T.border}` : "none",
  background: v === "primary" ? T.accent : v === "danger" ? T.dangerBg : v === "ghost" ? "transparent" : "transparent",
  color: v === "primary" ? "#fff" : v === "danger" ? T.danger : T.text,
});

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: T.radiusSm,
  border: `1px solid ${T.border}`, fontSize: "14px", fontFamily: T.font,
  color: T.text, background: T.surface, outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const selectStyle = {
  ...inputStyle,
  width: "auto",
  paddingRight: "8px",
  appearance: "auto",
  cursor: "pointer",
};

const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 700, color: T.textSec,
  marginBottom: "4px", letterSpacing: "0.04em",
};

/* ─── CharCount ─── */
function CharCount({ value, max }) {
  const len = (value || "").length;
  const over = max && len > max;
  return (
    <span style={{
      fontSize: "11px", color: over ? T.danger : T.textTer, fontWeight: 500,
      fontVariantNumeric: "tabular-nums",
    }}>
      {len}文字{max ? ` / ${max}` : ""}
    </span>
  );
}

/* ─── Tiny Components ─── */
function Field({ label, children, charCount }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
        <label style={labelStyle}>{label}</label>
        {charCount}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", style: s }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ ...inputStyle, ...s }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />;
}

function Textarea({ value, onChange, placeholder, rows = 5 }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
    onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />;
}

/* ─── Date Picker (year / month / day dropdowns) ─── */
function DatePicker({ year, month, day, onChangeYear, onChangeMonth, onChangeDay }) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 80; y--) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      <select value={year} onChange={e => onChangeYear(e.target.value)} style={selectStyle}>
        <option value="">--</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <span style={{ fontSize: "13px", color: T.textSec }}>年</span>
      <select value={month} onChange={e => onChangeMonth(e.target.value)} style={selectStyle}>
        <option value="">--</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <span style={{ fontSize: "13px", color: T.textSec }}>月</span>
      <select value={day} onChange={e => onChangeDay(e.target.value)} style={selectStyle}>
        <option value="">--</option>
        {days.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <span style={{ fontSize: "13px", color: T.textSec }}>日</span>
    </div>
  );
}

/* ─── Format helpers ─── */
function formatPostal(v) {
  const d = (v || "").replace(/[^0-9]/g, "");
  if (!d) return "";
  if (d.length <= 3) return d;
  return d.slice(0, 3) + "-" + d.slice(3, 7);
}

function formatBirthdate(year, month, day) {
  if (!year && !month && !day) return "";
  const parts = [];
  if (year) parts.push(`${year}年`);
  if (month) parts.push(`${month}月`);
  if (day) parts.push(`${day}日`);
  return parts.join("");
}

/* ─── Timeline Editor ─── */
function TimelineEditor({ items, onChange }) {
  const update = (id, key, val) => onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i));
  const remove = (id) => onChange(items.filter(i => i.id !== id));
  const add = () => onChange([...items, { id: uid(), year: "", month: "", content: "" }]);
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "68px 52px 1fr 30px", gap: "5px", marginBottom: "6px", alignItems: "center" }}>
          <input style={{ ...inputStyle, padding: "7px 4px", textAlign: "center", fontSize: "13px" }} placeholder="年" value={item.year} onChange={e => update(item.id, "year", e.target.value)} />
          <input style={{ ...inputStyle, padding: "7px 4px", textAlign: "center", fontSize: "13px" }} placeholder="月" value={item.month} onChange={e => update(item.id, "month", e.target.value)} />
          <input style={{ ...inputStyle, fontSize: "13px" }} placeholder="内容を入力" value={item.content} onChange={e => update(item.id, "content", e.target.value)} />
          {items.length > 1 && (
            <button onClick={() => remove(item.id)} style={{ ...btnBase, padding: "4px", justifyContent: "center", width: "30px", height: "30px", border: "none", background: "none", color: T.danger, fontSize: "14px" }} title="削除">×</button>
          )}
        </div>
      ))}
      <button onClick={add} style={{ ...btn("outline"), marginTop: "2px", fontSize: "12px", padding: "6px 12px" }}>＋ 行を追加</button>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, onDelete, onMoveUp, onMoveDown, isFirst, isLast, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.borderLight}`, marginBottom: "10px", overflow: "hidden", boxShadow: T.shadow }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "6px 8px 6px 16px", borderBottom: open ? `1px solid ${T.borderLight}` : "none" }}>
        <button onClick={() => setOpen(!open)} style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", padding: "7px 0", border: "none", background: "none", cursor: "pointer", fontFamily: T.font, fontSize: "14px", fontWeight: 700, color: T.text, textAlign: "left" }}>
          {title}
          <span style={{ marginLeft: "auto", fontSize: "10px", color: T.textTer, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>&#9660;</span>
        </button>
        <div style={{ display: "flex", gap: "1px", alignItems: "center", marginLeft: "4px" }}>
          {!isFirst && <button onClick={onMoveUp} style={{ ...btnBase, padding: "5px 7px", fontSize: "12px", border: "none", background: "none", color: T.textSec }} title="上へ移動">&#9650;</button>}
          {!isLast && <button onClick={onMoveDown} style={{ ...btnBase, padding: "5px 7px", fontSize: "12px", border: "none", background: "none", color: T.textSec }} title="下へ移動">&#9660;</button>}
          <button onClick={onDelete} style={{ ...btnBase, padding: "5px 7px", fontSize: "12px", border: "none", background: "none", color: T.danger }} title="セクションを削除">削除</button>
        </div>
      </div>
      {open && <div style={{ padding: "12px 16px 16px" }}>{children}</div>}
    </div>
  );
}

/* ─── Editable Title ─── */
function EditableTitle({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  if (editing) {
    return <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={() => { onChange(draft); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      style={{ ...inputStyle, fontSize: "14px", fontWeight: 700, padding: "3px 8px", width: "180px" }}
      onClick={e => e.stopPropagation()} />;
  }
  return <span onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }} title="ダブルクリックで名前を変更" style={{ cursor: "text" }}>{value}</span>;
}

/* ─── Add Section Modal ─── */
function AddSectionPanel({ onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("text");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ id: uid(), title: title.trim(), type, items: type === "timeline" ? [{ id: uid(), year: "", month: "", content: "" }] : [], text: "" });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "12px", padding: "28px", width: "380px", maxWidth: "90vw", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 800, fontFamily: T.font }}>セクションを追加</h3>
        <Field label="セクション名">
          <Input value={title} onChange={setTitle} placeholder="例: 研究実績、ポートフォリオ" />
        </Field>
        <Field label="入力タイプ">
          <div style={{ display: "flex", gap: "8px" }}>
            {Object.entries(SECTION_TYPES).map(([key, { label }]) => (
              <button key={key} onClick={() => setType(key)}
                style={{
                  flex: 1, padding: "12px", borderRadius: T.radiusSm, cursor: "pointer",
                  border: `2px solid ${type === key ? T.accent : T.border}`,
                  background: type === key ? T.accentLight : "transparent",
                  color: type === key ? T.accent : T.text,
                  fontWeight: 600, fontSize: "12px", fontFamily: T.font, textAlign: "center",
                }}>
                {label}
              </button>
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", gap: "8px", marginTop: "20px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btn("outline")}>キャンセル</button>
          <button onClick={handleAdd} style={{ ...btn("primary"), opacity: title.trim() ? 1 : 0.4 }}>追加</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Linkify ─── */
function Linkify({ text }) {
  if (!text) return null;
  const pattern = /(https?:\/\/[^\s]+)|([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) {
      parts.push(<a key={match.index} href={match[1]} target="_blank" rel="noopener noreferrer" style={{ color: "#2B4A6F", textDecoration: "underline" }}>{match[1]}</a>);
    } else if (match[2]) {
      parts.push(<a key={match.index} href={`mailto:${match[2]}`} style={{ color: "#2B4A6F", textDecoration: "underline" }}>{match[2]}</a>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

function LinkifyBlock({ text }) {
  if (!text) return null;
  return <>{text.split("\n").map((line, i) => (<span key={i}>{i > 0 && <br />}<Linkify text={line} /></span>))}</>;
}

/* ═══════════════════════════════════════════════
   Preview (A4)
   ═══════════════════════════════════════════════ */
function ResumePreview({ basic, sections }) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日現在`;

  const border = "1px solid #4A4A4A";
  const cell = { border, padding: "7px 10px", fontSize: "10.5px", lineHeight: 1.55, verticalAlign: "top" };
  const hCell = { ...cell, background: "#F0EEE9", fontWeight: 700, textAlign: "center", fontSize: "10px", whiteSpace: "nowrap", width: "1%" };

  const fullName = [basic.lastName, basic.firstName].filter(Boolean).join("\u3000");
  const fullKana = [basic.lastNameKana, basic.firstNameKana].filter(Boolean).join("\u3000");
  const postalDisplay = basic.postalCode ? `〒${formatPostal(basic.postalCode)}` : "";
  const birthdateDisplay = formatBirthdate(basic.birthYear, basic.birthMonth, basic.birthDay);

  const emailLink = basic.email ? (
    <a href={`mailto:${basic.email}`} style={{ color: "#2B4A6F", textDecoration: "underline" }}>{basic.email}</a>
  ) : null;

  return (
    <div id="resume-print-area" style={{
      width: `${A4_W}mm`, background: "#fff", color: "#1A1A1A",
      fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
      fontSize: "11px", lineHeight: 1.6, boxSizing: "border-box",
    }}>
      <style>{`
        @media print {
          #resume-print-area { width: auto; }
          .resume-section-block { break-inside: avoid; page-break-inside: avoid; }
          .resume-page-pad { padding: ${PAD_V}mm ${PAD_H}mm; }
        }
        @media screen { .resume-section-block { break-inside: avoid; } }
      `}</style>

      <div style={{ padding: `${PAD_V}mm ${PAD_H}mm` }} className="resume-page-pad">
        {/* Title */}
        <div className="resume-section-block">
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "0.18em", margin: 0 }}>履 歴 書</h1>
          </div>
          <div style={{ textAlign: "right", fontSize: "9px", color: "#666", marginBottom: "12px" }}>{dateStr}</div>

          {/* ── Info table + Photo (always show photo box) ── */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {/* Name block: furigana + name, no inner border */}
                  <tr>
                    <td style={{ ...hCell, width: "70px", borderBottom: "none", verticalAlign: "bottom", paddingBottom: "0" }}>ふりがな</td>
                    <td style={{ ...cell, borderBottom: "none", fontSize: "9px", color: "#666", paddingBottom: "2px", verticalAlign: "bottom" }}>{fullKana || "\u3000"}</td>
                  </tr>
                  <tr>
                    <td style={{ ...hCell, width: "70px", borderTop: "none", verticalAlign: "top", paddingTop: "0" }}>氏名</td>
                    <td style={{ ...cell, borderTop: "none", fontSize: "15px", fontWeight: 700, padding: "4px 10px 9px" }}>{fullName || "\u3000"}</td>
                  </tr>

                  {/* Birthdate */}
                  {birthdateDisplay && (
                    <tr><td style={hCell}>生年月日</td><td style={cell}>{birthdateDisplay}</td></tr>
                  )}

                  {/* Address block: postal + address, no inner border */}
                  {(postalDisplay || basic.address) && (
                    <>
                      <tr>
                        <td style={{ ...hCell, borderBottom: basic.address ? "none" : border, verticalAlign: "bottom", paddingBottom: basic.address ? "2px" : "7px" }}>住所</td>
                        <td style={{ ...cell, borderBottom: basic.address ? "none" : border, fontSize: "9.5px", color: "#555", paddingBottom: basic.address ? "2px" : "7px", verticalAlign: "bottom" }}>
                          {postalDisplay}
                        </td>
                      </tr>
                      {basic.address && (
                        <tr>
                          <td style={{ ...hCell, borderTop: "none", paddingTop: "0" }}></td>
                          <td style={{ ...cell, borderTop: "none", paddingTop: "2px" }}>{basic.address}</td>
                        </tr>
                      )}
                    </>
                  )}

                  {/* Contact */}
                  <tr>
                    <td style={hCell}>連絡先</td>
                    <td style={cell}>
                      {basic.phone && <span>{basic.phone}</span>}
                      {basic.phone && basic.email && <span>{"\u3000/\u3000"}</span>}
                      {emailLink}
                      {!basic.phone && !basic.email && "\u3000"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo box: always visible */}
            <div style={{
              width: "30mm", height: "40mm", border,
              flexShrink: 0, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: basic.photo ? "transparent" : "#FAFAF8",
            }}>
              {basic.photo ? (
                <img src={basic.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "8px", color: "#BBB", textAlign: "center", lineHeight: 1.5 }}>写真</span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic sections */}
        {sections.map(sec => {
          if (sec.type === "timeline") {
            const filled = sec.items.filter(i => i.content);
            if (!filled.length) return null;
            return (
              <div key={sec.id} className="resume-section-block" style={{ marginBottom: "14px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr><td colSpan={3} style={{ ...hCell, fontSize: "10.5px", letterSpacing: "0.12em", padding: "6px 10px" }}>{sec.title}</td></tr>
                    <tr>
                      <td style={{ ...hCell, width: "50px" }}>年</td>
                      <td style={{ ...hCell, width: "32px" }}>月</td>
                      <td style={hCell}>内容</td>
                    </tr>
                  </thead>
                  <tbody>
                    {filled.map((i, idx) => (
                      <tr key={idx}>
                        <td style={{ ...cell, textAlign: "center", width: "50px" }}>{i.year}</td>
                        <td style={{ ...cell, textAlign: "center", width: "32px" }}>{i.month}</td>
                        <td style={cell}><Linkify text={i.content} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          if (!sec.text) return null;
          return (
            <div key={sec.id} className="resume-section-block" style={{ marginBottom: "14px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ ...hCell, width: "90px" }}>{sec.title}</td>
                    <td style={cell}><LinkifyBlock text={sec.text} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Page Overlay ─── */
function PageOverlay({ contentRef }) {
  const [pages, setPages] = useState(1);
  useEffect(() => {
    if (!contentRef.current) return;
    const obs = new ResizeObserver(() => {
      const h = contentRef.current.scrollHeight;
      const pageH = A4_H * 3.7795;
      setPages(Math.max(1, Math.ceil(h / pageH)));
    });
    obs.observe(contentRef.current);
    return () => obs.disconnect();
  }, [contentRef]);
  const pageH = A4_H * 3.7795;
  return (
    <>
      {Array.from({ length: pages - 1 }, (_, i) => (
        <div key={i} style={{ position: "absolute", top: `${(i + 1) * pageH}px`, left: 0, right: 0, height: 0, borderTop: "2px dashed #B0ADA6", zIndex: 10 }}>
          <span style={{ position: "absolute", right: "8px", top: "-20px", fontSize: "10px", color: T.textTer, background: "#E5E2DC", padding: "2px 8px", borderRadius: "3px", fontFamily: T.font, fontWeight: 600 }}>
            {i + 1} / {pages} ページ
          </span>
        </div>
      ))}
      <div style={{ position: "absolute", right: "8px", bottom: "8px", fontSize: "10px", color: T.textTer, background: "#E5E2DC", padding: "2px 8px", borderRadius: "3px", fontFamily: T.font, fontWeight: 600 }}>
        {pages > 1 ? `${pages} / ${pages} ページ` : "1 ページ"}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════════ */
export default function ResumeBuilder() {
  const [basic, setBasic] = useState(INITIAL);
  const [sections, setSections] = useState(makeDefaults);
  const [showAdd, setShowAdd] = useState(false);
  const previewRef = useRef(null);

  const setB = key => val => setBasic(d => ({ ...d, [key]: val }));

  const updateSection = useCallback((id, patch) => {
    setSections(ss => ss.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const deleteSection = (id) => {
    if (confirm("このセクションを削除しますか？")) setSections(ss => ss.filter(s => s.id !== id));
  };

  const moveSection = (id, dir) => {
    setSections(ss => {
      const idx = ss.findIndex(s => s.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= ss.length) return ss;
      const next = [...ss];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const handlePhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setB("photo")(ev.target.result);
    r.readAsDataURL(file);
  };

  const handlePrint = () => {
    const el = document.getElementById("resume-print-area");
    if (!el) return;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>履歴書</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        a { color: #2B4A6F; text-decoration: underline; }
        .resume-section-block { break-inside: avoid; page-break-inside: avoid; }
        .resume-page-pad { padding: ${PAD_V}mm ${PAD_H}mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const handleReset = () => {
    if (confirm("入力内容をすべてリセットしますか？")) { setBasic(INITIAL); setSections(makeDefaults()); }
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "10px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "7px", background: T.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "15px", color: "#fff", fontWeight: 900,
          }}>履</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "0.02em" }}>履歴書ビルダー</div>
            <div style={{ fontSize: "11px", color: T.textSec }}>項目を自由にカスタマイズ</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleReset} style={btn("outline")}>リセット</button>
          <button onClick={handlePrint} style={btn("primary")}>印刷 / PDF保存</button>
        </div>
      </header>

      {/* Layout */}
      <div style={{ display: "flex", maxWidth: "1440px", margin: "0 auto", minHeight: "calc(100vh - 56px)" }}>

        {/* ── Editor Panel ── */}
        <div style={{
          width: "430px", minWidth: "380px", padding: "18px",
          overflowY: "auto", maxHeight: "calc(100vh - 56px)",
          borderRight: `1px solid ${T.borderLight}`, background: T.bg,
        }}>
          {/* Basic Info */}
          <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.borderLight}`, marginBottom: "10px", overflow: "hidden", boxShadow: T.shadow }}>
            <div style={{ padding: "13px 16px 4px" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>基本情報</span>
            </div>
            <div style={{ padding: "8px 16px 16px" }}>

              {/* Name: split into 姓 / 名 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="姓" charCount={<CharCount value={basic.lastName} />}>
                  <Input value={basic.lastName} onChange={setB("lastName")} placeholder="山田" />
                </Field>
                <Field label="名" charCount={<CharCount value={basic.firstName} />}>
                  <Input value={basic.firstName} onChange={setB("firstName")} placeholder="太郎" />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="姓（ふりがな）" charCount={<CharCount value={basic.lastNameKana} />}>
                  <Input value={basic.lastNameKana} onChange={setB("lastNameKana")} placeholder="やまだ" />
                </Field>
                <Field label="名（ふりがな）" charCount={<CharCount value={basic.firstNameKana} />}>
                  <Input value={basic.firstNameKana} onChange={setB("firstNameKana")} placeholder="たろう" />
                </Field>
              </div>

              {/* Birthdate with dropdowns */}
              <Field label="生年月日">
                <DatePicker
                  year={basic.birthYear}
                  month={basic.birthMonth}
                  day={basic.birthDay}
                  onChangeYear={setB("birthYear")}
                  onChangeMonth={setB("birthMonth")}
                  onChangeDay={setB("birthDay")}
                />
              </Field>

              {/* Postal code: normal input */}
              <Field label="郵便番号">
                <Input
                  value={basic.postalCode}
                  onChange={v => setB("postalCode")(v.replace(/[^0-9\-]/g, "").slice(0, 8))}
                  placeholder="182-0026"
                  style={{ width: "160px" }}
                />
              </Field>

              <Field label="住所" charCount={<CharCount value={basic.address} />}>
                <Input value={basic.address} onChange={setB("address")} placeholder="東京都渋谷区..." />
              </Field>

              {/* Phone: normal input */}
              <Field label="電話番号">
                <Input
                  value={basic.phone}
                  onChange={v => setB("phone")(v.replace(/[^0-9\-]/g, "").slice(0, 13))}
                  placeholder="090-1234-5678"
                  style={{ width: "200px" }}
                />
              </Field>

              <Field label="メールアドレス">
                <Input value={basic.email} onChange={setB("email")} placeholder="example@mail.com" type="email" />
              </Field>

              <Field label="証明写真">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{ fontSize: "12px", fontFamily: T.font, flex: 1 }} />
                  {basic.photo && (
                    <>
                      <img src={basic.photo} alt="" style={{ width: "32px", height: "42px", objectFit: "cover", borderRadius: "3px", border: `1px solid ${T.border}` }} />
                      <button onClick={() => setB("photo")(null)} style={{ ...btn("danger"), fontSize: "11px", padding: "4px 10px" }}>削除</button>
                    </>
                  )}
                </div>
              </Field>
            </div>
          </div>

          {/* Dynamic Sections */}
          {sections.map((sec, idx) => (
            <SectionCard
              key={sec.id}
              title={<EditableTitle value={sec.title} onChange={v => updateSection(sec.id, { title: v })} />}
              onDelete={() => deleteSection(sec.id)}
              onMoveUp={() => moveSection(sec.id, -1)}
              onMoveDown={() => moveSection(sec.id, 1)}
              isFirst={idx === 0}
              isLast={idx === sections.length - 1}
              defaultOpen={idx < 3}
            >
              {sec.type === "timeline" ? (
                <TimelineEditor items={sec.items} onChange={items => updateSection(sec.id, { items })} />
              ) : (
                <Field label={`${sec.title}を入力`} charCount={<CharCount value={sec.text} />}>
                  <Textarea value={sec.text} onChange={text => updateSection(sec.id, { text })} placeholder={`${sec.title}を入力してください`} rows={6} />
                </Field>
              )}
            </SectionCard>
          ))}

          {/* Add Section Button */}
          <button onClick={() => setShowAdd(true)}
            style={{
              width: "100%", padding: "14px", borderRadius: T.radius,
              border: `1.5px dashed ${T.border}`, background: "transparent",
              color: T.textSec, fontSize: "13px", fontWeight: 700, fontFamily: T.font,
              cursor: "pointer", transition: "all 0.15s", marginBottom: "16px",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSec; e.currentTarget.style.background = "transparent"; }}
          >
            ＋ セクションを追加
          </button>

          <div style={{ padding: "8px 0 24px", textAlign: "center", fontSize: "11px", color: T.textTer, lineHeight: 1.7 }}>
            セクション名はダブルクリックで変更できます<br />
            テキスト内の URL・メールアドレスは PDF でリンクになります
          </div>
        </div>

        {/* ── Preview Panel ── */}
        <div style={{
          flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 56px)",
          background: "#DDDBD6", display: "flex", justifyContent: "center", padding: "24px 16px",
        }}>
          <div style={{
            position: "relative",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            borderRadius: "3px",
            overflow: "hidden",
            height: "fit-content",
            transform: "scale(0.78)",
            transformOrigin: "top center",
          }}>
            <div ref={previewRef} style={{ position: "relative" }}>
              <ResumePreview basic={basic} sections={sections} />
              <PageOverlay contentRef={previewRef} />
            </div>
          </div>
        </div>
      </div>

      {showAdd && <AddSectionPanel onAdd={sec => setSections(ss => [...ss, sec])} onClose={() => setShowAdd(false)} />}

      <style>{`
        @media print { header { display: none !important; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        input:focus, textarea:focus, select:focus { border-color: ${T.accent} !important; box-shadow: 0 0 0 2px ${T.accentLight}; }
      `}</style>
    </div>
  );
}
