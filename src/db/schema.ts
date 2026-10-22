import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Enterprise user profile table for Orqestra.
 * Authentication records themselves remain owned by Neon Auth in the neon_auth schema.
 */
export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

// Backwards compatibility alias
export const appUserProfiles = userProfiles;
export type AppUserProfile = UserProfile;
export type NewAppUserProfile = NewUserProfile;
