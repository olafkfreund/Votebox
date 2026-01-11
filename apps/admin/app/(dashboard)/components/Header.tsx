'use client';

import { useAuth } from '@/lib/auth-context';

export default function Header() {
  const { logout, venue } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Welcome back, {venue?.name}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={handleLogout}
          className="inline-flex items-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
