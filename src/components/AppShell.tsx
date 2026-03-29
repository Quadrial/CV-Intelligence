import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const navLinks = [
  { to: '/profile', label: 'Profile' },
  { to: '/generate', label: 'Generate CV' },
  { to: '/history', label: 'History' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ── Nav ── */}
      <nav className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo1.png" alt="CV Generator logo" className="w-40 h-40 rounded-lg object-contain" />
            
          </div>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-6">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-700 py-3 space-y-1">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <main className="px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
