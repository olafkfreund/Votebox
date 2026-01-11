'use client';

import { useState, useEffect } from 'react';
import { SpotifyTrack } from '@votebox/types';
import { apiClient } from '@/lib/api-client';
import { debounce } from '@/lib/utils';
import { TrackCard } from './TrackCard';
import { LoadingSpinner } from './LoadingSpinner';

interface TrackBrowserProps {
  eventId: string;
  onVote: (track: SpotifyTrack) => void;
  canVote: (trackId: string) => boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TrackBrowser({
  eventId: _eventId,
  onVote,
  canVote,
  searchQuery,
  onSearchChange,
}: TrackBrowserProps) {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const searchTracks = debounce(async (query: string) => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ tracks: { items: SpotifyTrack[] } }>(
        `/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=20`
      );
      setTracks(response.tracks.items);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search tracks');
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  // Effect to trigger search when query changes
  useEffect(() => {
    searchTracks(searchQuery);
  }, [searchQuery]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Search Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          Search Tracks
        </h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for tracks, artists, or albums..."
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && tracks.length === 0 && searchQuery.trim() && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-500 dark:text-gray-400">No tracks found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Try a different search term
          </p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !error && tracks.length === 0 && !searchQuery.trim() && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">🎵</div>
          <p className="text-gray-500 dark:text-gray-400">Search for tracks to vote</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Type in the search box above to get started
          </p>
        </div>
      )}

      {/* Track Results */}
      {!isLoading && !error && tracks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onVote={() => onVote(track)}
              canVote={canVote(track.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
