import { SpotifyTrack } from '@votebox/types';
import { formatDuration } from '@/lib/utils';

interface NowPlayingProps {
  track: SpotifyTrack | null;
}

export function NowPlaying({ track }: NowPlayingProps) {
  if (!track) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Now Playing
        </h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎵</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No track playing
          </p>
        </div>
      </div>
    );
  }

  const albumArt = track.album.images[0]?.url;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
        Now Playing
      </h2>

      <div className="space-y-3">
        {/* Album Art */}
        {albumArt && (
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={albumArt}
              alt={track.album.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Track Info */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
            {track.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {track.artists.map(a => a.name).join(', ')}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
            {track.album.name}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDuration(track.duration_ms)}</span>
          {track.explicit && (
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
              E
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
