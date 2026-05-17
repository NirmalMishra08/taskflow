import { Bell, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          className="text-surface-500 hover:text-brand-600 transition-colors lg:hidden p-1.5 rounded-lg hover:bg-surface-50"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="font-bold text-lg lg:hidden flex items-center gap-2 text-surface-900">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-700 font-extrabold">TaskFlow</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="sm" className="relative p-2 rounded-full hover:bg-surface-50 transition-colors">
          <Bell className="h-4.5 w-4.5 text-surface-600" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
          </span>
        </Button>
        
        <div className="h-8 w-px bg-surface-200" />

        <div className="flex items-center gap-3 pl-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-surface-900 tracking-tight">{user?.name}</span>
            <span className="text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full capitalize w-max ml-auto mt-0.5">{user?.role}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-brand-500/20 border border-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
