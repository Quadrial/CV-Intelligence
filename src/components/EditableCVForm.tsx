import { useState } from 'react';
import type { TailoredCV } from '../types/cv';

interface EditableCVFormProps {
  cv: TailoredCV;
  onSave: (updatedCV: TailoredCV) => void;
  onCancel: () => void;
}

export default function EditableCVForm({ cv, onSave, onCancel }: EditableCVFormProps) {
  const [editedCV, setEditedCV] = useState<TailoredCV>(cv);

  const updateField = (field: keyof TailoredCV, value: string | string[]) => {
    setEditedCV(prev => ({ ...prev, [field]: value }));
  };

  const updateExperience = (
    index: number,
    field: keyof TailoredCV['experience'][0],
    value: string | null,
  ) => {
    const newExp = [...editedCV.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setEditedCV(prev => ({ ...prev, experience: newExp }));
  };

  const updateProject = (index: number, field: keyof TailoredCV['projects'][0], value: string) => {
    const newProj = [...editedCV.projects];
    newProj[index] = { ...newProj[index], [field]: value };
    setEditedCV(prev => ({ ...prev, projects: newProj }));
  };

  const handleSave = () => {
    onSave(editedCV);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Edit Your CV</h3>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Contact Information</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={editedCV.fullName}
              onChange={e => updateField('fullName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Full Name"
            />
            <input
              type="text"
              value={editedCV.phone}
              onChange={e => updateField('phone', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Phone"
            />
            <input
              type="email"
              value={editedCV.email}
              onChange={e => updateField('email', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Email"
            />
            <input
              type="text"
              value={editedCV.location}
              onChange={e => updateField('location', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Location"
            />
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Links</h4>
          <div className="space-y-3">
            <input
              type="url"
              value={editedCV.linkedinUrl || ''}
              onChange={e => updateField('linkedinUrl', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="LinkedIn URL"
            />
            <input
              type="url"
              value={editedCV.githubUrl || ''}
              onChange={e => updateField('githubUrl', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="GitHub URL"
            />
            <input
              type="url"
              value={editedCV.portfolioUrl || ''}
              onChange={e => updateField('portfolioUrl', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Portfolio URL"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300">Professional Summary</h4>
        <textarea
          value={editedCV.tailoredSummary}
          onChange={e => updateField('tailoredSummary', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Your professional summary..."
        />
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Technical Skills</h4>
          <textarea
            value={editedCV.technicalSkills}
            onChange={e => updateField('technicalSkills', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Technical skills..."
          />
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Soft Skills</h4>
          <textarea
            value={editedCV.softSkills}
            onChange={e => updateField('softSkills', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Soft skills..."
          />
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-300">Work Experience</h4>
        {editedCV.experience.map((exp, index) => (
          <div key={index} className="bg-slate-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <input
                type="text"
                value={exp.jobTitle}
                onChange={e => updateExperience(index, 'jobTitle', e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Job Title"
              />
              <input
                type="text"
                value={exp.company}
                onChange={e => updateExperience(index, 'company', e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Company"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <input
                type="text"
                value={exp.startDate}
                onChange={e => updateExperience(index, 'startDate', e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Start Date"
              />
              <input
                type="text"
                value={exp.endDate || ''}
                onChange={e => updateExperience(index, 'endDate', e.target.value || null)}
                className="px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="End Date (leave empty if current)"
              />
            </div>
            <textarea
              value={exp.description}
              onChange={e => updateExperience(index, 'description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Job description..."
            />
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-300">Technical Projects</h4>
        {editedCV.projects.map((proj, index) => (
          <div key={index} className="bg-slate-700 rounded-lg p-4 space-y-3">
            <input
              type="text"
              value={proj.name}
              onChange={e => updateProject(index, 'name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Project Name"
            />
            <textarea
              value={proj.description}
              onChange={e => updateProject(index, 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Project description..."
            />
            <input
              type="text"
              value={proj.techStack}
              onChange={e => updateProject(index, 'techStack', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tech Stack"
            />
            <textarea
              value={proj.contribution}
              onChange={e => updateProject(index, 'contribution', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-600 border border-slate-500 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Your contribution..."
            />
          </div>
        ))}
      </div>

      {/* Other sections can be added similarly */}
    </div>
  );
}