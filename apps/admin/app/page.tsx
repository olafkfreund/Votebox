import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🎵 Votebox Admin
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Manage your venue's music voting events
          </p>
          <div className="flex gap-4 justify-center mt-12">
            <Link
              href="/login"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-lg"
            >
              Back to Main Site
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">📅 Event Management</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Create and manage themed music events for your venue
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">📊 Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Track voting patterns and popular tracks
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">🎮 Live Control</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Monitor and control events in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
