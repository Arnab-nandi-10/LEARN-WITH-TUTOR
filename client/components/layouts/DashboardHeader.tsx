'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/lib/stores/authStore';
import { toast } from 'sonner';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="h-16 bg-bg-secondary border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
      
      <div className="flex-1 lg:flex-none">
        <h1 className="text-lg font-display font-semibold text-text-primary">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 text-text-secondary hover:text-text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
          
          <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-text-secondary hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
