'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEventStore } from '@/lib/stores/event-store';
import { getOrCreateSessionId } from '@/lib/session';
import { SpotifyTrack } from '@votebox/types';
import { NowPlaying } from '@/components/NowPlaying';
import { QueueList } from '@/components/QueueList';
import { TrackBrowser } from '@/components/TrackBrowser';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function EventVotingPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const {
    event,
    queue,
    nowPlaying,
    isConnected,
    isLoading,
    error,
    remainingVotes,
    loadEvent,
    loadQueue,
    voteForTrack,
    loadRemainingVotes,
    connectToEvent,
    disconnectFromEvent,
    setSessionId,
    canVote,
    clearError,
  } = useEventStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Initialize session and load event data
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    setSessionId(sessionId);

    loadEvent(eventId);
    loadQueue(eventId);
    loadRemainingVotes(eventId);
    connectToEvent(eventId);

    return () => {
      disconnectFromEvent();
    };
  }, [eventId]);

  const handleVote = async (track: SpotifyTrack) => {
    if (!canVote(track.id)) {
      return;
    }

    await voteForTrack(eventId, track.id, track);
  };

  if (isLoading && !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">This event doesn't exist or has ended</p>
        </div>
      </div>
    );
  }

  if (event.status !== 'ACTIVE') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Event Not Active
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This event is currently {event.status.toLowerCase()}
          </p>
          {event.status === 'UPCOMING' && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Check back when the event starts!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">🎵 {event.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vote for tracks you want to hear
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {remainingVotes}/3 votes
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">remaining this hour</div>
              </div>
              <ConnectionStatus isConnected={isConnected} />
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Now Playing & Queue */}
          <div className="lg:col-span-1 space-y-6">
            <NowPlaying track={nowPlaying} />
            <QueueList queue={queue} />
          </div>

          {/* Right Column: Track Browser */}
          <div className="lg:col-span-2">
            <TrackBrowser
              eventId={eventId}
              onVote={handleVote}
              canVote={canVote}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
