import React, { useState } from "react";
import { Plus, Edit2, Trash2, Lock, Unlock } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GIn, GS, Field, Modal } from "../components/UI";
import { uid, today } from "../utils";
const ROLES = ["admin","manager","sales","purchase","accountant","production"];
const LOCKABLE = ["sales","purchase","sales-return","purchase-return","inventory","products","categories","pnl","ledger","vendors","transactions","payments-receipts"];
export default function AdminUsers({ ctx }) {
  const T = useT();
  const { users, saveUsers, user, addLog } = ctx;
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const openNew = () => { setEdit(null); setForm({ name: "", username: "", password: "", role: "sales", needsApproval: true, lockedPages: [] }); setModal(true); };
  const openEdit = u => { setEdit(u); setForm({ ...u, lockedPages: u.lockedPages || [], needsApproval: u.needsApproval !== false }); setModal(true); };
  const save = () => {
    if (!form.name || !form.username) return;
    if (edit) { saveUsers(users.map(u => u.id === edit.id ? { ...u, ...form } : u)); addLog("edited", "user", form.name); }
    else { if (!form.password) return; saveUsers([...users, { id: uid(), ...form, createdAt: today() }]); addLog("created", "user", form.name); }
    setModal(false);
  };
  const del = u => { if (u.id === user.id) return; if (window.confirm(`Delete user "${u.name}"?`)) { saveUsers(users.filter(x => x.id !== u.id)); addLog("deleted", "user", u.name); }};
  const toggleLock = (pg) => { setForm(f => ({ ...f, lockedPages: f.lockedPages?.includes(pg) ? f.lockedPages.filter(x => x !== pg) : [...(f.lockedPages || []), pg] })); };
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "flex-end" }}><GBtn onClick={openNew} icon={<Plus size={14} />}>Add User</GBtn></div>
    <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Name","Username","Role","Approval Required","Actions"].map((h,i) => <th key={i} className="th">{h}</th>)}</tr></thead>
        <tbody>{users.map(u => <tr key={u.id} className="trow">
          <td className="td" style={{ fontWeight: 700 }}>{u.name}</td>
          <td className="td m">{u.username}</td>
          <td className="td"><span className="badge" style={{ background: T.accentBg, color: T.accent, textTransform: "capitalize" }}>{u.role}</span></td>
          <td className="td">{u.role !== "admin" && <span style={{ color: u.needsApproval !== false ? T.amber : T.green, fontWeight: 700, fontSize: 12 }}>{u.needsApproval !== false ? "Yes" : "No"}</span>}</td>
          <td className="td"><div style={{ display: "flex", gap: 4 }}>
            <button className="btn-ghost" onClick={() => openEdit(u)} style={{ padding: 5 }}><Edit2 size={13} /></button>
            {u.id !== user.id && <button className="btn-danger" onClick={() => del(u)} style={{ padding: 5 }}><Trash2 size={13} /></button>}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <Modal open={modal} onClose={() => setModal(false)} title={edit ? `Edit: ${edit.name}` : "New User"} width={480}
      footer={<><GBtn v="ghost" onClick={() => setModal(false)}>Cancel</GBtn><GBtn onClick={save}>{edit ? "Save" : "Create"}</GBtn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="fgrid">
          <Field label="Name" req><GIn value={form.name||""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Username" req><GIn value={form.username||""} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></Field>
          <Field label={edit ? "New Password" : "Password"} req={!edit}><GIn type="password" value={form.password||""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={edit ? "Leave blank to keep" : ""} /></Field>
          <Field label="Role" req><GS value={form.role||"sales"} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>{ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}</GS></Field>
        </div>
        {form.role !== "admin" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
            <input type="checkbox" className="cb" checked={form.needsApproval !== false} onChange={e => setForm(f => ({ ...f, needsApproval: e.target.checked }))} />
            <div><div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Requires Approval</div><div style={{ fontSize: 11, color: T.textMuted }}>All create/edit/delete actions need admin approval</div></div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginTop: 4 }}>Page Access</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {LOCKABLE.map(pg => {
              const locked = (form.lockedPages || []).includes(pg);
              return <button key={pg} onClick={() => toggleLock(pg)} style={{ padding: "5px 12px", borderRadius: T.radiusFull, fontSize: 11, fontWeight: 600, border: `1px solid ${locked ? T.red + "30" : T.green + "30"}`, background: locked ? T.redBg : T.greenBg, color: locked ? T.red : T.green, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {locked ? <Lock size={10} /> : <Unlock size={10} />}{pg}
              </button>;
            })}
          </div>
        </>}
      </div>
    </Modal>
  </div>;
}
