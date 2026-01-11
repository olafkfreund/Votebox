import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        )}
      />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {isConnected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );
}
