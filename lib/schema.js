import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

// ─── Business ─────────────────────────────────────────────────────────
// Single row only (id = 1). Updated via the /settings page.
export const business = sqliteTable('business', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull().default(''),
  email: text('email').default(''),
  phone: text('phone').default(''),
  address: text('address').default(''),
  logo: text('logo').default(''), // URL or base64
  bankName: text('bank_name').default(''),
  accountNumber: text('account_number').default(''),
  accountName: text('account_name').default(''),
  taxRate: real('tax_rate').default(0),
  invoicePrefix: text('invoice_prefix').default('INV'),
  receiptPrefix: text('receipt_prefix').default('RCPT'),
  nextInvoiceNumber: integer('next_invoice_number').default(1),
  nextReceiptNumber: integer('next_receipt_number').default(1),
  updatedAt: text('updated_at'),
})

// ─── Clients ─────────────────────────────────────────────────────────
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').default(''),
  phone: text('phone').default(''),
  address: text('address').default(''),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  // createdAt — the clients list and each client's history are ordered newest-first.
  createdAtIdx: index('clients_created_at_idx').on(t.createdAt),
}))

// ─── Invoices ─────────────────────────────────────────────────────────
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id),
  issueDate: text('issue_date').notNull(),
  // Retained for schema compatibility only — the due-date feature was removed, so
  // this is always written as '' on create/update (kept to avoid a table migration).
  dueDate: text('due_date').notNull(),
  // draft | sent | partially_paid | paid
  status: text('status').notNull().default('draft'),
  notes: text('notes').default(''),
  subtotal: real('subtotal').notNull().default(0),
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),
  totalAmount: real('total_amount').notNull().default(0),
  amountPaid: real('amount_paid').default(0),
  balanceDue: real('balance_due').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
}, (t) => ({
  // clientId — every list/dashboard read joins invoices → clients.
  clientIdIdx: index('invoices_client_id_idx').on(t.clientId),
  // status — the invoices list filters by status; the dashboard sums by it.
  statusIdx: index('invoices_status_idx').on(t.status),
  // createdAt — every list is ordered newest-first.
  createdAtIdx: index('invoices_created_at_idx').on(t.createdAt),
}))

// ─── Invoice Items ─────────────────────────────────────────────────────
export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  lineTotal: real('line_total').notNull().default(0),
}, (t) => ({
  // Every invoice detail/edit/delete loads or replaces its items by invoiceId.
  invoiceIdIdx: index('invoice_items_invoice_id_idx').on(t.invoiceId),
}))

// ─── Payments ──────────────────────────────────────────────────────────
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id),
  receiptNumber: text('receipt_number').notNull().unique(),
  amountPaid: real('amount_paid').notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method').notNull(), // cash | transfer | POS | cheque
  referenceNumber: text('reference_number').default(''),
  note: text('note').default(''),
  createdAt: text('created_at').notNull(),
}, (t) => ({
  // Payments are always read and aggregated by their invoice.
  invoiceIdIdx: index('payments_invoice_id_idx').on(t.invoiceId),
  // Dashboard "collected this month" filters/sorts by paymentDate.
  paymentDateIdx: index('payments_payment_date_idx').on(t.paymentDate),
}))

// ─── App auth ─────────────────────────────────────────────────────────
// Single row (id = 1) holding the owner's hashed login password. Kept in its
// OWN table — never a column on `business` — because /api/business returns the
// whole business row to the client, which would leak the hash. An absent row
// means login falls back to the OWNER_PASSWORD env bootstrap (see lib/auth.js).
export const appAuth = sqliteTable('app_auth', {
  id: integer('id').primaryKey().default(1),
  passwordHash: text('password_hash').notNull(),
  updatedAt: text('updated_at'),
})
