import { useEffect, useMemo, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");

  const load = async () => {
    const res = await API.get("/users");
    setUsers(res.data.users || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const changeRole = async (id, nextRole) => {
    try {
      await API.patch(`/users/${id}/role`, { role: nextRole });
      toast.push("Role updated", "success");
      load();
    } catch (err) {
      toast.push(errorMessage(err), "danger");
    }
  };

  const filtered = useMemo(
    () =>
      users.filter((person) => {
        const hay = `${person.name} ${person.email} ${person.department}`.toLowerCase();
        const matchesQuery = hay.includes(query.toLowerCase());
        const matchesRole = role ? person.role === role : true;
        return matchesQuery && matchesRole;
      }),
    [users, query, role]
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>People</h2>
          <p className="muted">Public signup is limited to student and faculty. Promote admins from here.</p>
        </div>
      </div>

      <div className="form-grid">
        <input
          className="search"
          placeholder="Filter by name, email or department"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <section className="panel">
        {filtered.length === 0 && (
          <EmptyState title="No people match" body="Try another name or clear the role filter." />
        )}
        {filtered.map((person) => (
          <div className="row-item" key={person._id}>
            <div>
              <strong>{person.name}</strong>
              <p className="muted">
                {person.email} · {person.department || "No department"}
              </p>
            </div>
            <select value={person.role} onChange={(e) => changeRole(person._id, e.target.value)}>
              <option value="student">student</option>
              <option value="faculty">faculty</option>
              <option value="admin">admin</option>
            </select>
          </div>
        ))}
      </section>
    </div>
  );
}
