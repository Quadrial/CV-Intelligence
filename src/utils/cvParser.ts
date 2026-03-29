import type { CVProfile, WorkExperience, Education, TechnicalProject, Certification } from '../types/cv';

/** Extract raw text from a PDF file using pdfjs-dist */
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }

  return pages.join('\n');
}

/** Extract raw text from a .docx file using mammoth */
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/** Best-effort parse of raw CV text into a CVProfile shape */
function parseTextToProfile(text: string): Partial<CVProfile> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const profile: Partial<CVProfile> = {};

  // Email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  if (emailMatch) profile.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  if (phoneMatch) profile.phone = phoneMatch[0].trim();

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) profile.linkedinUrl = 'https://' + linkedinMatch[0];

  // GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  if (githubMatch) profile.githubUrl = 'https://' + githubMatch[0];

  // Portfolio
  const portfolioMatch = text.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.[a-z]{2,}[\w/.-]*/i);
  if (portfolioMatch) profile.portfolioUrl = portfolioMatch[0];

  // Full name — heuristic: first non-empty line that looks like a name
  const nameLine = lines.find(l => /^[A-Z][a-z]+ [A-Z]/.test(l) && l.split(' ').length <= 5);
  if (nameLine) profile.fullName = nameLine;

  // Summary — look for a paragraph after "summary" or "profile" heading
  const summaryIdx = lines.findIndex(l => /^(professional\s+)?summary|profile|objective/i.test(l));
  if (summaryIdx !== -1) {
    const summaryLines: string[] = [];
    for (let i = summaryIdx + 1; i < Math.min(summaryIdx + 6, lines.length); i++) {
      if (/^(experience|education|skills|certif|project|award)/i.test(lines[i])) break;
      summaryLines.push(lines[i]);
    }
    if (summaryLines.length) profile.summary = summaryLines.join(' ');
  }

  // Skills — look for skills section
  const skillsIdx = lines.findIndex(l => /^(technical\s+)?skills|competencies/i.test(l));
  if (skillsIdx !== -1) {
    const skillLines: string[] = [];
    for (let i = skillsIdx + 1; i < Math.min(skillsIdx + 10, lines.length); i++) {
      if (/^(experience|education|certif|project|award)/i.test(lines[i])) break;
      skillLines.push(lines[i]);
    }
    profile.technicalSkills = skillLines.join(', ');
  }

  // Experience — basic extraction
  const expIdx = lines.findIndex(l => /^(work\s+)?experience|employment/i.test(l));
  if (expIdx !== -1) {
    const experiences: WorkExperience[] = [];
    let current: Partial<WorkExperience> | null = null;
    const descLines: string[] = [];

    for (let i = expIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(education|skills|certif|project|award|publication)/i.test(line)) break;

      const dateRange = line.match(/(\w+\s+\d{4}|\d{4})\s*[-–]\s*(\w+\s+\d{4}|\d{4}|present)/i);
      if (dateRange) {
        if (current) {
          current.description = descLines.join('\n');
          experiences.push(current as WorkExperience);
          descLines.length = 0;
        }
        current = {
          jobTitle: lines[i - 1] ?? '',
          company: '',
          startDate: dateRange[1],
          endDate: dateRange[2].toLowerCase() === 'present' ? null : dateRange[2],
          description: '',
        };
      } else if (current) {
        descLines.push(line);
      }
    }
    if (current) {
      current.description = descLines.join('\n');
      experiences.push(current as WorkExperience);
    }
    if (experiences.length) profile.experience = experiences;
  }

  // Education
  const eduIdx = lines.findIndex(l => /^education/i.test(l));
  if (eduIdx !== -1) {
    const educations: Education[] = [];
    for (let i = eduIdx + 1; i < Math.min(eduIdx + 15, lines.length); i++) {
      const line = lines[i];
      if (/^(certif|skills|project|award|publication|experience)/i.test(line)) break;
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        educations.push({
          degree: lines[i - 1] ?? line,
          institution: '',
          graduationYear: yearMatch[0],
        });
      }
    }
    if (educations.length) profile.education = educations;
  }

  // Certifications
  const certIdx = lines.findIndex(l => /^certif/i.test(l));
  if (certIdx !== -1) {
    const certs: Certification[] = [];
    for (let i = certIdx + 1; i < Math.min(certIdx + 10, lines.length); i++) {
      const line = lines[i];
      if (/^(education|skills|project|award|publication|experience)/i.test(line)) break;
      if (line.length > 3) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        certs.push({ name: line, issuer: '', year: yearMatch?.[0] ?? '' });
      }
    }
    if (certs.length) profile.certifications = certs;
  }

  // Projects
  const projIdx = lines.findIndex(l => /^(technical\s+)?projects?/i.test(l));
  if (projIdx !== -1) {
    const projects: TechnicalProject[] = [];
    for (let i = projIdx + 1; i < Math.min(projIdx + 20, lines.length); i++) {
      const line = lines[i];
      if (/^(education|skills|certif|award|publication|experience)/i.test(line)) break;
      if (line.length > 5 && !/^[-•]/.test(line)) {
        projects.push({ name: line, description: '', techStack: '', contribution: '' });
      }
    }
    if (projects.length) profile.projects = projects;
  }

  // Awards
  const awardsIdx = lines.findIndex(l => /^awards?|honors?/i.test(l));
  if (awardsIdx !== -1) {
    const awardLines: string[] = [];
    for (let i = awardsIdx + 1; i < Math.min(awardsIdx + 8, lines.length); i++) {
      if (/^(education|skills|certif|project|publication|experience)/i.test(lines[i])) break;
      awardLines.push(lines[i]);
    }
    profile.awards = awardLines.join('\n');
  }

  return profile;
}

export async function parseCVFile(file: File): Promise<Partial<CVProfile>> {
  let text = '';

  if (file.type === 'application/pdf') {
    text = await extractPdfText(file);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    text = await extractDocxText(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or .docx file.');
  }

  return parseTextToProfile(text);
}
