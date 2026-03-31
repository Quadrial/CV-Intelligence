export interface WorkExperience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string; // STAR method bullet points
}

export interface Education {
  degree: string;
  institution: string;
  graduationYear: string;
  honors?: string;
}

export interface TechnicalProject {
  name: string;
  description: string;
  techStack: string;
  contribution: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface Publication {
  title: string;
  year: string;
  link?: string;
}

export interface CVProfile {
  userId?: string;
  // Header
  fullName: string;
  phone: string;
  email: string;
  location: string;
  // Links
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  // Summary
  summary: string;
  // Skills
  technicalSkills: string;   // comma-separated or free text
  softSkills: string;
  // Experience
  experience: WorkExperience[];
  // Projects
  projects: TechnicalProject[];
  // Education
  education: Education[];
  // Certifications
  certifications: Certification[];
  // Memberships
  memberships: string;
  // Awards
  awards: string;
  // Publications
  publications: Publication[];
}

export interface TailoredCV {
  fullName: string;
  phone: string;
  email: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  tailoredSummary: string;
  technicalSkills: string;
  softSkills: string;
  experience: WorkExperience[];
  projects: TechnicalProject[];
  education: Education[];
  certifications: Certification[];
  memberships: string;
  awards: string;
  publications: Publication[];
}

export interface HistoryEntry {
  id: string;
  userId: string;
  jobDescriptionSnippet: string;
  tailoredCV: TailoredCV;
  createdAt: string;
}

export interface AtsScore {
  score: number;           // 0–100
  matchedKeywords: string[];
  missingKeywords: string[];
  feedback: string;        // 2–3 sentence summary
}

export interface GenerateResult {
  tailoredCV: TailoredCV;
  atsScore: AtsScore;
  coverLetter: string;     // plain text, ready to copy/download
}
