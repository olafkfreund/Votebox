'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

interface QueueItem {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumArt: string;
  voteCount: number;
  position: number;
}

interface PlaybackStatus {
  eventId: string;
  initialized: boolean;
  isPlaying: boolean;
  autoPlayEnabled: boolean;
  deviceId?: string | null;
  currentTrack?: {
    trackId: string;
    trackName: string;
    artistName: string;
    albumArt: string;
    duration: number;
    progress?: number;
    elapsed?: number;
    remaining?: number;
  } | null;
  queueSize?: number;
}

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export default function EventControlPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus | null>(null);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const queueData = await apiClient.getQueue(eventId);
      setQueue(queueData);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  const fetchPlaybackStatus = async () => {
    try {
      const status = await apiClient.getPlaybackStatus(eventId);
      setPlaybackStatus(status);
    } catch (error) {
      console.error('Failed to fetch playback status:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      // This would need the venueId - assuming we can get it from the event
      // For now, we'll skip device fetching or implement it properly with venue context
      setDevices([]);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchQueue(), fetchPlaybackStatus(), fetchDevices()]);
      setIsLoading(false);
    };

    loadData();

    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchQueue();
      fetchPlaybackStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  const handleInitialize = async () => {
    if (!selectedDeviceId) {
      alert('Please select a Spotify device');
      return;
    }

    try {
      await apiClient.initializePlayback(eventId, selectedDeviceId);
      await fetchPlaybackStatus();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to initialize playback');
    }
  };

  const handlePlayNext = async () => {
    try {
      await apiClient.playNext(eventId);
      await Promise.all([fetchQueue(), fetchPlaybackStatus()]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to play next track');
    }
  };

  const handlePause = async () => {
    try {
      await apiClient.pause(eventId);
      await fetchPlaybackStatus();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      await apiClient.resume(eventId);
      await fetchPlaybackStatus();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to resume');
    }
  };

  const handleSkip = async () => {
    try {
      await apiClient.skip(eventId);
      await Promise.all([fetchQueue(), fetchPlaybackStatus()]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to skip track');
    }
  };

  const handleRemoveFromQueue = async (trackId: string) => {
    if (!confirm('Remove this track from the queue?')) return;

    try {
      await apiClient.removeFromQueue(eventId, trackId);
      await fetchQueue();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove track');
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/events/${eventId}`} className="text-gray-400 hover:text-gray-500">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Event Control Panel
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage live playback and queue
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      {!playbackStatus?.initialized && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-4">
            Initialize Playback
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                Select Spotify Device
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select a device...</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.type})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleInitialize}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Initialize Playback
            </button>
          </div>
        </div>
      )}

      {playbackStatus?.initialized && (
        <>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Now Playing
              </h3>
              {playbackStatus.currentTrack ? (
                <div className="flex items-center space-x-4">
                  <img
                    src={playbackStatus.currentTrack.albumArt}
                    alt={playbackStatus.currentTrack.trackName}
                    className="h-24 w-24 rounded-lg shadow"
                  />
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {playbackStatus.currentTrack.trackName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {playbackStatus.currentTrack.artistName}
                    </p>
                    {playbackStatus.currentTrack.duration && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>
                            {playbackStatus.currentTrack.elapsed
                              ? formatDuration(playbackStatus.currentTrack.elapsed)
                              : '0:00'}
                          </span>
                          <span>{formatDuration(playbackStatus.currentTrack.duration)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{
                              width: `${
                                playbackStatus.currentTrack.progress
                                  ? (playbackStatus.currentTrack.progress /
                                      playbackStatus.currentTrack.duration) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No track currently playing
                </p>
              )}

              <div className="mt-6 flex items-center justify-center space-x-4">
                {playbackStatus.isPlaying ? (
                  <button
                    onClick={handlePause}
                    className="inline-flex items-center rounded-full bg-white dark:bg-gray-700 p-3 text-gray-700 dark:text-gray-300 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <span className="text-2xl">⏸️</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="inline-flex items-center rounded-full bg-primary-600 p-3 text-white shadow-md hover:bg-primary-700"
                  >
                    <span className="text-2xl">▶️</span>
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className="inline-flex items-center rounded-full bg-white dark:bg-gray-700 p-3 text-gray-700 dark:text-gray-300 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <span className="text-2xl">⏭️</span>
                </button>
                <button
                  onClick={handlePlayNext}
                  className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  Play Next in Queue
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Queue ({queue.length} tracks)
                </h3>
              </div>
            </div>
            {queue.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="text-4xl">🎵</span>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  No tracks in queue yet. Guests can start voting!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {queue.map((item, index) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 font-medium w-8">
                      #{index + 1}
                    </div>
                    <img
                      src={item.albumArt}
                      alt={item.trackName}
                      className="h-12 w-12 rounded shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.trackName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.artistName}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-800 dark:text-primary-300">
                        {item.voteCount} votes
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromQueue(item.trackId)}
                      className="flex-shrink-0 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
