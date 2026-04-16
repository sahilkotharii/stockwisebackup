import React, { useState } from "react";
import { useT } from "../theme";
import { GBtn, GIn, Field } from "../components/UI";
export default function AdminSeries({ ctx }) {
  const T = useT();
  const { invoiceSettings, saveInvoiceSettings } = ctx;
  const [form, setForm] = useState(invoiceSettings || {});
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => { saveInvoiceSettings(form); alert("Bill series saved"); };
  return <div style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 16 }}>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>Bill Number Series</div>
      <div className="fgrid">
        <Field label="Sale Series Prefix"><GIn value={form.saleSeries||"SK-"} onChange={e => f("saleSeries", e.target.value)} /></Field>
        <Field label="Sale Start Number"><GIn type="number" value={form.saleSeriesStart||1} onChange={e => f("saleSeriesStart", e.target.value)} /></Field>
        <Field label="Sales Return Prefix"><GIn value={form.salesRetSeries||"SR-"} onChange={e => f("salesRetSeries", e.target.value)} /></Field>
        <Field label="SR Start Number"><GIn type="number" value={form.salesRetSeriesStart||1} onChange={e => f("salesRetSeriesStart", e.target.value)} /></Field>
        <Field label="Purchase Return Prefix"><GIn value={form.purRetSeries||"PR-"} onChange={e => f("purRetSeries", e.target.value)} /></Field>
        <Field label="PR Start Number"><GIn type="number" value={form.purRetSeriesStart||1} onChange={e => f("purRetSeriesStart", e.target.value)} /></Field>
      </div>
      <div style={{ marginTop: 16 }}><GBtn onClick={save}>Save Series</GBtn></div>
    </div>
  </div>;
}
