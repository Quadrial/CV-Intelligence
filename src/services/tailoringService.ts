import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CVProfile, TailoredCV } from '../types/cv';

const APP_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API_KEY_INVALID|key expired|API key expired/i.test(msg))
    return 'The Gemini API key has expired or is invalid. Please add your own API key in your Profile settings to continue.';
  if (/quota|rate.?limit|429/i.test(msg))
    return 'Gemini API rate limit reached. Please wait a moment and try again, or add your own API key in Profile settings.';
  if (/network|fetch|failed to fetch/i.test(msg))
    return 'Network error — check your internet connection and try again.';
  if (/invalid.?json|JSON/i.test(msg))
    return 'AI returned an unexpected response. Please try again.';
  return msg;
}

export async function tailorCV(
  profile: CVProfile,
  jobDescription: string,
  userApiKey?: string,
): Promise<TailoredCV> {
  const key = userApiKey?.trim() || APP_API_KEY;
  if (!key) throw new Error('No Gemini API key configured. Add your own key in Profile settings.');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert CV writer and career coach. Your job is to tailor a candidate's CV to a specific job description so it passes ATS screening and impresses hiring managers.

STRICT RULES — follow every one:
1. Do NOT fabricate any experience, skills, education, or qualifications not in the original profile.
2. Work Experience, Technical Projects, and Education sections must be copied EXACTLY as provided — same entries, same descriptions, same dates. Only reorder experience entries to put the most relevant role first.
3. The following sections MUST be actively rewritten/filtered based on the job description:
   - tailoredSummary: Write a compelling 3–4 sentence summary that directly references the job title, key requirements from the job description, and the candidate's most relevant experience. Make it specific to THIS job.
   - technicalSkills: From the candidate's skills, select and reorder those most relevant to the job. Put the most job-relevant skills first.
   - softSkills: Select and reorder soft skills most relevant to the job description.
   - certifications: Keep all certifications but put the most relevant ones first.
   - memberships: Keep as-is or lightly reword to emphasise relevance to the role.
   - awards: Keep as-is.
   - publications: Keep as-is.
4. Return ONLY valid JSON — no markdown fences, no explanation, no extra text.
5. Every description field that contains multiple points must use bullet format: each point on its own line starting with "• ".

Return JSON matching this EXACT TypeScript interface (no extra fields):
{
  "fullName": string,
  "phone": string,
  "email": string,
  "location": string,
  "linkedinUrl": string | undefined,
  "githubUrl": string | undefined,
  "portfolioUrl": string | undefined,
  "tailoredSummary": string,
  "technicalSkills": string,
  "softSkills": string,
  "experience": [{ "jobTitle": string, "company": string, "startDate": string, "endDate": string | null, "description": string }],
  "projects": [{ "name": string, "description": string, "techStack": string, "contribution": string }],
  "education": [{ "degree": string, "institution": string, "graduationYear": string, "honors": string | undefined }],
  "certifications": [{ "name": string, "issuer": string, "year": string }],
  "memberships": string,
  "awards": string,
  "publications": [{ "title": string, "year": string, "link": string | undefined }]
}

JOB DESCRIPTION:
${jobDescription.substring(0, 8000)}

CANDIDATE CV PROFILE:
${JSON.stringify(profile, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      return JSON.parse(clean) as TailoredCV;
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]) as TailoredCV; } catch { /* fall through */ }
      }
      throw new Error('AI returned invalid JSON. Please try again.');
    }
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}
