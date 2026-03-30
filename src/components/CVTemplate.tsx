import type { TailoredCV } from '../types/cv';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ClassicTemplate from './templates/ClassicTemplate';

export type TemplateId = 'modern' | 'minimal' | 'classic';

interface Props { cv: TailoredCV; template: TemplateId; }

export default function CVTemplate({ cv, template }: Props) {
  if (template === 'minimal') return <MinimalTemplate cv={cv} />;
  if (template === 'classic') return <ClassicTemplate cv={cv} />;
  return <ModernTemplate cv={cv} />;
}
