import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GIn, Field, Modal } from "../components/UI";
import { uid } from "../utils";
export default function Categories({ ctx }) {
  const T = useT();
  const { categories, saveCategories, user, addLog } = ctx;
  const isAdmin = user.role === "admin";
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#C05C1E" });
  const openEdit = c => { setEdit(c); setForm({ name: c.name, color: c.color || "#C05C1E" }); setModal(true); };
  const openNew = () => { setEdit(null); setForm({ name: "", color: "#C05C1E" }); setModal(true); };
  const save = () => {
    if (!form.name.trim()) return;
    if (edit) { saveCategories(categories.map(c => c.id === edit.id ? { ...c, ...form } : c)); addLog("edited", "category", form.name); }
    else { saveCategories([...categories, { id: uid(), ...form }]); addLog("created", "category", form.name); }
    setModal(false);
  };
  const del = c => { if (window.confirm(`Delete category "${c.name}"?`)) { saveCategories(categories.filter(x => x.id !== c.id)); addLog("deleted", "category", c.name); }};
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>{isAdmin && <GBtn onClick={openNew} icon={<Plus size={14} />}>Add Category</GBtn>}</div>
    <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th className="th">Color</th><th className="th">Name</th><th className="th">Products</th>{isAdmin && <th className="th" style={{ width: 80 }}>Actions</th>}</tr></thead>
        <tbody>{categories.map(c => <tr key={c.id} className="trow">
          <td className="td"><div style={{ width: 24, height: 24, borderRadius: 6, background: c.color }} /></td>
          <td className="td" style={{ fontWeight: 700 }}>{c.name}</td>
          <td className="td m">{(ctx.products || []).filter(p => p.categoryId === c.id).length}</td>
          {isAdmin && <td className="td"><div style={{ display: "flex", gap: 4 }}><button className="btn-ghost" onClick={() => openEdit(c)} style={{ padding: 5 }}><Edit2 size={13} /></button><button className="btn-danger" onClick={() => del(c)} style={{ padding: 5 }}><Trash2 size={13} /></button></div></td>}
        </tr>)}</tbody>
      </table>
      {categories.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No categories yet</div>}
    </div>
    <Modal open={modal} onClose={() => setModal(false)} title={edit ? "Edit Category" : "New Category"} width={360}
      footer={<><GBtn v="ghost" onClick={() => setModal(false)}>Cancel</GBtn><GBtn onClick={save}>{edit ? "Save" : "Add"}</GBtn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Field label="Name" req><GIn value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Color"><div style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 36, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 2, cursor: "pointer" }} /><GIn value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div></Field>
      </div>
    </Modal>
  </div>;
}
