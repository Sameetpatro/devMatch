import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export default function FilterBar({ filters, onChange, onApply, onReset }) {
  const [open, setOpen] = useState(false);

  const update = (patch) => onChange({ ...filters, ...patch });

  const apply = (e) => {
    e?.preventDefault();
    onApply();
    setOpen(false);
  };

  return (
    <div className="card p-4 sm:p-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} className="text-brand-500" />
          Filters
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-ghost text-xs sm:hidden">
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      <form
        onSubmit={apply}
        className={`${open ? 'block' : 'hidden'} sm:block mt-4 grid gap-3 sm:grid-cols-3`}
      >
        <div>
          <label className="label">Role</label>
          <input
            className="input"
            placeholder="frontend, backend, android..."
            value={filters.role}
            onChange={(e) => update({ role: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Skills (comma separated)</label>
          <input
            className="input"
            placeholder="React, Node, TypeScript"
            value={filters.skills}
            onChange={(e) => update({ skills: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Search by name</label>
          <input
            className="input"
            placeholder="alice"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        <div className="sm:col-span-3 flex items-center gap-2 justify-end">
          <button type="button" onClick={onReset} className="btn-ghost">
            <X size={16} />
            Clear
          </button>
          <button type="submit" className="btn-primary">
            Apply
          </button>
        </div>
      </form>
    </div>
  );
}
