import React, { useState, useEffect } from "react";

/*
  Full bilingual Car Wash Daily Sales app (Arabic default)
  - Arabic default, toggle to English
  - Default staff list + add/remove staff
  - Add records: merges (increments quantity) when same date+staff+service+size
  - Detailed records, staff totals, and per-service quantities per staff
  - LocalStorage persistence
  - Clear data and Export CSV (fixed newline bug)
  - Enhanced with modern, colorful, user-friendly UI
*/

const translations = {
  ar: {
    title: "تسجيل مبيعات مغسلة السيارات",
    staff: "الموظف",
    service: "الخدمة",
    size: "الحجم",
    quantity: "العدد",
    add: "إضافة",
    date: "التاريخ",
    summary: "ملخص المبيعات",
    serviceSummary: "ملخص الخدمات",
    totalSales: "إجمالي المبيعات",
    totalPay: "إجمالي أجر الموظف",
    small: "صغير",
    medium: "متوسط",
    big: "كبير",
    inside: "غسيل داخلي",
    outside: "غسيل خارجي",
    whole: "غسيل كامل",
    spray: "رش ماء فقط",
    engine: "غسيل المحرك",
    mirrors: "تنظيف المرايا",
    carpets: "تغطية السجاد",
    coupon: "قسيمة",
    addStaff: "إضافة موظف",
    remove: "حذف",
    clearData: "مسح البيانات",
    exportCSV: "تصدير CSV",
    langToggle: "English"
  },
  en: {
    title: "Car Wash Sales Recording",
    staff: "Staff",
    service: "Service",
    size: "Size",
    quantity: "Quantity",
    add: "Add",
    date: "Date",
    summary: "Sales Summary",
    serviceSummary: "Service Summary",
    totalSales: "Total Sales",
    totalPay: "Total Staff Pay",
    small: "Small",
    medium: "Medium",
    big: "Big",
    inside: "Inside Wash",
    outside: "Outside Wash",
    whole: "Whole Wash",
    spray: "Spray Only",
    engine: "Engine Wash",
    mirrors: "Mirror Cleaning",
    carpets: "Carpet Covering",
    coupon: "Coupon",
    addStaff: "Add Staff",
    remove: "Remove",
    clearData: "Clear Data",
    exportCSV: "Export CSV",
    langToggle: "عربي"
  }
};

// Pricing & staff pay: [price, staffPay]
const SERVICES = {
  whole: { small: [20, 8], medium: [25, 10], big: [30, 12] },
  inside: { any: [10, 4] },
  outside: { small: [15, 5], medium: [20, 8], big: [25, 10] },
  spray: { any: [10, 4] },
  engine: { any: [10, 4] },
  mirrors: { any: [5, 2] },
  carpets: { any: [10, 2] },
  coupon: { small: [0, 4], medium: [0, 5], big: [0, 6] }
};

const DEFAULT_STAFF = ["Suliaman", "Haluna", "Jamil", "Abdula", "Yusuf", "Mudesero"];
const RECORDS_KEY = "car-wash-records";
const STAFF_KEY = "car-wash-staff";

// Safe upsert helper: merges when date+staff+service+size match
function upsertRecordList(list, entry) {
  const safeList = Array.isArray(list) ? [...list] : [];
  const date = String(entry.date || "");
  const staffNorm = String(entry.staffName || "").trim();
  const svc = String(entry.serviceType || "");
  const sz = String(entry.size || "");

  const idx = safeList.findIndex(
    r =>
      String(r.date || "") === date &&
      String(r.staffName || "").trim() === staffNorm &&
      String(r.serviceType || "") === svc &&
      String(r.size || "") === sz
  );

  if (idx > -1) {
    const existing = safeList[idx];
    safeList[idx] = {
      ...existing,
      quantity: (existing.quantity || 0) + (entry.quantity || 0)
    };
  } else {
    safeList.push({
      date,
      staffName: staffNorm,
      serviceType: svc,
      size: sz,
      quantity: entry.quantity || 0
    });
  }
  return safeList;
}

// --- Modern Colorful Styles ---
const COLORS = {
  primary: "#1976d2",
  secondary: "#43a047",
  accent: "#ffb300",
  danger: "#e53935",
  bg: "#f5f7fa",
  card: "#fff",
  border: "#e0e0e0",
  text: "#222",
  tableHeader: "#1976d2",
  tableHeaderText: "#fff"
};

