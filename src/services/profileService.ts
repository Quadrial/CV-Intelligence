import { supabase } from '../lib/supabase';
import type { CVProfile } from '../types/cv';

export async function getProfile(userId: string): Promise<CVProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.data as CVProfile;
}

export async function saveProfile(userId: string, profile: CVProfile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, data: profile, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
}
