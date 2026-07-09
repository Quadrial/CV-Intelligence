import { supabase } from '../lib/supabase';

export interface UserSettings {
  dailyUsageCount: number;  // how many times used today with the app key
  lastUsedDate: string;     // ISO date string YYYY-MM-DD
  personalApiKey: string;   // their own Gemini key (empty = not set)
}

const DAILY_FREE_LIMIT = 2;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data } = await supabase
    .from('user_settings')
    .select('daily_usage_count, last_used_date, personal_api_key')
    .eq('user_id', userId)
    .single();

  const lastUsedDate = data?.last_used_date ?? '';
  const today = todayISO();

  // If stored date is not today, treat count as 0 (daily reset)
  const dailyUsageCount = lastUsedDate === today ? (data?.daily_usage_count ?? 0) : 0;

  return {
    dailyUsageCount,
    lastUsedDate,
    personalApiKey: data?.personal_api_key ?? '',
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const current = await getSettings(userId);
  const today = todayISO();
  const newCount = current.lastUsedDate === today ? current.dailyUsageCount + 1 : 1;

  await supabase.from('user_settings').upsert({
    user_id: userId,
    daily_usage_count: newCount,
    last_used_date: today,
    personal_api_key: current.personalApiKey,
  });
}

export async function savePersonalApiKey(userId: string, apiKey: string): Promise<void> {
  const current = await getSettings(userId);
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    daily_usage_count: current.dailyUsageCount,
    last_used_date: current.lastUsedDate,
    personal_api_key: apiKey.trim(),
  });
  if (error) throw new Error(error.message);
}

export function hasFreeTrial(settings: UserSettings): boolean {
  return settings.dailyUsageCount < DAILY_FREE_LIMIT;
}

export function remainingFree(settings: UserSettings): number {
  return Math.max(0, DAILY_FREE_LIMIT - settings.dailyUsageCount);
}

export { DAILY_FREE_LIMIT };
