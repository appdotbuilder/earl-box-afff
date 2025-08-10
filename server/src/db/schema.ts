import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const filesTable = pgTable('files', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // Unique shareable identifier
  object_name: text('object_name').notNull(), // Object storage key/name
  size_bytes: integer('size_bytes').notNull(), // File size in bytes
  content_type: text('content_type').notNull(), // MIME type
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type File = typeof filesTable.$inferSelect; // For SELECT operations
export type NewFile = typeof filesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { files: filesTable };