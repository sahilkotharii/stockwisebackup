import React, { useState } from "react";
import { useT } from "../theme";
import { GBtn, GIn, GTa, Field } from "../components/UI";
export default function AdminInvoice({ ctx }) {
  const T = useT();
  const { invoiceSettings, saveInvoiceSettings } = ctx;
  const [form, setForm] = useState(invoiceSettings || {});
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => { saveInvoiceSettings(form); alert("Invoice settings saved"); };
  return <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>Company Details (Invoice Header)</div>
      <div className="fgrid">
        <Field label="Company Name" cl="s2"><GIn value={form.companyName||""} onChange={e => f("companyName", e.target.value)} /></Field>
        <Field label="GSTIN"><GIn value={form.gstin||""} onChange={e => f("gstin", e.target.value)} /></Field>
        <Field label="State"><GIn value={form.state||""} onChange={e => f("state", e.target.value)} /></Field>
        <Field label="Address" cl="s2"><GTa value={form.address||""} onChange={e => f("address", e.target.value)} rows={2} /></Field>
        <Field label="Phone"><GIn value={form.phone||""} onChange={e => f("phone", e.target.value)} /></Field>
        <Field label="Email"><GIn value={form.email||""} onChange={e => f("email", e.target.value)} /></Field>
        <Field label="Bank Name"><GIn value={form.bankName||""} onChange={e => f("bankName", e.target.value)} /></Field>
        <Field label="Account No"><GIn value={form.accountNo||""} onChange={e => f("accountNo", e.target.value)} /></Field>
        <Field label="IFSC"><GIn value={form.ifsc||""} onChange={e => f("ifsc", e.target.value)} /></Field>
        <Field label="Branch"><GIn value={form.branch||""} onChange={e => f("branch", e.target.value)} /></Field>
        <Field label="Terms & Conditions" cl="s2"><GTa value={form.terms||""} onChange={e => f("terms", e.target.value)} rows={3} /></Field>
      </div>
      <div style={{ marginTop: 16 }}><GBtn onClick={save}>Save Invoice Settings</GBtn></div>
    </div>
  </div>;
}
