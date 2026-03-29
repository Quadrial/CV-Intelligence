import type { TailoredCV } from '../types/cv';

export function generateFileName(fullName: string, ext: 'pdf' | 'docx'): string {
  const date = new Date().toISOString().split('T')[0];
  const name = fullName.trim().replace(/\s+/g, '_');
  return `${name}_CV_${date}.${ext}`;
}

function toBulletLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => (l.startsWith('•') ? l : `• ${l}`));
}

function toSkillArray(text: string): string[] {
  return text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
}

export async function exportPDF(cv: TailoredCV, fileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210, margin = 18, contentW = pageW - margin * 2;
  let y = 20;

  const addPage = () => { doc.addPage(); y = 20; };
  const checkY = (n = 10) => { if (y + n > 278) addPage(); };

  // Header
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(20, 20, 20);
  doc.text(cv.fullName, pageW / 2, y, { align: 'center' }); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 90);
  doc.text([cv.email, cv.phone, cv.location].filter(Boolean).join('  ·  '), pageW / 2, y, { align: 'center' }); y += 5;
  const linkParts = [cv.linkedinUrl, cv.githubUrl, cv.portfolioUrl].filter(Boolean) as string[];
  if (linkParts.length) {
    doc.setTextColor(99, 102, 241);
    doc.text(linkParts.join('  |  '), pageW / 2, y, { align: 'center' }); y += 5;
  }
  doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y); y += 6;

  const sectionTitle = (title: string) => {
    checkY(12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(79, 70, 229);
    doc.text(title.toUpperCase(), margin, y); y += 1.5;
    doc.setDrawColor(199, 210, 254); doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y); y += 5;
    doc.setTextColor(30, 30, 30);
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
    doc.splitTextToSize(text, contentW - indent).forEach((line: string) => {
      checkY(5); doc.text(line, margin + indent, y); y += 4.5;
    });
  };

  const bulletLines = (text: string) => {
    toBulletLines(text).forEach(line => {
      checkY(5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      const wrapped = doc.splitTextToSize(line, contentW - 4);
      wrapped.forEach((wl: string, wi: number) => {
        doc.text(wl, margin + 4 + (wi > 0 ? 3 : 0), y); y += 4.5;
      });
    });
  };

  // 1. Summary
  if (cv.tailoredSummary) { sectionTitle('Professional Summary'); bodyText(cv.tailoredSummary); y += 3; }

  // 2. Education
  if (cv.education?.length) {
    sectionTitle('Education');
    cv.education.forEach(edu => {
      checkY(10);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
      doc.text(edu.degree, margin, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110, 110, 110);
      doc.text(edu.graduationYear, pageW - margin - doc.getTextWidth(edu.graduationYear), y); y += 4.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 90);
      doc.text(edu.institution + (edu.honors ? ` — ${edu.honors}` : ''), margin, y); y += 6;
    });
  }

  // 3. Core Competencies
  if (cv.technicalSkills || cv.softSkills) {
    sectionTitle('Core Competencies');
    if (cv.technicalSkills) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      doc.text('Technical Skills:', margin, y); y += 5;
      bodyText(toSkillArray(cv.technicalSkills).join('  ·  '), 4);
    }
    if (cv.softSkills) {
      y += 1;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      doc.text('Soft Skills:', margin, y); y += 5;
      bodyText(toSkillArray(cv.softSkills).join('  ·  '), 4);
    }
    y += 3;
  }

  // 4. Work Experience
  if (cv.experience?.length) {
    sectionTitle('Work Experience');
    cv.experience.forEach(exp => {
      checkY(14);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
      doc.text(exp.jobTitle, margin, y);
      const dateStr = `${exp.startDate} – ${exp.endDate ?? 'Present'}`;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110, 110, 110);
      doc.text(dateStr, pageW - margin - doc.getTextWidth(dateStr), y); y += 4.5;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(90, 90, 90);
      doc.text(exp.company, margin, y); y += 5;
      if (exp.description) bulletLines(exp.description);
      y += 3;
    });
  }

  // 5. Technical Projects
  if (cv.projects?.length) {
    sectionTitle('Technical Projects');
    cv.projects.forEach(proj => {
      checkY(12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
      doc.text(proj.name, margin, y); y += 4.5;
      if (proj.techStack) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(99, 102, 241);
        doc.text(`Stack: ${proj.techStack}`, margin, y); y += 4.5;
      }
      if (proj.description) bodyText(proj.description, 3);
      if (proj.contribution) bodyText(`Contribution: ${proj.contribution}`, 3);
      y += 3;
    });
  }

  // 6. Certifications
  if (cv.certifications?.length) {
    sectionTitle('Certifications');
    cv.certifications.forEach(cert => {
      checkY(6);
      bodyText(`• ${cert.name}${cert.issuer ? ` — ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}`, 2);
    });
    y += 2;
  }

  // 7. Memberships
  if (cv.memberships) { sectionTitle('Professional Memberships'); bulletLines(cv.memberships); y += 3; }

  // 8. Awards
  if (cv.awards) { sectionTitle('Awards & Honors'); bulletLines(cv.awards); y += 3; }

  // 9. Publications
  if (cv.publications?.length) {
    sectionTitle('Research & Publications');
    cv.publications.forEach(pub => {
      checkY(6);
      bodyText(`• ${pub.title}${pub.year ? ` (${pub.year})` : ''}${pub.link ? ` — ${pub.link}` : ''}`, 2);
    });
  }

  doc.save(fileName);
}

export async function exportDocx(cv: TailoredCV, fileName: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');

  const heading = (text: string) => new Paragraph({
    text: text.toUpperCase(), heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '6366F1' } },
  });
  const bold = (text: string, size = 20) => new TextRun({ text, bold: true, size });
  const normal = (text: string, size = 18) => new TextRun({ text, size });
  const italic = (text: string) => new TextRun({ text, italics: true, size: 18, color: '666666' });
  const bullet = (text: string) => new Paragraph({
    children: [normal(text.replace(/^•\s*/, ''))],
    bullet: { level: 0 }, spacing: { after: 40 },
  });

  const paras: InstanceType<typeof Paragraph>[] = [];

  // Header
  paras.push(new Paragraph({ children: [new TextRun({ text: cv.fullName, bold: true, size: 36 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
  paras.push(new Paragraph({ children: [normal([cv.email, cv.phone, cv.location].filter(Boolean).join('  ·  '), 17)], alignment: AlignmentType.CENTER }));
  const links = [cv.linkedinUrl, cv.githubUrl, cv.portfolioUrl].filter(Boolean).join('  |  ');
  if (links) paras.push(new Paragraph({ children: [new TextRun({ text: links, size: 17, color: '4F46E5' })], alignment: AlignmentType.CENTER }));
  paras.push(new Paragraph({ text: '' }));

  // 1. Summary
  if (cv.tailoredSummary) {
    paras.push(heading('Professional Summary'));
    paras.push(new Paragraph({ children: [normal(cv.tailoredSummary)], spacing: { after: 120 } }));
  }

  // 2. Education
  if (cv.education?.length) {
    paras.push(heading('Education'));
    cv.education.forEach(edu => paras.push(new Paragraph({
      children: [bold(edu.degree), normal(`  —  ${edu.institution}`), italic(`  ${edu.graduationYear}${edu.honors ? ` | ${edu.honors}` : ''}`)],
      spacing: { after: 60 },
    })));
  }

  // 3. Skills
  if (cv.technicalSkills || cv.softSkills) {
    paras.push(heading('Core Competencies'));
    if (cv.technicalSkills) paras.push(new Paragraph({ children: [bold('Technical Skills: '), normal(cv.technicalSkills)] }));
    if (cv.softSkills) paras.push(new Paragraph({ children: [bold('Soft Skills: '), normal(cv.softSkills)], spacing: { after: 60 } }));
  }

  // 4. Experience
  if (cv.experience?.length) {
    paras.push(heading('Work Experience'));
    cv.experience.forEach(exp => {
      paras.push(new Paragraph({ children: [bold(exp.jobTitle), normal(`  |  ${exp.company}`), italic(`  ${exp.startDate} – ${exp.endDate ?? 'Present'}`)] }));
      if (exp.description) toBulletLines(exp.description).forEach(line => paras.push(bullet(line)));
      paras.push(new Paragraph({ text: '', spacing: { after: 80 } }));
    });
  }

  // 5. Projects
  if (cv.projects?.length) {
    paras.push(heading('Technical Projects'));
    cv.projects.forEach(proj => {
      paras.push(new Paragraph({ children: [bold(proj.name)] }));
      if (proj.techStack) paras.push(new Paragraph({ children: [italic(`Stack: ${proj.techStack}`)] }));
      if (proj.description) paras.push(new Paragraph({ children: [normal(proj.description)] }));
      if (proj.contribution) paras.push(new Paragraph({ children: [bold('Contribution: '), normal(proj.contribution)] }));
      paras.push(new Paragraph({ text: '', spacing: { after: 60 } }));
    });
  }

  // 6. Certifications
  if (cv.certifications?.length) {
    paras.push(heading('Certifications'));
    cv.certifications.forEach(cert =>
      paras.push(bullet(`${cert.name}${cert.issuer ? ` — ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}`))
    );
  }

  // 7. Memberships
  if (cv.memberships) { paras.push(heading('Professional Memberships')); toBulletLines(cv.memberships).forEach(l => paras.push(bullet(l))); }

  // 8. Awards
  if (cv.awards) { paras.push(heading('Awards & Honors')); toBulletLines(cv.awards).forEach(l => paras.push(bullet(l))); }

  // 9. Publications
  if (cv.publications?.length) {
    paras.push(heading('Research & Publications'));
    cv.publications.forEach(pub =>
      paras.push(bullet(`${pub.title}${pub.year ? ` (${pub.year})` : ''}${pub.link ? ` — ${pub.link}` : ''}`))
    );
  }

  const doc = new Document({ sections: [{ properties: {}, children: paras }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
}
