import React, { useState, useMemo, useEffect } from "react";
import { Plus, Edit2, Trash2, TrendingDown, TrendingUp, Download, Wallet, X } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GIn, GTa, GS, Field, Modal, Pager, PeriodBar, SearchInput, DeleteConfirmModal, Pill } from "../components/UI";
import { uid, today, fmtCur, fmtDate, inRange, getPresetDate, toCSV, dlCSV } from "../utils";

const EXPENSE_CATS = ["Rent", "Salary & Wages", "Utilities", "Office Supplies", "Travel", "Marketing", "Repairs & Maintenance", "Professional Fees", "Bank Charges", "Taxes", "Insurance", "Telephone & Internet", "Freight & Shipping", "Packaging", "Miscellaneous"];
const INCOME_CATS = ["Interest Income", "Commission", "Rental Income", "Discount Received", "Refund", "Other Income", "Miscellaneous"];
const MODES = ["Cash", "NEFT / RTGS", "UPI", "Cheque", "Card", "Wallet", "Credit", "Other"];

export default function ExpensesIncomes({ ctx }) {
  const T = useT();
  const { expenses, saveExpenses, incomes, saveIncomes, user, addLog } = ctx;

  const [tab, setTab] = useState("expenses"); // "expenses" | "incomes"
  const list = tab === "expenses" ? expenses : incomes;
  const save = tab === "expenses" ? saveExpenses : saveIncomes;
  const CATS = tab === "expenses" ? EXPENSE_CATS : INCOME_CATS;

  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [preset, setPreset] = useState("30d");
  const [catF, setCatF] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  const [delConfirm, setDelConfirm] = useState(null);
  useEffect(() => setPg(1), [tab, df, dt, search, catF, ps]);

  const blank = { date: today(), category: "", amount: "", paymentMode: "Cash", reference: "", notes: "", party: "", taxDeductible: false };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEdit(null); setForm(blank); setModal(true); };
  const openEdit = e => { setEdit(e); setForm({ ...blank, ...e }); setModal(true); };

  const doSave = () => {
    if (!form.category) { alert("Select a category"); return; }
    if (!form.amount || Number(form.amount) <= 0) { alert("Enter a valid amount"); return; }
    if (edit) {
      save(list.map(x => x.id === edit.id ? { ...edit, ...form, amount: Number(form.amount), updatedTs: new Date().toISOString() } : x));
      addLog("edited", tab === "expenses" ? "expense" : "income", form.category, fmtCur(form.amount));
    } else {
      const entry = { id: uid(), ...form, amount: Number(form.amount), userId: user.id, userName: user.name, ts: new Date().toISOString() };
      save([entry, ...list]);
      addLog("recorded", tab === "expenses" ? "expense" : "income", form.category, fmtCur(form.amount));
    }
    setModal(false);
  };

  const filtered = useMemo(() => list.filter(e =>
    inRange(e.date, df, dt) &&
    (!catF || e.category === catF) &&
    (!search || (e.category || "").toLowerCase().includes(search.toLowerCase()) || (e.party || "").toLowerCase().includes(search.toLowerCase()) || (e.notes || "").toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [list, df, dt, catF, search]);

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  // By category
  const byCategory = useMemo(() => {
    const m = {};
    filtered.forEach(e => {
      const c = e.category || "Uncategorized";
      if (!m[c]) m[c] = { name: c, amount: 0, count: 0 };
      m[c].amount += Number(e.amount || 0);
      m[c].count += 1;
    });
    return Object.values(m).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const exportCSV = () => {
    const rows = filtered.map(e => ({
      date: e.date, category: e.category, party: e.party || "",
      amount: e.amount, paymentMode: e.paymentMode, reference: e.reference || "",
      notes: e.notes || "", userName: e.userName
    }));
    dlCSV(toCSV(rows, ["date","category","party","amount","paymentMode","reference","notes","userName"]), `${tab}_${df}_to_${dt}`);
  };

  const isExp = tab === "expenses";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Tab switcher */}
      <div className="glass" style={{ padding: 4, borderRadius: T.radiusFull, display: "inline-flex", gap: 2, alignSelf: "flex-start" }}>
        {[{ k: "expenses", l: "Expenses", icon: TrendingDown, color: T.red },
          { k: "incomes", l: "Other Incomes", icon: TrendingUp, color: T.green }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: "7px 16px", borderRadius: T.radiusFull, border: "none", cursor: "pointer",
              background: tab === t.k ? t.color : "transparent",
              color: tab === t.k ? "#fff" : T.textSub,
              fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}>
            <t.icon size={13} />{t.l}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
        <div style={{ display: "flex", gap: 8 }}>
          <GBtn v="ghost" sz="sm" onClick={exportCSV} icon={<Download size={13} />}>Export</GBtn>
          <GBtn sz="sm" onClick={openNew} icon={<Plus size={14} />}>{isExp ? "Record Expense" : "Record Income"}</GBtn>
        </div>
      </div>

      <div className="kgrid">
        <KCard label={isExp ? "Total Expenses" : "Total Income"} value={fmtCur(total)} sub={`${filtered.length} entries`} icon={isExp ? TrendingDown : TrendingUp} color={isExp ? T.red : T.green} />
        <KCard label="Categories" value={String(byCategory.length)} sub="with entries" icon={Wallet} color={T.accent} />
        <KCard label="Avg. Entry" value={fmtCur(filtered.length ? total / filtered.length : 0)} sub="per transaction" icon={Wallet} color={T.blue} />
      </div>

      {/* By category breakdown */}
      {byCategory.length > 0 && (
        <div className="glass" style={{ padding: 16, borderRadius: T.radius }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12 }}>By Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byCategory.map(c => {
              const pct = total ? (c.amount / total) * 100 : 0;
              return (
                <div key={c.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isExp ? T.red : T.green }}>{fmtCur(c.amount)}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: isExp ? T.red : T.green, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{c.count} entries · {pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text, flex: 1, minWidth: 160 }}>{isExp ? "Expense Register" : "Income Register"}</div>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ flex: "1 1 200px", maxWidth: 260 }} />
          <GS value={catF} onChange={e => setCatF(e.target.value)} placeholder="All Categories" style={{ width: 180 }}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </GS>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Date","Category","Party","Mode","Reference","Amount","By","Actions"].map((h,i) => <th key={i} className="th" style={{ textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>)}</tr>
            </thead>
            <tbody>{filtered.slice((pg-1)*ps, pg*ps).map(e => (
              <tr key={e.id} className="trow">
                <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtDate(e.date)}</td>
                <td className="td" style={{ fontWeight: 700 }}>{e.category}</td>
                <td className="td m" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.party}>{e.party || "—"}</td>
                <td className="td"><Pill c={e.paymentMode} color={T.blue} /></td>
                <td className="td m" style={{ fontFamily: "monospace", fontSize: 11 }}>{e.reference || "—"}</td>
                <td className="td r" style={{ fontWeight: 800, color: isExp ? T.red : T.green }}>{fmtCur(e.amount)}</td>
                <td className="td m" style={{ fontSize: 11 }}>{e.userName}</td>
                <td className="td">
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button className="btn-ghost" onClick={() => openEdit(e)} style={{ padding: 5 }}><Edit2 size={13} /></button>
                    <button className="btn-danger" onClick={() => setDelConfirm(e)} style={{ padding: 5 }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No {tab} in this period</div>}
        </div>
        <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? `Edit ${isExp ? "Expense" : "Income"}` : `Record ${isExp ? "Expense" : "Income"}`} width={520}
        footer={<><GBtn v="ghost" onClick={() => setModal(false)}>Cancel</GBtn><GBtn onClick={doSave}>{edit ? "Save" : "Record"}</GBtn></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="fgrid">
            <Field label="Date" req><GIn type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
            <Field label="Amount (₹)" req><GIn type="number" min="0" step="0.01" value={form.amount} onChange={e => f("amount", e.target.value)} /></Field>
            <Field label="Category" req cl="s2">
              <GS value={form.category} onChange={e => f("category", e.target.value)} placeholder="Select category…">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </GS>
            </Field>
            <Field label={isExp ? "Paid To" : "Received From"}><GIn value={form.party} onChange={e => f("party", e.target.value)} placeholder={isExp ? "Vendor / Person" : "Source"} /></Field>
            <Field label="Payment Mode"><GS value={form.paymentMode} onChange={e => f("paymentMode", e.target.value)}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</GS></Field>
            <Field label="Reference" cl="s2"><GIn value={form.reference} onChange={e => f("reference", e.target.value)} placeholder="Invoice no, UTR, cheque no, etc." /></Field>
            <Field label="Notes" cl="s2"><GTa value={form.notes} onChange={e => f("notes", e.target.value)} rows={2} /></Field>
          </div>
          {isExp && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", padding: "8px 10px", borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
              <input type="checkbox" className="cb" checked={!!form.taxDeductible} onChange={e => f("taxDeductible", e.target.checked)} />
              <span style={{ fontWeight: 600, color: T.textSub }}>Tax-deductible business expense</span>
            </label>
          )}
        </div>
      </Modal>

      <DeleteConfirmModal open={!!delConfirm} onClose={() => setDelConfirm(null)}
        onConfirm={() => { save(list.filter(x => x.id !== delConfirm.id)); addLog("deleted", tab.slice(0, -1), delConfirm.category); }}
        user={user} label={`${delConfirm?.category} (${fmtCur(delConfirm?.amount)})`} />
    </div>
  );
}
