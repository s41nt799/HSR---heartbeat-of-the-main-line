import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-indigo-500/20 text-indigo-300'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
  }`;

export function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/scenarios" className="text-base font-semibold text-slate-100">
            Тренажёр проводника
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/scenarios" className={linkClass}>
              Сценарии
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Профиль
            </NavLink>
            <NavLink to="/leaderboard" className={linkClass}>
              Лидерборд
            </NavLink>
            <button type="button" className="btn-ghost text-sm" onClick={logout}>
              Выйти
              {user?.display_name ? ` (${user.display_name})` : ''}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
