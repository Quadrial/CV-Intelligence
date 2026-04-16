import { useState, useEffect } from 'react';

interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  dateApplied: string;
  status: 'Applied' | 'Interviewing' | 'Rejected' | 'Offer' | 'Accepted';
  cvUsed: string; // CV name or id
  notes?: string;
}

export default function JobTrackerPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    jobTitle: '',
    company: '',
    dateApplied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    cvUsed: '',
    notes: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('jobApplications');
    if (stored) {
      setApplications(JSON.parse(stored));
    }
  }, []);

  const saveApplications = (apps: JobApplication[]) => {
    setApplications(apps);
    localStorage.setItem('jobApplications', JSON.stringify(apps));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = applications.map(app =>
        app.id === editingId ? { ...app, ...formData } : app
      );
      saveApplications(updated);
      setEditingId(null);
    } else {
      const newApp: JobApplication = {
        id: Date.now().toString(),
        jobTitle: formData.jobTitle!,
        company: formData.company!,
        dateApplied: formData.dateApplied!,
        status: formData.status as JobApplication['status'],
        cvUsed: formData.cvUsed!,
        notes: formData.notes,
      };
      saveApplications([...applications, newApp]);
    }
    setFormData({
      jobTitle: '',
      company: '',
      dateApplied: new Date().toISOString().split('T')[0],
      status: 'Applied',
      cvUsed: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleEdit = (app: JobApplication) => {
    setFormData(app);
    setEditingId(app.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      saveApplications(applications.filter(app => app.id !== id));
    }
  };

  const statusColors = {
    Applied: 'bg-blue-900/30 text-blue-300 border-blue-700',
    Interviewing: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
    Rejected: 'bg-red-900/30 text-red-300 border-red-700',
    Offer: 'bg-green-900/30 text-green-300 border-green-700',
    Accepted: 'bg-emerald-900/30 text-emerald-300 border-emerald-700',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Job Application Tracker</h2>
          <p className="text-slate-400 text-sm mt-0.5">Keep track of your job applications and link them to your CVs.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
        >
          Add Application
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Application' : 'Add New Application'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={e => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Date Applied</label>
                <input
                  type="date"
                  required
                  value={formData.dateApplied}
                  onChange={e => setFormData(prev => ({ ...prev, dateApplied: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as JobApplication['status'] }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Offer">Offer</option>
                  <option value="Accepted">Accepted</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">CV Used</label>
              <input
                type="text"
                required
                value={formData.cvUsed}
                onChange={e => setFormData(prev => ({ ...prev, cvUsed: e.target.value }))}
                placeholder="e.g., CV for Software Engineer at Google"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                {editingId ? 'Update' : 'Add'} Application
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    jobTitle: '',
                    company: '',
                    dateApplied: new Date().toISOString().split('T')[0],
                    status: 'Applied',
                    cvUsed: '',
                    notes: '',
                  });
                }}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No applications yet</h3>
          <p className="text-slate-400 mb-4">Start tracking your job applications to stay organized.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
          >
            Add Your First Application
          </button>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">CV Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-700/50 transition">
                    <td className="px-4 py-3 text-sm text-white font-medium">{app.jobTitle}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{app.company}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{new Date(app.dateApplied).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{app.cvUsed}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(app)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}