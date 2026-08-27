import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { business } from '@/lib/schema'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'

// Server layout for every authenticated page. middleware.js already gates
// access; here we just load the business name for the sidebar brand.
export default async function AppLayout({ children }) {
  let brand = 'My Business'
  try {
    const rows = await db
      .select({ name: business.name })
      .from(business)
      .where(eq(business.id, 1))
    if (rows[0]?.name) brand = rows[0].name
  } catch {
    // DB not reachable yet — fall back to the default brand.
  }

  return (
    <ToastProvider>
      <AppShell brand={brand}>{children}</AppShell>
    </ToastProvider>
  )
}
