'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import apiClient from '@/lib/api-client';

type PlaylistSource = 'GENRE' | 'SPOTIFY_PLAYLIST' | 'CUSTOM';
type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export default function NewEventPage() {
  const router = useRouter();
  const { venue } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
    playlistSource: 'GENRE' as PlaylistSource,
    genres: [] as string[],
    playlistIds: [] as string[],
    excludeExplicit: false,
    votesPerHour: 3,
    cooldownMinutes: 20,
    maxQueueSize: 50,
    recurrence: 'NONE' as Recurrence,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const eventData = {
        venueId: venue!.id,
        name: formData.name,
        description: formData.description,
        scheduledStart: formData.scheduledStart ? new Date(formData.scheduledStart).toISOString() : null,
        scheduledEnd: formData.scheduledEnd ? new Date(formData.scheduledEnd).toISOString() : null,
        playlistSource: formData.playlistSource,
        playlistConfig: {
          genres: formData.genres,
          playlistIds: formData.playlistIds,
          excludeExplicit: formData.excludeExplicit,
        },
        votingRules: {
          votesPerHour: formData.votesPerHour,
          cooldownMinutes: formData.cooldownMinutes,
          maxQueueSize: formData.maxQueueSize,
        },
        recurrence: formData.recurrence,
      };

      const event = await apiClient.createEvent(eventData);
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreAdd = (genre: string) => {
    if (genre && !formData.genres.includes(genre)) {
      setFormData({ ...formData, genres: [...formData.genres, genre] });
    }
  };

  const handleGenreRemove = (genre: string) => {
    setFormData({ ...formData, genres: formData.genres.filter((g) => g !== genre) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set up a new music voting event for your venue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Basic Information
            </h3>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Friday Night Rock"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="scheduledStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduledStart"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="scheduledEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduledEnd"
                  value={formData.scheduledEnd}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recurrence
              </label>
              <select
                id="recurrence"
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as Recurrence })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="NONE">None</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Music Selection
            </h3>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div>
              <label htmlFor="playlistSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Playlist Source *
              </label>
              <select
                id="playlistSource"
                required
                value={formData.playlistSource}
                onChange={(e) => setFormData({ ...formData, playlistSource: e.target.value as PlaylistSource })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="GENRE">By Genre</option>
                <option value="SPOTIFY_PLAYLIST">Spotify Playlist</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            {formData.playlistSource === 'GENRE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Genres
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-100 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-800 dark:text-primary-300"
                    >
                      {genre}
                      <button
                        type="button"
                        onClick={() => handleGenreRemove(genre)}
                        className="hover:text-primary-900 dark:hover:text-primary-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    id="genreInput"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter genre (e.g., rock, pop, jazz)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleGenreAdd(input.value.trim());
                        input.value = '';
                      }
                    }}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Press Enter to add a genre
                </p>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="excludeExplicit"
                checked={formData.excludeExplicit}
                onChange={(e) => setFormData({ ...formData, excludeExplicit: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="excludeExplicit" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Exclude explicit content
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Voting Rules
            </h3>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div>
              <label htmlFor="votesPerHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Votes Per Hour
              </label>
              <input
                type="number"
                id="votesPerHour"
                min="1"
                max="10"
                value={formData.votesPerHour}
                onChange={(e) => setFormData({ ...formData, votesPerHour: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Maximum number of votes a guest can cast per hour
              </p>
            </div>

            <div>
              <label htmlFor="cooldownMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cooldown (minutes)
              </label>
              <input
                type="number"
                id="cooldownMinutes"
                min="0"
                max="60"
                value={formData.cooldownMinutes}
                onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Time between votes for the same guest
              </p>
            </div>

            <div>
              <label htmlFor="maxQueueSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maximum Queue Size
              </label>
              <input
                type="number"
                id="maxQueueSize"
                min="10"
                max="100"
                value={formData.maxQueueSize}
                onChange={(e) => setFormData({ ...formData, maxQueueSize: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Maximum number of tracks in the queue
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
