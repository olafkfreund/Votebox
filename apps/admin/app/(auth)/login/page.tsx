import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to your venue
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Manage your Votebox events and analytics
          </p>
        </div>

        <LoginForm />

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500">
                Demo Credentials
              </span>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>Email: demo@votebox.com</p>
            <p>Password: DemoVenue123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
