import React, { useState } from "react";
import { FileText, ShoppingCart, RotateCcw } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GIn, Field } from "../components/UI";

export default function AdminSeries({ ctx }) {
  const T = useT();
  const { invoiceSettings, saveInvoiceSettings } = ctx;
  const [form, setForm] = useState(invoiceSettings || {});
  const [saved, setSaved] = useState(false);
  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setSaved(false); };
  const save = () => { saveInvoiceSettings(form); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const Section = ({ icon: Icon, title, desc, fields, color = T.accent }) => (
    <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: T.radius, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{title}</div>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{desc}</div>
        </div>
      </div>
      <div className="fgrid">
        {fields.map(field => (
          <Field key={field.key} label={field.label}>
            <GIn
              type={field.type || "text"}
              value={form[field.key] ?? field.default}
              onChange={e => f(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </Field>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "12px 16px", borderRadius: T.radius, background: T.blueBg, border: `1px solid ${T.blue}20`, fontSize: 12, color: T.blue, fontWeight: 600 }}>
        Bill numbers are auto-generated as <code>PREFIX + sequential number padded to 4 digits</code> (e.g. SK-0001, PI-0042).
      </div>

      <Section icon={FileText} title="Tax Invoice (Sales)" desc="Regular sales bills with GST"
        color={T.green}
        fields={[
          { key: "saleSeries", label: "Prefix", default: "SK-", placeholder: "e.g. SK-, INV-" },
          { key: "saleSeriesStart", label: "Start Number", type: "number", default: 1 },
        ]} />

      <Section icon={FileText} title="Proforma Invoice" desc="Quotations — no stock or GST impact"
        color={T.blue}
        fields={[
          { key: "piSeries", label: "Prefix", default: "PI-", placeholder: "e.g. PI-, QUO-" },
          { key: "piSeriesStart", label: "Start Number", type: "number", default: 1 },
        ]} />

      <Section icon={ShoppingCart} title="Sales Order" desc="Internal sales orders — no stock movement"
        color={T.accent}
        fields={[
          { key: "soSeries", label: "Prefix", default: "SO-" },
          { key: "soSeriesStart", label: "Start Number", type: "number", default: 1 },
        ]} />

      <Section icon={ShoppingCart} title="Purchase Order" desc="Internal purchase orders"
        color={T.blue}
        fields={[
          { key: "poSeries", label: "Prefix", default: "PO-" },
          { key: "poSeriesStart", label: "Start Number", type: "number", default: 1 },
        ]} />

      <Section icon={RotateCcw} title="Sales Return" desc="When customer returns goods"
        color={T.amber}
        fields={[
          { key: "salesRetSeries", label: "Prefix", default: "SR-" },
          { key: "salesRetSeriesStart", label: "Start Number", type: "number", default: 1 },
        ]} />

      <Section icon={RotateCcw} title="Purchase Return" desc="When you return goods to vendor"
        color={T.red}
        fields={[
          { key: "purRetSeries", label: "Prefix", default: "PR-" },
          { key: "purRetSeriesStart", label: "Start Number", type: "number", default: 1 },
        ]} />

      <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 20 }}>
        <GBtn onClick={save}>Save All Series</GBtn>
        {saved && <span style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>✓ Saved</span>}
      </div>
    </div>
  );
}
