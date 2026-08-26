'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  DashboardIcon,
  InvoiceIcon,
  ClientsIcon,
  PaymentsIcon,
  SettingsIcon,
  LogOutIcon,
} from '@/components/ui/icons'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/invoices', label: 'Invoices', icon: InvoiceIcon },
  { href: '/clients', label: 'Clients', icon: ClientsIcon },
  { href: '/payments', label: 'Payments', icon: PaymentsIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ brand = 'My Business', onNavigate }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent text-white font-bold shrink-0">
          ₦
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">{brand}</div>
          <div className="text-[11px]" style={{ color: 'var(--sidebar-text)' }}>
            Invoicing
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`nav-link ${active ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="nav-link w-full text-left"
        >
          <LogOutIcon size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}
