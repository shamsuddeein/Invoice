import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

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
})

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
})

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
})

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
})
