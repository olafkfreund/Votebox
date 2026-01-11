import { SpotifyTrack } from '@votebox/types';
import { formatDuration, cn } from '@/lib/utils';

interface TrackCardProps {
  track: SpotifyTrack;
  onVote: () => void;
  canVote: boolean;
}

export function TrackCard({ track, onVote, canVote }: TrackCardProps) {
  const albumArt = track.album.images[0]?.url;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Album Art */}
      {albumArt && (
        <div className="flex-shrink-0">
          <img
            src={albumArt}
            alt={track.album.name}
            className="w-16 h-16 rounded object-cover"
          />
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">
          {track.name}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatDuration(track.duration_ms)}
          </span>
          {track.explicit && (
            <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              E
            </span>
          )}
        </div>
      </div>

      {/* Vote Button */}
      <div className="flex-shrink-0">
        <button
          onClick={onVote}
          disabled={!canVote}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm transition-all',
            canVote
              ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          )}
        >
          {canVote ? '⬆️ Vote' : '✓ Voted'}
        </button>
      </div>
    </div>
  );
}
