'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Sidebar from './Sidebar'
import {
  HomeIcon,
  InvoiceIcon,
  ClientsIcon,
  MoreIcon,
  PlusIcon,
  PaymentsIcon,
  SettingsIcon,
  LogOutIcon,
} from '@/components/ui/icons'

// Mobile-first app shell (IMS style):
//  • <lg  — sticky top header + fixed bottom tab bar (Home · Invoices · center
//           New-invoice FAB · Clients · More) with a slide-up "More" sheet.
//  • lg+  — white fixed sidebar (w-60) + slim top bar with a settings avatar.
export default function AppShell({ brand, children }) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [today, setToday] = useState('')

  // Set on the client only, to avoid an SSR/client date mismatch.
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )
  }, [])

  const initial = (brand || '').trim().charAt(0).toUpperCase() || '₦'
  const isActive = (base) => pathname === base || pathname.startsWith(base + '/')
  const moreActive = isActive('/payments') || isActive('/settings')

  return (
    <div className="min-h-screen bg-base">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-surface border-r border-border">
        <Sidebar brand={brand} />
      </aside>

      <div className="lg:pl-60">
        {/* ── Mobile top header ── */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-accent text-white font-bold text-sm shrink-0">
              ₦
            </span>
            <span className="font-semibold text-text-primary truncate">{brand}</span>
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            {initial}
          </Link>
        </header>

        {/* ── Desktop top bar ── */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-surface border-b border-border">
          <p className="text-sm text-text-secondary">{today}</p>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm"
            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            {initial}
          </Link>
        </header>

        <main className="px-5 py-6 md:px-8 md:py-8 pb-28 lg:pb-10 max-w-[1200px] mx-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border flex items-stretch px-2"
        style={{
          height: 'calc(4rem + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <TabItem href="/dashboard" label="Home" icon={HomeIcon} active={isActive('/dashboard')} />
        <TabItem href="/invoices" label="Invoices" icon={InvoiceIcon} active={isActive('/invoices')} />

        {/* center FAB → new invoice */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/invoices/new"
            aria-label="New invoice"
            className="flex items-center justify-center rounded-full text-white"
            style={{ width: 56, height: 56, marginTop: -22, background: 'var(--accent)', boxShadow: 'var(--shadow-lg)' }}
          >
            <PlusIcon size={26} />
          </Link>
        </div>

        <TabItem href="/clients" label="Clients" icon={ClientsIcon} active={isActive('/clients')} />
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
          style={{ color: moreActive ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <MoreIcon size={22} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* ── "More" bottom sheet ── */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sheetOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSheetOpen(false)}
        />
        <div
          className={`absolute inset-x-0 bottom-0 bg-surface border-t border-border transition-transform duration-200 ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <span className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
          </div>
          <div
            className="px-3 py-2"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <SheetLink href="/payments" label="Payments" icon={PaymentsIcon} onClick={() => setSheetOpen(false)} />
            <SheetLink href="/settings" label="Settings" icon={SettingsIcon} onClick={() => setSheetOpen(false)} />
            <button
              onClick={() => {
                setSheetOpen(false)
                signOut({ callbackUrl: '/login' })
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left"
              style={{ color: 'var(--error)' }}
            >
              <LogOutIcon size={20} />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabItem({ href, label, icon: Icon, active }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
      style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
    >
      <Icon size={22} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

function SheetLink({ href, label, icon: Icon, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-text-primary"
    >
      <Icon size={20} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
