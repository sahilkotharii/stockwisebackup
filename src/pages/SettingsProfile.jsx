import React, { useState } from "react";
import { useT } from "../theme";
import { GBtn, GIn, Field } from "../components/UI";
export default function SettingsProfile({ ctx }) {
  const T = useT();
  const { user, users, saveUsers } = ctx;
  const [form, setForm] = useState({ name: user.name, newPass: "", confirmPass: "" });
  const [msg, setMsg] = useState("");
  const save = () => {
    if (form.newPass && form.newPass !== form.confirmPass) { setMsg("Passwords don't match"); return; }
    const updated = users.map(u => u.id === user.id ? { ...u, name: form.name, ...(form.newPass ? { password: form.newPass } : {}) } : u);
    saveUsers(updated);
    setMsg("Profile updated");
    setTimeout(() => setMsg(""), 3000);
  };
  return <div style={{ maxWidth: 500 }}>
    <div className="glass" style={{ padding: 24, borderRadius: T.radius }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Display Name"><GIn value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Username"><GIn value={user.username} readOnly /></Field>
        <Field label="Role"><GIn value={user.role} readOnly /></Field>
        <Field label="New Password"><GIn type="password" value={form.newPass} onChange={e => setForm(f => ({ ...f, newPass: e.target.value }))} placeholder="Leave blank to keep current" /></Field>
        {form.newPass && <Field label="Confirm Password"><GIn type="password" value={form.confirmPass} onChange={e => setForm(f => ({ ...f, confirmPass: e.target.value }))} /></Field>}
        {msg && <div style={{ fontSize: 12, color: msg.includes("match") ? T.red : T.green, fontWeight: 600 }}>{msg}</div>}
        <GBtn onClick={save}>Save Changes</GBtn>
      </div>
    </div>
  </div>;
}
