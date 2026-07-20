import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function ResponsiveLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 h-full w-64 shrink-0 bg-brand-dark text-white transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-lg font-semibold">SIMS</span>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4 text-sm">
          <a href="#" className="rounded-md px-3 py-2 hover:bg-white/10">Dashboard</a>
          <a href="#" className="rounded-md px-3 py-2 hover:bg-white/10">Interns</a>
          <a href="#" className="rounded-md px-3 py-2 hover:bg-white/10">Reports</a>
          <a href="#" className="rounded-md px-3 py-2 hover:bg-white/10">Settings</a>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="lg:hidden text-brand">
            <Menu size={22} />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-brand-dark">Admin Overview</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
