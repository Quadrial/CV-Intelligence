import { supabase } from '../lib/supabase';

export interface UserSettings {
  freeUsageCount: number;   // how many times they've used the app key
  personalApiKey: string;   // their own Gemini key (empty = not set)
}

const APP_FREE_LIMIT = 2;

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data } = await supabase
    .from('user_settings')
    .select('free_usage_count, personal_api_key')
    .eq('user_id', userId)
    .single();

  return {
    freeUsageCount: data?.free_usage_count ?? 0,
    personalApiKey: data?.personal_api_key ?? '',
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const current = await getSettings(userId);
  await supabase.from('user_settings').upsert({
    user_id: userId,
    free_usage_count: current.freeUsageCount + 1,
    personal_api_key: current.personalApiKey,
  });
}

export async function savePersonalApiKey(userId: string, apiKey: string): Promise<void> {
  const current = await getSettings(userId);
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    free_usage_count: current.freeUsageCount,
    personal_api_key: apiKey.trim(),
  });
  if (error) throw new Error(error.message);
}

export function hasFreeTrial(settings: UserSettings): boolean {
  return settings.freeUsageCount < APP_FREE_LIMIT;
}

export function remainingFree(settings: UserSettings): number {
  return Math.max(0, APP_FREE_LIMIT - settings.freeUsageCount);
}

export { APP_FREE_LIMIT };
