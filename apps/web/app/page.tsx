export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🎵 Votebox
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-8">
          Democratic Music Selection for Venues
        </p>
        <div className="text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">
            Scan the QR code at your venue to start voting for tracks
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="/demo"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Demo
            </a>
            <a
              href="https://github.com/olafkfreund/votebox"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
