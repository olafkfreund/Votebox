'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

interface Event {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  playlistSource: string;
  playlistConfig: {
    genres?: string[];
    excludeExplicit?: boolean;
    playlistIds?: string[];
  };
  votingRules: {
    votesPerHour?: number;
    cooldownMinutes?: number;
    maxQueueSize?: number;
  };
  recurrence: string;
  createdAt: string;
  updatedAt: string;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await apiClient.getEvent(eventId);
        setEvent(eventData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleActivate = async () => {
    if (!confirm('Are you sure you want to activate this event?')) return;

    setIsActivating(true);
    try {
      await apiClient.activateEvent(eventId);
      const updatedEvent = await apiClient.getEvent(eventId);
      setEvent(updatedEvent);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate event');
    } finally {
      setIsActivating(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this event? This cannot be undone.')) return;

    setIsEnding(true);
    try {
      await apiClient.endEvent(eventId);
      const updatedEvent = await apiClient.getEvent(eventId);
      setEvent(updatedEvent);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to end event');
    } finally {
      setIsEnding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

    try {
      await apiClient.deleteEvent(eventId);
      router.push('/events');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'SCHEDULED':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'ENDED':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl">⚠️</span>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{error || 'Event not found'}</p>
        <Link
          href="/events"
          className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/events"
            className="text-gray-400 hover:text-gray-500"
          >
            ← Back
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.name}</h1>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
            </div>
            {event.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{event.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {event.status === 'ACTIVE' && (
            <Link
              href={`/events/${event.id}/control`}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              Control Panel
            </Link>
          )}
          {(event.status === 'DRAFT' || event.status === 'SCHEDULED') && (
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {isActivating ? 'Activating...' : 'Activate Event'}
            </button>
          )}
          {event.status === 'ACTIVE' && (
            <button
              onClick={handleEnd}
              disabled={isEnding}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              {isEnding ? 'Ending...' : 'End Event'}
            </button>
          )}
          {event.status !== 'ACTIVE' && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Start</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(event.scheduledStart)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled End</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(event.scheduledEnd)}</p>
            </div>
            {event.actualStart && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actual Start</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(event.actualStart)}</p>
              </div>
            )}
            {event.actualEnd && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actual End</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(event.actualEnd)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recurrence</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.recurrence}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Music Configuration</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Playlist Source</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{event.playlistSource}</p>
            </div>
            {event.playlistConfig.genres && event.playlistConfig.genres.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Genres</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.playlistConfig.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/20 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Explicit Content</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {event.playlistConfig.excludeExplicit ? 'Excluded' : 'Allowed'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Voting Rules</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Votes Per Hour</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {event.votingRules.votesPerHour || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cooldown Period</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {event.votingRules.cooldownMinutes ? `${event.votingRules.cooldownMinutes} minutes` : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Maximum Queue Size</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {event.votingRules.maxQueueSize || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Event Links</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Guest Voting URL</p>
              <p className="mt-1 text-sm text-primary-600 dark:text-primary-400 font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/v/${event.id}` : 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Display URL</p>
              <p className="mt-1 text-sm text-primary-600 dark:text-primary-400 font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/display/${event.id}` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
