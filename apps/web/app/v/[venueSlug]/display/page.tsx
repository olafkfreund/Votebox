'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useEventStore } from '@/lib/stores/event-store';
import { formatDuration } from '@/lib/utils';
import { QueueItem } from '@votebox/types';

export default function DisplayScreenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const venueSlug = params.venueSlug as string;

  // Get eventId from query params
  const eventId = searchParams.get('eventId');

  const {
    event,
    queue,
    nowPlaying,
    isConnected,
    loadEvent,
    loadQueue,
    connectToEvent,
    disconnectFromEvent,
  } = useEventStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize and connect
  useEffect(() => {
    if (!eventId) return;

    loadEvent(eventId);
    loadQueue(eventId);
    connectToEvent(eventId);

    return () => {
      disconnectFromEvent();
    };
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-2">No Event Selected</h1>
          <p className="text-gray-400">
            Please select an event from the venue dashboard
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  const topTracks = queue.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <header className="p-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-1">🎵 {event.name}</h1>
            <p className="text-xl text-gray-300">
              Vote from your phone • Scan QR code below
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-300">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Now Playing */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold mb-6">Now Playing</h2>

            {nowPlaying ? (
              <div className="space-y-6">
                {/* Album Art */}
                {nowPlaying.album.images[0]?.url && (
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <img
                      src={nowPlaying.album.images[0].url}
                      alt={nowPlaying.album.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Track Info */}
                <div>
                  <h3 className="text-3xl font-bold mb-2">{nowPlaying.name}</h3>
                  <p className="text-xl text-gray-300">
                    {nowPlaying.artists.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-lg text-gray-400 mt-1">
                    {nowPlaying.album.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDuration(nowPlaying.duration_ms)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-2xl text-gray-300">No track playing</p>
              </div>
            )}
          </div>

          {/* Queue */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Up Next</h2>
              <span className="text-lg text-gray-300">
                {queue.length} track{queue.length !== 1 ? 's' : ''}
              </span>
            </div>

            {topTracks.length > 0 ? (
              <div className="space-y-4">
                {topTracks.map((item: QueueItem, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    {/* Position */}
                    <div className="text-3xl font-bold text-gray-400 w-12 text-center">
                      {index + 1}
                    </div>

                    {/* Album Art */}
                    {item.trackData.album.images[0]?.url && (
                      <img
                        src={item.trackData.album.images[0].url}
                        alt={item.trackData.album.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-semibold truncate">
                        {item.trackData.name}
                      </h4>
                      <p className="text-lg text-gray-300 truncate">
                        {item.trackData.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>

                    {/* Votes */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">⬆️</span>
                        <span className="text-2xl font-bold">{item.voteCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-2xl text-gray-300">No tracks in queue</p>
                <p className="text-lg text-gray-400 mt-2">
                  Guests can vote from their phones
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="max-w-7xl mx-auto mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Scan to Vote
            </h2>
            <div className="inline-block p-4 bg-white rounded-xl">
              {/* QR Code placeholder - will be generated dynamically */}
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                QR Code
                <br />
                {venueSlug}/event/{eventId}
              </div>
            </div>
            <p className="text-xl text-gray-300 mt-4">
              Open your camera and scan to start voting
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
