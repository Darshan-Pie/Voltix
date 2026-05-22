"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRole = "USER" | "ADMIN";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  canAccessAdminCatalog: boolean;
  createdAt: string;
}

// ── Toggle Switch component ───────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  id,
  colorOn = "var(--violet)",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  colorOn?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        padding: 2,
        background: checked ? colorOn : "var(--surface-3)",
        transition: "background 0.2s ease",
        position: "relative",
        flexShrink: 0,
        outline: "none",
        boxShadow: checked
          ? `0 0 0 3px ${colorOn}22`
          : "0 0 0 1px var(--border-2)",
      }}
    >
      <span
        style={{
          display: "block",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </button>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDeleteModal({
  user,
  onConfirm,
  onCancel,
}: {
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="adm-overlay" role="dialog" aria-modal="true" aria-labelledby="del-title">
      <motion.div
        className="adm-modal"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Danger icon */}
        <div className="adm-modal-icon adm-modal-icon--danger">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#ef4444" strokeWidth="1.5"/>
            <path d="M11 7v4.5M11 14.5v.5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 id="del-title" className="adm-modal-title">Delete User</h2>
        <p className="adm-modal-desc">
          Permanently delete <strong>{user.name ?? user.email}</strong>?
          This will also remove all their catalog entries. This action cannot be undone.
        </p>
        <div className="adm-modal-actions">
          <button id="del-cancel" className="adm-btn adm-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button id="del-confirm" className="adm-btn adm-btn-danger" onClick={onConfirm}>
            Delete User
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({
  onCreated,
  onClose,
}: {
  onCreated: (u: AdminUser) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [catalogAccess, setCatalogAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, canAccessAdminCatalog: catalogAccess }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create user"); return; }
      onCreated(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-overlay" role="dialog" aria-modal="true" aria-labelledby="create-title">
      <motion.div
        className="adm-modal"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="adm-modal-icon adm-modal-icon--violet">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="8" r="4" stroke="var(--violet)" strokeWidth="1.5"/>
            <path d="M3 19c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="var(--violet)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M17 4v6M14 7h6" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 id="create-title" className="adm-modal-title">Create New User</h2>
        <p className="adm-modal-desc">Add a new user account directly — no invite required.</p>

        <form onSubmit={handleSubmit} className="adm-form" id="create-user-form">
          <div className="adm-field">
            <label htmlFor="cu-name" className="adm-label">Full Name</label>
            <input id="cu-name" type="text" className="adm-input" placeholder="Jane Smith"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="adm-field">
            <label htmlFor="cu-email" className="adm-label">Email <span style={{color:"var(--error)"}}>*</span></label>
            <input id="cu-email" type="email" className="adm-input" placeholder="jane@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="adm-field">
            <label htmlFor="cu-password" className="adm-label">Temporary Password <span style={{color:"var(--error)"}}>*</span></label>
            <input id="cu-password" type="password" className="adm-input" placeholder="min. 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>

          <div className="adm-row">
            <div className="adm-field" style={{flex:1}}>
              <label htmlFor="cu-role" className="adm-label">Role</label>
              <select id="cu-role" className="adm-select"
                value={role} onChange={e => setRole(e.target.value as UserRole)}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="adm-field" style={{flex:1}}>
              <label className="adm-label">Catalog Access</label>
              <div style={{display:"flex", alignItems:"center", gap:8, paddingTop:6}}>
                <Toggle id="cu-catalog" checked={catalogAccess} onChange={setCatalogAccess} colorOn="var(--cyan)" />
                <span style={{fontSize:12, color:"var(--text-dim)"}}>
                  {catalogAccess ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="adm-error" role="alert">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.5"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="adm-modal-actions">
            <button type="button" id="create-cancel" className="adm-btn adm-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" id="create-submit" className="adm-btn adm-btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({
  user,
  isSelf,
  onUpdate,
  onDelete,
  onToggleAccess,
}: {
  user: AdminUser;
  isSelf: boolean;
  onUpdate: (id: string, patch: Partial<AdminUser>) => Promise<void>;
  onDelete: (user: AdminUser) => void;
  onToggleAccess: (user: AdminUser) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function patch(field: "role" | "canAccessAdminCatalog", value: unknown) {
    setBusy(true);
    await onUpdate(user.id, { [field]: value });
    setBusy(false);
  }

  const initials = (user.name ?? user.email)
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      style={{ opacity: busy ? 0.6 : 1 }}
    >
      {/* User identity */}
      <td>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="adm-avatar" aria-hidden="true">{initials}</div>
          <div>
            <div className="adm-user-name">{user.name ?? <em style={{color:"var(--text-muted)"}}>No name</em>}</div>
            <div className="adm-user-email">{user.email}</div>
          </div>
        </div>
      </td>

      {/* Role toggle */}
      <td>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Toggle
            id={`role-${user.id}`}
            checked={user.role === "ADMIN"}
            onChange={v => patch("role", v ? "ADMIN" : "USER")}
            colorOn="var(--violet)"
          />
          <span className={`adm-role-badge ${user.role === "ADMIN" ? "adm-role-admin" : "adm-role-user"}`}>
            {user.role}
          </span>
        </div>
      </td>

      {/* Catalog access toggle */}
      <td>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Toggle
            id={`catalog-${user.id}`}
            checked={user.canAccessAdminCatalog}
            onChange={v => patch("canAccessAdminCatalog", v)}
            colorOn="var(--cyan)"
          />
          <span style={{ fontSize:12, color: user.canAccessAdminCatalog ? "var(--cyan)" : "var(--text-muted)" }}>
            {user.canAccessAdminCatalog ? "Enabled" : "Disabled"}
          </span>
        </div>
      </td>

      {/* Joined date */}
      <td className="td-muted" style={{ whiteSpace:"nowrap" }}>
        {new Date(user.createdAt).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric"
        })}
      </td>

      {/* Status badge */}
      <td>
        <span className={`adm-status-badge ${user.isActive ? "adm-status-active" : "adm-status-suspended"}`}>
          <span className="adm-status-dot" />
          {user.isActive ? "Active" : "Suspended"}
        </span>
      </td>

      {/* Actions */}
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isSelf && (
            <button
              id={`toggle-${user.id}`}
              className={`adm-access-btn ${user.isActive ? "adm-access-btn--revoke" : "adm-access-btn--restore"}`}
              onClick={async () => { setBusy(true); await onToggleAccess(user); setBusy(false); }}
              disabled={busy}
              title={user.isActive ? "Suspend access" : "Restore access"}
              aria-label={user.isActive ? `Suspend ${user.email}` : `Restore ${user.email}`}
            >
              {user.isActive ? (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {user.isActive ? "Revoke Access" : "Restore Access"}
            </button>
          )}
          {!isSelf && (
            <button
              id={`del-${user.id}`}
              className="adm-del-btn"
              onClick={() => onDelete(user)}
              title="Delete user"
              aria-label={`Delete ${user.name ?? user.email}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {isSelf && (
            <span style={{ fontSize:11, color:"var(--text-muted)", padding:"0 6px" }}>You</span>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");

  // ── Auth guard — redirect non-admins ──────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/login"); return; }
    if (session.user.role !== "ADMIN") { router.replace("/"); }
  }, [session, status, router]);

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch {
      setFetchError("Could not load users. Make sure you are signed in as an admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Update a user field ───────────────────────────────────────────────────
  async function handleUpdate(id: string, patch: Partial<AdminUser>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated: AdminUser = await res.json();
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    }
  }

  // ── Toggle active/suspended ───────────────────────────────────────────────
  async function handleToggleAccess(user: AdminUser) {
    const newIsActive = !user.isActive;
    const res = await fetch("/api/admin/toggle-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, isActive: newIsActive }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newIsActive } : u));
    }
  }

  // ── Delete a user ─────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q);
  });

  if (status === "loading") return null;
  if (session?.user?.role !== "ADMIN") return null;

  return (
    <>
      <style>{`
        /* ── Admin page shell ─────────────────────────────────────────── */
        .adm-page {
          min-height: 100vh;
          padding: 24px 28px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Page header ──────────────────────────────────────────────── */
        .adm-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }
        .adm-title {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          margin: 0 0 4px;
          line-height: 1.15;
        }
        .adm-subtitle {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0;
        }

        /* ── Stats row ────────────────────────────────────────────────── */
        .adm-stats {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .adm-stat {
          flex: 1;
          min-width: 130px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 18px;
        }
        .adm-stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .adm-stat-value {
          font-size: 1.85rem;
          font-weight: 800;
          line-height: 1;
          font-family: var(--font-mono);
        }
        .adm-stat-value.cyan   { color: var(--cyan); }
        .adm-stat-value.violet { color: var(--violet); }
        .adm-stat-value.success{ color: var(--success); }

        /* ── Toolbar ──────────────────────────────────────────────────── */
        .adm-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .adm-search {
          flex: 1;
          min-width: 200px;
          max-width: 320px;
          padding: 8px 14px 8px 36px;
          border-radius: 10px;
          border: 1px solid var(--border-2);
          background: var(--surface-2);
          color: var(--text);
          font-size: 13px;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none'%3E%3Ccircle cx='6' cy='6' r='4.5' stroke='%236b7080' stroke-width='1.5'/%3E%3Cpath d='M10 10l2.5 2.5' stroke='%236b7080' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: 12px center;
        }
        .adm-search:focus {
          border-color: var(--violet);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .adm-search::placeholder { color: var(--text-muted); }

        /* ── Table container ──────────────────────────────────────────── */
        .adm-table-wrap {
          border-radius: 18px;
          border: 1px solid var(--border);
          overflow: hidden;
          background: var(--surface);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 8px 40px rgba(0,0,0,0.30);
        }
        [data-theme="light"] .adm-table-wrap {
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.04) inset,
            0 4px 24px rgba(0,0,0,0.08);
        }
        .adm-table { width: 100%; border-collapse: collapse; }
        .adm-table thead th {
          background: rgba(15,15,26,0.90);
          backdrop-filter: blur(12px);
          color: var(--text-dim);
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(124,58,237,0.15);
          white-space: nowrap;
        }
        [data-theme="light"] .adm-table thead th {
          background: rgba(240,242,248,0.95);
          border-bottom-color: var(--border);
        }
        .adm-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.15s;
        }
        [data-theme="light"] .adm-table tbody tr {
          border-bottom-color: rgba(0,0,0,0.04);
        }
        .adm-table tbody tr:last-child { border-bottom: none; }
        .adm-table tbody tr:hover { background: rgba(255,255,255,0.025); }
        [data-theme="light"] .adm-table tbody tr:hover { background: rgba(0,0,0,0.02); }
        .adm-table tbody td { padding: 12px 16px; vertical-align: middle; }

        /* ── Avatar ───────────────────────────────────────────────────── */
        .adm-avatar {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(124,58,237,0.30) 0%, rgba(0,212,255,0.15) 100%);
          border: 1px solid rgba(124,58,237,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: var(--violet);
          flex-shrink: 0;
          font-family: var(--font-sans);
        }
        .adm-user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
        }
        .adm-user-email {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 1px;
          font-family: var(--font-mono);
        }

        /* ── Role badge ───────────────────────────────────────────────── */
        .adm-role-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .adm-role-admin {
          background: rgba(124,58,237,0.14);
          color: #a78bfa;
          border: 1px solid rgba(124,58,237,0.28);
        }
        .adm-role-user {
          background: var(--surface-2);
          color: var(--text-dim);
          border: 1px solid var(--border);
        }

        /* ── Delete button ────────────────────────────────────────────── */
        .adm-del-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px; height: 30px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .adm-del-btn:hover {
          background: rgba(239,68,68,0.10);
          border-color: rgba(239,68,68,0.28);
          color: #f87171;
        }

        /* ── Status badge ─────────────────────────────────────────────── */
        .adm-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .adm-status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .adm-status-active {
          background: rgba(34,197,94,0.12);
          color: #4ade80;
          border: 1px solid rgba(34,197,94,0.28);
        }
        .adm-status-active .adm-status-dot {
          background: #4ade80;
          box-shadow: 0 0 4px rgba(74,222,128,0.7);
        }
        .adm-status-suspended {
          background: rgba(239,68,68,0.09);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.24);
        }
        .adm-status-suspended .adm-status-dot {
          background: #f87171;
        }

        /* ── Access toggle button ─────────────────────────────────────── */
        .adm-access-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .adm-access-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .adm-access-btn--revoke {
          background: rgba(239,68,68,0.09);
          color: #f87171;
          border-color: rgba(239,68,68,0.24);
        }
        .adm-access-btn--revoke:hover:not(:disabled) {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.44);
        }
        .adm-access-btn--restore {
          background: rgba(34,197,94,0.09);
          color: #4ade80;
          border-color: rgba(34,197,94,0.24);
        }
        .adm-access-btn--restore:hover:not(:disabled) {
          background: rgba(34,197,94,0.18);
          border-color: rgba(34,197,94,0.44);
        }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .adm-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .adm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .adm-btn-primary {
          background: linear-gradient(135deg, var(--violet) 0%, #4f8ef7 100%);
          color: #fff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
        }
        .adm-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(124,58,237,0.50);
        }
        .adm-btn-ghost {
          background: var(--surface-2);
          color: var(--text-dim);
          border: 1px solid var(--border-2);
        }
        .adm-btn-ghost:hover { background: var(--surface-3); color: var(--text); }
        .adm-btn-danger {
          background: rgba(239,68,68,0.12);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.30);
        }
        .adm-btn-danger:hover {
          background: rgba(239,68,68,0.22);
          border-color: rgba(239,68,68,0.50);
          transform: translateY(-1px);
        }

        /* ── Create user modal ────────────────────────────────────────── */
        .adm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.70);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .adm-modal {
          background: var(--surface);
          border: 1px solid var(--border-2);
          border-radius: 22px;
          padding: 32px 36px 28px;
          width: 100%;
          max-width: 460px;
          box-shadow:
            0 0 0 1px rgba(124,58,237,0.10),
            0 24px 80px rgba(0,0,0,0.55);
          position: relative;
        }
        .adm-modal-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .adm-modal-icon--violet {
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.22);
        }
        .adm-modal-icon--danger {
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.22);
        }
        .adm-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .adm-modal-desc {
          font-size: 13px;
          color: var(--text-dim);
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .adm-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }

        /* ── Form elements ────────────────────────────────────────────── */
        .adm-form { display: flex; flex-direction: column; gap: 14px; }
        .adm-row  { display: flex; gap: 12px; }
        .adm-field { display: flex; flex-direction: column; gap: 5px; }
        .adm-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-dim);
        }
        .adm-input, .adm-select {
          padding: 9px 12px;
          border-radius: 9px;
          border: 1px solid var(--border-2);
          background: var(--surface-2);
          color: var(--text);
          font-size: 13px;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .adm-input:focus, .adm-select:focus {
          border-color: var(--violet);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.14);
        }
        .adm-input::placeholder { color: var(--text-muted); }
        .adm-select { appearance: none; cursor: pointer; }
        .adm-error {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 8px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171; font-size: 12.5px; font-weight: 500;
        }

        /* ── Empty / loading states ───────────────────────────────────── */
        .adm-empty {
          text-align: center;
          padding: 48px 24px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .adm-spinner {
          width: 28px; height: 28px;
          border: 2.5px solid var(--border-2);
          border-top-color: var(--violet);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 40px auto;
        }
      `}</style>

      <div className="adm-page" id="admin-dashboard">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="adm-hero">
          <div>
            <h1 className="adm-title">Admin Dashboard</h1>
            <p className="adm-subtitle">Manage platform users, roles, and catalog permissions.</p>
          </div>
          <button
            id="btn-create-user"
            className="adm-btn adm-btn-primary"
            onClick={() => setShowCreate(true)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Create New User
          </button>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat-label">Total Users</div>
            <div className="adm-stat-value cyan">{users.length}</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-label">Admins</div>
            <div className="adm-stat-value violet">
              {users.filter(u => u.role === "ADMIN").length}
            </div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-label">Catalog Access</div>
            <div className="adm-stat-value success">
              {users.filter(u => u.canAccessAdminCatalog).length}
            </div>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div className="adm-toolbar">
          <input
            id="admin-search"
            type="search"
            className="adm-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            id="btn-refresh"
            className="adm-btn adm-btn-ghost"
            onClick={fetchUsers}
            title="Refresh list"
            style={{ padding: "8px 14px" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 7A5 5 0 112 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 3v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* ── User table ──────────────────────────────────────────────── */}
        <div className="adm-table-wrap">
          {loading ? (
            <div className="adm-spinner" role="status" aria-label="Loading users" />
          ) : fetchError ? (
            <div className="adm-empty" role="alert">{fetchError}</div>
          ) : filtered.length === 0 ? (
            <div className="adm-empty">
              {search ? `No users match "${search}"` : "No users found."}
            </div>
          ) : (
            <table className="adm-table" aria-label="User management table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Catalog Access</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <AnimatePresence initial={false}>
                <tbody>
                  {filtered.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelf={user.id === session.user.id}
                      onUpdate={handleUpdate}
                      onDelete={setDeleteTarget}
                      onToggleAccess={handleToggleAccess}
                    />
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreateUserModal
            key="create"
            onCreated={u => { setUsers(prev => [...prev, u]); setShowCreate(false); }}
            onClose={() => setShowCreate(false)}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            key="delete"
            user={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
