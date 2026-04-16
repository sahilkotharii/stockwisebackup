import React, { useState } from "react";
import { Wifi, CheckCircle, XCircle, Loader } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GIn, Field } from "../components/UI";
export default function AdminSheets({ ctx }) {
  const T = useT();
  const { sheetsUrl, setSheetsUrl, testStatus, onTest } = ctx;
  const [url, setUrl] = useState(sheetsUrl || "");
  return <div style={{ maxWidth: 600 }}>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>Google Sheets Connection</div>
      <Field label="Web App URL"><GIn value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" /></Field>
      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
        <GBtn v="ghost" onClick={() => onTest(url)} icon={<Wifi size={13} />}>Test Connection</GBtn>
        <GBtn onClick={() => setSheetsUrl(url)}>Save URL</GBtn>
        {testStatus === "ok" && <span style={{ color: T.green, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><CheckCircle size={14} /> Connected</span>}
        {testStatus === "err" && <span style={{ color: T.red, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}><XCircle size={14} /> Failed</span>}
        {testStatus === "testing" && <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />}
      </div>
    </div>
  </div>;
}
