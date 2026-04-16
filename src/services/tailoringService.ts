import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CVProfile, GenerateResult } from '../types/cv';

const APP_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const FALLBACK_API_KEY = import.meta.env.VITE_GEMINI_FALLBACK_API_KEY as string | undefined;
const PRIMARY_MODEL = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash';
const FALLBACK_MODEL = import.meta.env.VITE_GEMINI_FALLBACK_MODEL as string | undefined;

function getFriendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (/API_KEY_INVALID|key expired|API key expired|401|403|unauthorized/i.test(msg))
    return 'The Gemini API key is invalid or expired. Add a valid API key in Profile settings.';
  if (/quota|rate.?limit|429/i.test(msg))
    return 'Gemini API rate limit reached. Please wait a moment and try again.';
  if (/503|Service Unavailable/i.test(msg))
    return 'The Gemini service is temporarily unavailable. Please wait a moment and try again.';
  if (/network|fetch|failed to fetch|timeout/i.test(msg))
    return 'Network error — check your internet connection and try again. If the problem persists, the AI service may be unavailable.';
  if (/invalid.?json|JSON/i.test(msg))
    return 'AI returned an unexpected response. Please try again.';
  return msg;
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /network|fetch|failed to fetch|timeout|503|500|Service Unavailable|rate.?limit|429|API_KEY_INVALID|key expired|API key expired|401|403|unauthorized/i.test(msg);
}

async function callGenerativeModel(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<GenerateResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelClient = genAI.getGenerativeModel({ model });
  const result = await modelClient.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(clean) as GenerateResult;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as GenerateResult; } catch { /* fall through */ }
    }
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}

export async function generateAll(
  profile: CVProfile,
  jobDescription: string,
  userApiKey?: string,
): Promise<GenerateResult> {
  const userKey = userApiKey?.trim();
  const keys = [
    ...(userKey ? [userKey] : []),
    ...(APP_API_KEY ? [APP_API_KEY] : []),
    ...(FALLBACK_API_KEY ? [FALLBACK_API_KEY] : []),
  ].filter((value, index, self) => value && self.indexOf(value) === index) as string[];

  if (!keys.length) throw new Error('No Gemini API key configured. Add your own key in Profile settings.');

  const models = [PRIMARY_MODEL, ...(FALLBACK_MODEL ? [FALLBACK_MODEL] : [])];

  const prompt = `You are an expert CV writer, career coach, and ATS specialist. Given a candidate's CV profile and a job description, produce three things in a single JSON response.

STRICT RULES:
1. Do NOT fabricate any work experience, education, or project entries not in the original profile.
2. Work Experience, Technical Projects, and Education must be copied EXACTLY — same entries, same descriptions, same dates. Only reorder experience to put the most relevant role first.
3. Actively rewrite these fields based on the job description:
   - tailoredSummary: 3–4 sentences referencing the job title and key requirements directly.
   - technicalSkills: Take the candidate's existing technical skills, reorder to put the most job-relevant first, then APPEND up to 6 missing keywords from the job description that are genuinely within the candidate's field of expertise and plausibly part of their background (e.g. if they are a metallurgical engineer, adding "HSE regulations" or "preventive maintenance" is valid). Do NOT add skills from a completely unrelated domain. Return as a single comma-separated string.
   - softSkills: Take the candidate's existing soft skills, reorder by relevance, then APPEND up to 3 missing soft skill keywords from the job description that are reasonable for this candidate's background. Return as a single comma-separated string.
   - certifications: Keep all, put most relevant first.
   - memberships, awards, publications: Keep as-is.
4. Every description field with multiple points must use bullet format: each point on its own line starting with "• ".
5. Calculate the atsScore AFTER the skills augmentation — the score must reflect the improved CV, not the original.
6. missingKeywords in atsScore must only list keywords that are STILL missing even after augmentation.
7. Return ONLY valid JSON — no markdown fences, no explanation, no extra text.

Return JSON matching this EXACT structure:
{
  "tailoredCV": {
    "fullName": string,
    "phone": string,
    "email": string,
    "location": string,
    "linkedinUrl": string | null,
    "githubUrl": string | null,
    "portfolioUrl": string | null,
    "tailoredSummary": string,
    "technicalSkills": string,
    "softSkills": string,
    "experience": [{ "jobTitle": string, "company": string, "startDate": string, "endDate": string | null, "description": string }],
    "projects": [{ "name": string, "description": string, "techStack": string, "contribution": string }],
    "education": [{ "degree": string, "institution": string, "graduationYear": string, "honors": string | null }],
    "certifications": [{ "name": string, "issuer": string, "year": string }],
    "memberships": string,
    "awards": string,
    "publications": [{ "title": string, "year": string, "link": string | null }]
  },
  "atsScore": {
    "score": number (0-100, based on keyword match between tailored CV and job description),
    "matchedKeywords": string[] (up to 10 key terms from the job description that appear in the CV),
    "missingKeywords": string[] (up to 8 important terms from the job description NOT in the CV),
    "feedback": string (2-3 sentences explaining the score and top improvement tips)
  },
  "coverLetter": string (a professional 3-paragraph cover letter tailored to this specific job. Use the candidate's name, reference the company/role from the job description, highlight 2-3 most relevant achievements. Plain text, no placeholders like [Company Name] — infer from the job description.)
}

JOB DESCRIPTION:
${jobDescription.substring(0, 8000)}

CANDIDATE CV PROFILE:
${JSON.stringify(profile, null, 2)}`;

  let lastError: unknown = new Error('Unknown error');
  for (const model of models) {
    for (const apiKey of keys) {
      try {
        return await callGenerativeModel(apiKey, model, prompt);
      } catch (err) {
        lastError = err;
        if (!isRetryableError(err)) throw err;
      }
    }
  }

  throw new Error(getFriendlyError(lastError));
}
