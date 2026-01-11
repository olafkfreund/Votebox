import { QueueItem } from '@votebox/types';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

interface QueueListProps {
  queue: QueueItem[];
}

export function QueueList({ queue }: QueueListProps) {
  if (queue.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Up Next
        </h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No tracks in queue
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Vote for tracks to add them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Up Next
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {queue.length} track{queue.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Position */}
            <div className="flex-shrink-0 w-6 text-center">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                {index + 1}
              </span>
            </div>

            {/* Album Art */}
            {item.trackData.album.images[0]?.url && (
              <div className="flex-shrink-0">
                <img
                  src={item.trackData.album.images[0].url}
                  alt={item.trackData.album.name}
                  className="w-12 h-12 rounded object-cover"
                />
              </div>
            )}

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {item.trackData.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {item.trackData.artists.map(a => a.name).join(', ')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {formatDuration(item.trackData.duration_ms)}
                </span>
                {item.trackData.explicit && (
                  <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    E
                  </span>
                )}
              </div>
            </div>

            {/* Vote Count */}
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1">
                <span className="text-lg">⬆️</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.voteCount}
                </span>
              </div>
              {item.lastVotedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatRelativeTime(new Date(item.lastVotedAt))}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
