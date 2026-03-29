import { supabase } from '../lib/supabase';
import type { HistoryEntry, TailoredCV } from '../types/cv';

export async function saveHistory(userId: string, jobDescription: string, tailoredCV: TailoredCV): Promise<void> {
  const { error } = await supabase.from('cv_history').insert({
    user_id: userId,
    job_description_snippet: jobDescription.substring(0, 200),
    tailored_cv: tailoredCV,
  });
  if (error) throw new Error(error.message);
}

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('cv_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    jobDescriptionSnippet: row.job_description_snippet,
    tailoredCV: row.tailored_cv as TailoredCV,
    createdAt: row.created_at,
  }));
}
