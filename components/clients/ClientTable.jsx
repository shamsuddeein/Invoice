import Link from 'next/link'
import { EyeIcon, TrashIcon } from '@/components/ui/icons'

// Presentational client list. Name links to the detail page; the only in-row
// color is none (UI Rule 5) — actions are neutral icon buttons.
export default function ClientTable({ clients, onDelete }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-x-auto">
      <table className="table min-w-[560px]">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/clients/${c.id}`} className="font-medium hover:text-accent-dark">
                  {c.name}
                </Link>
              </td>
              <td className="text-text-secondary">{c.email || '—'}</td>
              <td className="text-text-secondary">{c.phone || '—'}</td>
              <td className="col-actions">
                <div className="inline-flex items-center gap-1 justify-end">
                  <Link href={`/clients/${c.id}`} className="icon-btn" aria-label="View client">
                    <EyeIcon size={16} />
                  </Link>
                  <button className="icon-btn danger" onClick={() => onDelete(c)} aria-label="Delete client">
                    <TrashIcon size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
