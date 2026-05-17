
import { NavLink } from 'react-router-dom';
import { CheckSquare, LayoutDashboard, Users, LogOut, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  ];

  // Only add Users page if user is an admin
  if (user?.role === 'admin') {
    navItems.push({ name: 'Users', href: '/users', icon: Users });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-surface-950/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-800 bg-surface-900 text-surface-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-surface-800">
          <div className="flex items-center gap-3 font-bold text-xl text-white tracking-wide">
            
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-surface-200 font-extrabold">TaskFlow</span>
            <span className="text-[9px] font-bold bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-brand-500/30 ml-1">Pro</span>
          </div>
          <button className="lg:hidden text-surface-400 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-brand-600/15 text-brand-400 border-l-2 border-brand-500 pl-3"
                      : "text-surface-400 hover:bg-surface-800/60 hover:text-white"
                  )
                }
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User context footer */}
        <div className="p-4 border-t border-surface-800 bg-surface-950/40">
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-surface-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full text-left"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
