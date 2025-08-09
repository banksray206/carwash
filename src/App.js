import React, { useState, useEffect } from "react";

/*
  Full bilingual Car Wash Daily Sales app (Arabic default)
  - Arabic default, toggle to English
  - Default staff list + add/remove staff
  - Add records: merges (increments quantity) when same date+staff+service+size
  - Detailed records, staff totals, and per-service quantities per staff
  - LocalStorage persistence
  - Clear data and Export CSV (fixed newline bug)
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

// safe upsert helper: merges when date+staff+service+size match
function upsertRecordList(list, entry) {
  const safeList = Array.isArray(list) ? [...list] : [];
  const date = String(entry.date || "");
  const staffNorm = String(entry.staffName || "").trim();
  const svc = String(entry.serviceType || "");
  const sz = String(entry.size || "");

  const idx = safeList.findIndex(r =>
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
    const sz = (["whole", "outside", "coupon"].includes(svc) ? String(size || "") : "any");
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
    <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {staffList.map(s => (
        <span key={s} style={{ border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {s}
          <button
            onClick={() => removeStaff(s)}
            style={{ marginLeft: 4, background: '#f44336', color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer', padding: '2px 6px' }}
            title={lang === "ar" ? "حذف الموظف" : "Remove staff"}
          >
            {t.remove}
          </button>
        </span>
      ))}
    </div>
  );

  function clearData() {
    if (!window.confirm(lang === "ar" ? "مسح كل البيانات؟" : "Clear all data?")) return;
    setRecords([]);
    try { localStorage.removeItem(RECORDS_KEY); } catch (e) {}
  }

  function exportCSV() {
    const header = ["date", "staff", "service", "size", "quantity"];
    const rows = (records || []).map(r => [r.date, r.staffName, r.serviceType, r.size, r.quantity]);
    // fixed: use '\n' to join lines correctly
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
      const meta = svcMeta[r.size] || svcMeta.any || [0,0];
      const price = meta[0] || 0;
      const pay = meta[1] || 0;
      acc.totalQuantity += (r.quantity || 0);
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
      const key = r.size === 'any' ? r.serviceType : `${r.serviceType}-${r.size}`;
      summary[key] = (summary[key] || 0) + (r.quantity || 0);
    });
    return { name, summary };
  }).filter(s => Object.keys(s.summary).length > 0);

  // Styling direction
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';

  return (
    <div style={{ direction: dir, padding: 18, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <div>
          <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ marginLeft: 8 }}>{t.langToggle}</button>
          <button onClick={exportCSV} style={{ marginLeft: 8 }}>{t.exportCSV}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
          {t.date}
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
          {t.staff}
          <select value={staffName} onChange={e => setStaffName(e.target.value)}>
            {staffList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
          {t.service}
          <select value={serviceType} onChange={e => setServiceType(e.target.value)}>
            {Object.keys(SERVICES).map(s => <option key={s} value={s}>{t[s] || s}</option>)}
          </select>
        </label>

        {(["whole","outside","coupon"].includes(serviceType)) ? (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
            {t.size}
            <select value={size} onChange={e => setSize(e.target.value)}>
              <option value="small">{t.small}</option>
              <option value="medium">{t.medium}</option>
              <option value="big">{t.big}</option>
            </select>
          </label>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
            {t.size}
            <select value={size} onChange={e => setSize(e.target.value)}>
              <option value="any">-</option>
            </select>
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
          {t.quantity}
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: 80 }} />
        </label>

        <div>
          <button onClick={handleAddRecord} style={{ padding: '8px 12px' }}>{t.add}</button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <input placeholder={t.addStaff} value={newStaff} onChange={e => setNewStaff(e.target.value)} />
          <button onClick={addStaff}>{t.addStaff}</button>
          <button onClick={clearData} style={{ background: '#f44336', color: '#fff' }}>{t.clearData}</button>
        </div>
      </div>

      <h3>{t.summary}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }} border="1">
        <thead>
          <tr>
            <th style={{ padding: 6 }}>{t.staff}</th>
            <th style={{ padding: 6 }}>{t.quantity}</th>
            <th style={{ padding: 6 }}>{t.totalSales}</th>
            <th style={{ padding: 6 }}>{t.totalPay}</th>
          </tr>
        </thead>
        <tbody>
          {staffSummary.map(s => (
            <tr key={s.name}>
              <td style={{ padding: 6 }}>{s.name}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{s.totalQuantity}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{s.totalSales}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{s.totalPay}</td>
            </tr>
          ))}
          {staffSummary.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 6, textAlign: 'center' }}>{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</td></tr>
          )}
        </tbody>
      </table>

      <h3>{t.serviceSummary}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
        <thead>
          <tr>
            <th style={{ padding: 6 }}>{t.staff}</th>
            <th style={{ padding: 6 }}>{t.service}</th>
            <th style={{ padding: 6 }}>{t.size}</th>
            <th style={{ padding: 6 }}>{t.quantity}</th>
          </tr>
        </thead>
        <tbody>
          {serviceSummary.map(s => (
            Object.entries(s.summary).map(([serviceKey, qty]) => {
              const [svc, sz] = serviceKey.includes('-') ? serviceKey.split('-') : [serviceKey, 'any'];
              return (
                <tr key={`${s.name}-${serviceKey}`}>
                  <td style={{ padding: 6 }}>{s.name}</td>
                  <td style={{ padding: 6 }}>{t[svc] || svc}</td>
                  <td style={{ padding: 6 }}>{sz === 'any' ? '-' : (t[sz] || sz)}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{qty}</td>
                </tr>
              );
            })
          ))}
          {serviceSummary.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 6, textAlign: 'center' }}>{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</td></tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 18 }}>{lang === 'ar' ? 'السجلات التفصيلية' : 'Detailed Records'}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
        <thead>
          <tr>
            <th style={{ padding: 6 }}>{t.date}</th>
            <th style={{ padding: 6 }}>{t.staff}</th>
            <th style={{ padding: 6 }}>{t.service}</th>
            <th style={{ padding: 6 }}>{t.size}</th>
            <th style={{ padding: 6 }}>{t.quantity}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: 6 }}>{r.date}</td>
              <td style={{ padding: 6 }}>{r.staffName}</td>
              <td style={{ padding: 6 }}>{t[r.serviceType] || r.serviceType}</td>
              <td style={{ padding: 6 }}>{r.size === 'any' ? '-' : (t[r.size] || r.size)}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{r.quantity}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 6, textAlign: 'center' }}>{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</td></tr>
          )}
        </tbody>
      </table>

    </div>
  );
}