const shadow = "0 2px 8px rgba(0,0,0,0.07)";

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 12,
        boxShadow: shadow,
        padding: 18,
        marginBottom: 18,
        border: `1px solid ${COLORS.border}`,
        ...style
      }}
    >
      {children}
    </div>
  );
}

function Pill({ color, children, style }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: color || COLORS.primary,
        color: "#fff",
        borderRadius: 16,
        padding: "2px 12px",
        fontSize: 13,
        marginRight: 4,
        marginLeft: 4,
        ...style
      }}
    >
      {children}
    </span>
  );
}

function IconBtn({ children, color, ...props }) {
  return (
    <button
      {...props}
      style={{
        background: color || COLORS.primary,
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        padding: "6px 14px",
        fontWeight: 600,
        fontSize: 15,
        transition: "background 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        ...props.style
      }}
    >
      {children}
    </button>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        padding: "7px 10px",
        fontSize: 15,
        outline: "none",
        background: "#fafbfc",
        marginBottom: 0,
        ...props.style
      }}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        padding: "7px 10px",
        fontSize: 15,
        background: "#fafbfc",
        ...props.style
      }}
    >
      {children}
    </select>
  );
}

export default function DailySalesApp() {
  const [lang, setLang] = useState("ar");
  const t = translations[lang];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [staffList, setStaffList] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STAFF_KEY));
      return Array.isArray(s) && s.length ? s : DEFAULT_STAFF;
    } catch (e) {
      return DEFAULT_STAFF;
    }
  });

  const [records, setRecords] = useState(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECORDS_KEY));
      return Array.isArray(r) ? r : [];
    } catch (e) {
      return [];
    }
  });

  const [staffName, setStaffName] = useState(() => DEFAULT_STAFF[0]);
  const [serviceType, setServiceType] = useState("whole");
  const [size, setSize] = useState("small");
  const [quantity, setQuantity] = useState(1);
  const [newStaff, setNewStaff] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STAFF_KEY, JSON.stringify(staffList));
    } catch (e) {}
  }, [staffList]);

  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch (e) {}
  }, [records]);

  function handleAddRecord() {
    const name = String(staffName || "").trim();
    if (!name) return alert(lang === "ar" ? "اختر موظفًا" : "Select a staff member");

    const svc = String(serviceType || "");
    const sz = ["whole", "outside", "coupon"].includes(svc) ? String(size || "") : "any";
    const qty = Number(quantity || 0);
    if (qty <= 0) return alert(lang === "ar" ? "أدخل عدد صالح" : "Enter a valid quantity");

    setRecords(prev => upsertRecordList(prev || [], { date: String(date), staffName: name, serviceType: svc, size: sz, quantity: qty }));
  }

  function addStaff() {
    const name = String(newStaff || "").trim();
    if (!name) return;
    if (!staffList.includes(name)) {
      setStaffList(prev => [...prev, name]);
      setNewStaff("");
    } else {
      alert(lang === "ar" ? "الموظف موجود بالفعل" : "Staff already exists");
    }
  }

  function removeStaff(name) {
    if (!window.confirm(lang === "ar" ? `حذف ${name}؟` : `Remove ${name}?`)) return;
    setStaffList(prev => prev.filter(s => s !== name));
    setRecords(prev => (Array.isArray(prev) ? prev.filter(r => r.staffName !== name) : []));
    if (staffName === name) setStaffName(staffList[0] || "");
  }

  // Staff list with remove button
  const staffListWithRemove = (
    <div style={{ margin: "12px 0", display: "flex", flexWrap: "wrap", gap: 10 }}>
      {staffList.map(s => (
        <span
          key={s}
          style={{
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: 20,
            padding: "4px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#e3f2fd",
            fontWeight: 500,
            marginBottom: 4
          }}
        >
          <span style={{ color: COLORS.primary }}>{s}</span>
          <IconBtn
            onClick={() => removeStaff(s)}
            color={COLORS.danger}
            style={{
              marginLeft: 4,
              padding: "2px 8px",
              fontSize: 13,
              borderRadius: 12,
              boxShadow: "none"
            }}
            title={lang === "ar" ? "حذف الموظف" : "Remove staff"}
          >
            ×
          </IconBtn>
        </span>
      ))}
    </div>
  );

  function clearData() {
    if (!window.confirm(lang === "ar" ? "مسح كل البيانات؟" : "Clear all data?")) return;
    setRecords([]);
    try {
      localStorage.removeItem(RECORDS_KEY);
    } catch (e) {}
  }

  function exportCSV() {
    const header = ["date", "staff", "service", "size", "quantity"];
    const rows = (records || []).map(r => [r.date, r.staffName, r.serviceType, r.size, r.quantity]);
    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carwash_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Derived data for selected date
  const filtered = (records || []).filter(r => String(r.date) === String(date));

  // Staff totals (sales and staff pay)
  const staffSummary = staffList.map(name => {
    const items = filtered.filter(r => r.staffName === name);
    const totals = items.reduce((acc, r) => {
      const svcMeta = SERVICES[r.serviceType] || {};
      const meta = svcMeta[r.size] || svcMeta.any || [0, 0];
      const price = meta[0] || 0;
      const pay = meta[1] || 0;
      acc.totalQuantity += r.quantity || 0;
      acc.totalSales += price * (r.quantity || 0);
      acc.totalPay += pay * (r.quantity || 0);
      return acc;
    }, { totalQuantity: 0, totalSales: 0, totalPay: 0 });
    return { name, ...totals };
  }).filter(s => s.totalQuantity > 0);

  // Service quantity by staff
  const serviceSummary = staffList.map(name => {
    const items = filtered.filter(r => r.staffName === name);
    const summary = {};
    items.forEach(r => {
      const key = r.size === "any" ? r.serviceType : `${r.serviceType}-${r.size}`;
      summary[key] = (summary[key] || 0) + (r.quantity || 0);
    });
    return { name, summary };
  }).filter(s => Object.keys(s.summary).length > 0);

  // Styling direction
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "right" : "left";

  // --- Table Styles ---
  const tableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginBottom: 12,
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: shadow
  };
  const thStyle = {
    background: COLORS.tableHeader,
    color: COLORS.tableHeaderText,
    padding: 10,
    fontWeight: 700,
    fontSize: 15,
    border: "none"
  };
  const tdStyle = {
    padding: 10,
    fontSize: 15,
    borderBottom: `1px solid ${COLORS.border}`,
    textAlign: align
  };

  return (
    <div
      style={{
        direction: dir,
        padding: 0,
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        background: COLORS.bg,
        minHeight: "100vh"
      }}
    >
      <style>{`
        ::selection { background: ${COLORS.accent}33; }
        input:focus, select:focus { border-color: ${COLORS.primary}; box-shadow: 0 0 0 2px ${COLORS.primary}22; }
        button:active { filter: brightness(0.95); }
        @media (max-width: 700px) {
          .flex-row { flex-direction: column !important; gap: 18px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 950, margin: "0 auto", padding: 24 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18
          }}
        >
          <h2
            style={{
              margin: 0,
              color: COLORS.primary,
              fontWeight: 800,
              letterSpacing: 1,
              fontSize: 28
            }}
          >
            <span role="img" aria-label="car" style={{ marginRight: 8, fontSize: 30 }}>
              🚗
            </span>
            {t.title}
          </h2>
          <div style={{ display: "flex", gap: 10 }}>
            <IconBtn
              onClick={() => setLang(l => (l === "ar" ? "en" : "ar"))}
              color={COLORS.accent}
            >
              {t.langToggle}
            </IconBtn>
            <IconBtn onClick={exportCSV} color={COLORS.secondary}>
              {t.exportCSV}
            </IconBtn>
          </div>
        </div>

        {/* Staff Management Section */}
        <Card>
          <h3 style={{ color: COLORS.secondary, marginTop: 0 }}>
            <span role="img" aria-label="staff">👥</span>{" "}
            {lang === "ar" ? "إدارة الموظفين" : "Staff Management"}
          </h3>
          {staffListWithRemove}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <Input
              placeholder={t.addStaff}
              value={newStaff}
              onChange={e => setNewStaff(e.target.value)}
              style={{ width: 180 }}
            />
            <IconBtn onClick={addStaff} color={COLORS.primary}>
              {t.addStaff}
            </IconBtn>
          </div>
        </Card>

        {/* Record Entry Section */}
        <Card>
          <div className="flex-row" style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", alignItems: align, minWidth: 120 }}>
              <span style={{ fontWeight: 600, color: COLORS.primary }}>{t.date}</span>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", alignItems: align, minWidth: 120 }}>
              <span style={{ fontWeight: 600, color: COLORS.primary }}>{t.staff}</span>
              <Select value={staffName} onChange={e => setStaffName(e.target.value)}>
                {staffList.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", alignItems: align, minWidth: 120 }}>
              <span style={{ fontWeight: 600, color: COLORS.primary }}>{t.service}</span>
              <Select value={serviceType} onChange={e => setServiceType(e.target.value)}>
                {Object.keys(SERVICES).map(s => (
                  <option key={s} value={s}>
                    {t[s] || s}
                  </option>
                ))}
              </Select>
            </label>

            {["whole", "outside", "coupon"].includes(serviceType) ? (
              <label style={{ display: "flex", flexDirection: "column", alignItems: align, minWidth: 120 }}>
                <span style={{ fontWeight: 600, color: COLORS.primary }}>{t.size}</span>
                <Select value={size} onChange={e => setSize(e.target.value)}>
                  <option value="small">{t.small}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="big">{t.big}</option>
                </Select>
              </label>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: align, minWidth: 120 }}>
                <span style={{ fontWeight: 600, color: COLORS.primary }}>{t.size}</span>
                <Select value={size} onChange={e => setSize(e.target.value)}>
                  <option value="any">-</option>
                </Select>
              </label>
            )}

            <label style={{ display: "flex", flexDirection: "column", alignItems: align, minWidth: 100 }}>
              <span style={{ fontWeight: 600, color: COLORS.primary }}>{t.quantity}</span>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                style={{ width: 80 }}
              />
            </label>

            <div>
              <IconBtn onClick={handleAddRecord} color={COLORS.secondary} style={{ padding: "10px 18px" }}>
                <span role="img" aria-label="add">➕</span> {t.add}
              </IconBtn>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <IconBtn onClick={clearData} color={COLORS.danger}>
                <span role="img" aria-label="clear">🗑️</span> {t.clearData}
              </IconBtn>
            </div>
          </div>
        </Card>

        {/* Summary Tables */}
        <Card>
          <h3 style={{ color: COLORS.primary, marginTop: 0 }}>
            <span role="img" aria-label="summary">📊</span> {t.summary}
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t.staff}</th>
                <th style={thStyle}>{t.quantity}</th>
                <th style={thStyle}>{t.totalSales}</th>
                <th style={thStyle}>{t.totalPay}</th>
              </tr>
            </thead>
            <tbody>
              {staffSummary.map(s => (
                <tr key={s.name}>
                  <td style={tdStyle}>{s.name}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <Pill color={COLORS.secondary}>{s.totalQuantity}</Pill>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <Pill color={COLORS.primary}>{s.totalSales}</Pill>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <Pill color={COLORS.accent}>{s.totalPay}</Pill>
                  </td>
                </tr>
              ))}
              {staffSummary.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: "center" }}>
                    {lang === "ar" ? "لا توجد بيانات" : "No data"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 style={{ color: COLORS.primary, marginTop: 0 }}>
            <span role="img" aria-label="service">🧽</span> {t.serviceSummary}
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t.staff}</th>
                <th style={thStyle}>{t.service}</th>
                <th style={thStyle}>{t.size}</th>
                <th style={thStyle}>{t.quantity}</th>
              </tr>
            </thead>
            <tbody>
              {serviceSummary.map(s =>
                Object.entries(s.summary).map(([serviceKey, qty]) => {
                  const [svc, sz] = serviceKey.includes("-") ? serviceKey.split("-") : [serviceKey, "any"];
                  return (
                    <tr key={`${s.name}-${serviceKey}`}>
                      <td style={tdStyle}>{s.name}</td>
                      <td style={tdStyle}>{t[svc] || svc}</td>
                      <td style={tdStyle}>{sz === "any" ? "-" : t[sz] || sz}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <Pill color={COLORS.secondary}>{qty}</Pill>
                      </td>
                    </tr>
                  );
                })
              )}
              {serviceSummary.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: "center" }}>
                    {lang === "ar" ? "لا توجد بيانات" : "No data"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <h3 style={{ color: COLORS.primary, marginTop: 0 }}>
            <span role="img" aria-label="details">📋</span>{" "}
            {lang === "ar" ? "السجلات التفصيلية" : "Detailed Records"}
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t.date}</th>
                <th style={thStyle}>{t.staff}</th>
                <th style={thStyle}>{t.service}</th>
                <th style={thStyle}>{t.size}</th>
                <th style={thStyle}>{t.quantity}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{r.date}</td>
                  <td style={tdStyle}>{r.staffName}</td>
                  <td style={tdStyle}>{t[r.serviceType] || r.serviceType}</td>
                  <td style={tdStyle}>{r.size === "any" ? "-" : t[r.size] || r.size}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <Pill color={COLORS.primary}>{r.quantity}</Pill>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center" }}>
                    {lang === "ar" ? "لا توجد بيانات" : "No data"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}