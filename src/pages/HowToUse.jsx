import React, { useState } from "react";
import { BookOpen, FileText, ShoppingCart, Package, IndianRupee, Shield, ChevronDown, Zap, AlertCircle } from "lucide-react";
import { useT } from "../theme";

const SECTIONS = [
  { icon: Zap, color: "accent", title: "Getting Started",
    blocks: [
      { q: "What is StockWise?",
        a: "StockWise is your end-to-end ERP for Pipal Home — tracks inventory, records sales and purchases, manages customer/vendor ledgers, generates invoices, handles payments, and computes P&L. All data syncs to your Google Sheets backend so you never lose anything." },
      { q: "Who sees what?",
        a: "Admin sees everything. Sales staff see only Sales + Inventory read-only + Ledger for their receipts. Purchase staff see the mirror — Purchase + Vendors + Payments. Accountants see the full financial side (P&L, Ledger, Payments, Receipts). The 'Requires Approval' toggle on a user means every create/edit/delete they do goes through Admin for approval first." }
    ]},
  { icon: FileText, color: "green", title: "Sales Workflow",
    blocks: [
      { q: "Creating a Tax Invoice",
        a: "Go to Sales → New Tax Invoice. Pick a customer (or add a new one inline via GSTIN), add line items, choose CGST+SGST (intra-state) or IGST (inter-state) based on the customer's state. The bill number auto-generates from the prefix you set in Admin → Bill Series." },
      { q: "Proforma Invoice vs Tax Invoice",
        a: "A Proforma is a quotation — no stock moves, no GST reporting, no transactions recorded. It's just a priced offer you send to a customer. Once they confirm, convert it into a Sales Order or directly into a Tax Invoice from the Sales Bills page." },
      { q: "Sales Returns",
        a: "Sales → Sales Return records a customer return. This adds the qty back to your stock. Mark items as 'Damaged' if they can't be resold — those get excluded from your available stock but tracked for wastage analysis." }
    ]},
  { icon: ShoppingCart, color: "blue", title: "Purchase Workflow",
    blocks: [
      { q: "Recording a Purchase",
        a: "Purchase → New Purchase Bill. Enter the vendor's invoice number (their reference), pick the vendor, add items with purchase cost (ex-GST). Stock gets added automatically on save." },
      { q: "Purchase Orders vs Bills",
        a: "A PO is what you send your vendor before goods arrive — it doesn't affect stock. Once the goods arrive, convert the PO to a Purchase Bill from the PO page. Only the Bill moves stock." }
    ]},
  { icon: Package, color: "accent", title: "Inventory",
    blocks: [
      { q: "How is stock computed?",
        a: "Current stock = Opening + Purchases + Sales Returns − Sales − Purchase Returns − Damaged. Inventory → Stock Status shows the live number. Set a Min Stock Alert on each product and the notification bell will warn you when items dip below that level." },
      { q: "Uploading Opening Stock",
        a: "On first setup, download the Opening Stock Template from Inventory, fill in quantities, and import it. Each row creates an 'opening' transaction — the starting balance for that product." }
    ]},
  { icon: IndianRupee, color: "accent", title: "Receipts, Payments & Ledger",
    blocks: [
      { q: "Recording a Receipt",
        a: "Accounts → Receipts → Record Receipt. Pick the customer, enter the total amount received, choose payment mode. If the customer has multiple outstanding bills, use 'Auto-allocate (FIFO)' to spread the payment across oldest bills first, or manually enter amounts per bill. Unallocated amount goes 'On Account' and can be applied later." },
      { q: "Vendor Ledger",
        a: "Accounts → Ledger shows per-party running balance. Debit and credit columns with a running total. Perfect for reconciling with your vendor's books at month-end." }
    ]},
  { icon: Shield, color: "red", title: "Admin & Troubleshooting",
    blocks: [
      { q: "A user can't see a page",
        a: "Admin → Users → edit the user. Check 'Page Access' chips at the bottom — a locked (red) chip means that page is hidden from them. Toggle to green to allow access." },
      { q: "Bill numbers are wrong",
        a: "Admin → Bill Series lets you control the prefix (e.g. 'SK-', 'PI-', 'SO-') and the next starting number for each document type. Change carefully — existing bills keep their numbers." },
      { q: "Data not syncing",
        a: "Admin → Google Sheets → Test Connection. If the test fails, check that the Apps Script Web App is deployed as 'Anyone' access and the URL matches. Every save pushes to Sheets in the background." }
    ]}
];

export default function HowToUse({ ctx }) {
  const T = useT();
  const [open, setOpen] = useState({ 0: true });

  return (
    <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="glass" style={{ padding: "18px 20px", borderRadius: T.radius, background: `linear-gradient(135deg, ${T.accentBg}, transparent)`, border: `1px solid ${T.accent}20`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: T.radius, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookOpen size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>How to Use StockWise</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Quick reference for everyday operations at Pipal Home</div>
        </div>
      </div>

      {SECTIONS.map((section, i) => {
        const isOpen = open[i];
        const accent = T[section.color] || T.accent;
        return (
          <div key={i} className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
            <button onClick={() => setOpen(p => ({ ...p, [i]: !p[i] }))}
              style={{ width: "100%", padding: "14px 18px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
              <div style={{ width: 32, height: 32, borderRadius: T.radius, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <section.icon size={15} color={accent} />
              </div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: T.text }}>{section.title}</div>
              <ChevronDown size={16} color={T.textMuted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {isOpen && (
              <div className="spring-down" style={{ padding: "0 18px 16px", borderTop: `1px solid ${T.borderSubtle}`, display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>
                {section.blocks.map((b, j) => (
                  <div key={j}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>{b.q}</div>
                    <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.6 }}>{b.a}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="glass" style={{ padding: 16, borderRadius: T.radius, background: T.amberBg, border: `1px solid ${T.amber}20`, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertCircle size={18} color={T.amber} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.amber, marginBottom: 4 }}>Need more help?</div>
          <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
            This app stores all data locally in your browser and syncs to Google Sheets. If something looks off after a sync, hit the refresh icon in the header to pull the latest. For anything else, reach out directly.
          </div>
        </div>
      </div>
    </div>
  );
}
