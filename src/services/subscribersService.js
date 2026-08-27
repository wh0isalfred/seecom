import { supabase } from './supabase';

/**
 * RUN THIS SQL FIRST (see supabase/migrations/006_create_subscribers_table.sql):
 *
 * CREATE TABLE IF NOT EXISTS subscribers (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   email VARCHAR NOT NULL UNIQUE,
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public can subscribe" ON subscribers FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Admin read subscribers" ON subscribers FOR SELECT
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Subscribe an email to new-drop notifications.
 * Returns { ok: true, alreadySubscribed: boolean } or throws on unexpected errors.
 */
export const subscribeEmail = async (rawEmail) => {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    const err = new Error('Please enter a valid email address.');
    err.code = 'INVALID_EMAIL';
    throw err;
  }

  const { error } = await supabase.from('subscribers').insert([{ email }]);

  if (error) {
    // Postgres unique_violation — they're already on the list
    if (error.code === '23505') return { ok: true, alreadySubscribed: true };
    throw error;
  }

  return { ok: true, alreadySubscribed: false };
};
