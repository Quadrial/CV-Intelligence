import type { TailoredCV } from '../types/cv';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ClassicTemplate from './templates/ClassicTemplate';

export type TemplateId = 'modern' | 'minimal' | 'classic';

type CVSectionVisibility = {
  projects: boolean;
  certifications: boolean;
  memberships: boolean;
  awards: boolean;
  publications: boolean;
  researchInterests: boolean;
  references: boolean;
};

interface Props { 
  cv: TailoredCV; 
  template: TemplateId; 
  sectionVisibility?: CVSectionVisibility;
}

export default function CVTemplate({ cv, template, sectionVisibility }: Props) {
  const defaultVisibility: CVSectionVisibility = {
    projects: true,
    certifications: true,
    memberships: true,
    awards: true,
    publications: true,
    researchInterests: true,
    references: true,
  };
  
  const visibility = sectionVisibility || defaultVisibility;
  
  if (template === 'minimal') return <MinimalTemplate cv={cv} sectionVisibility={visibility} />;
  if (template === 'classic') return <ClassicTemplate cv={cv} sectionVisibility={visibility} />;
  return <ModernTemplate cv={cv} sectionVisibility={visibility} />;
}
