import { supabase } from './supabase';

/**
 * REQUIRED: Run this SQL in your Supabase SQL editor once:
 *
 * CREATE TABLE IF NOT EXISTS profiles (
 *   id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *   email TEXT NOT NULL,
 *   role TEXT NOT NULL DEFAULT 'user',
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read own profile" ON profiles
 *   FOR SELECT USING (auth.uid() = id);
 *
 * CREATE POLICY "Users can insert own profile" ON profiles
 *   FOR INSERT WITH CHECK (auth.uid() = id);
 *
 * -- To make yourself admin, run:
 * -- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
 */

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Create profile row with default role 'user'
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email, role: 'user' }]);

    // Non-fatal: profile may already exist
    if (profileError && profileError.code !== '23505') {
      console.error('Profile creation error:', profileError);
    }
  }

  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};
