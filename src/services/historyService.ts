import { supabase } from '../lib/supabase';
import type { HistoryEntry, TailoredCV } from '../types/cv';

export async function saveHistory(
  userId: string,
  jobDescription: string,
  tailoredCV: TailoredCV,
  coverLetter?: string,
): Promise<{ id: string; createdAt: string }> {
  const payload = {
    user_id: userId,
    job_description_snippet: jobDescription.substring(0, 200),
    tailored_cv: { ...tailoredCV, coverLetter },
  };

  const { data, error } = await supabase
    .from('cv_history')
    .insert(payload)
    .select('id, created_at')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to save history.');
  return { id: data.id, createdAt: data.created_at };
}

export async function updateHistory(
  userId: string,
  entryId: string,
  tailoredCV: TailoredCV,
  coverLetter?: string,
): Promise<void> {
  const { error } = await supabase
    .from('cv_history')
    .update({ tailored_cv: { ...tailoredCV, coverLetter } })
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function deleteHistory(userId: string, entryId: string): Promise<void> {
  const { error } = await supabase
    .from('cv_history')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

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
    coverLetter: (row.tailored_cv as TailoredCV).coverLetter,
    createdAt: row.created_at,
  }));
}
