interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
