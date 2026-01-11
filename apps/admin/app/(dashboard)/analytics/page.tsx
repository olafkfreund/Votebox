'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import apiClient, { Event } from '@/lib/api-client';

export default function AnalyticsPage() {
  const { venue } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  useEffect(() => {
    const fetchEvents = async () => {
      if (!venue?.id) return;

      try {
        const eventsData = await apiClient.getEvents(venue.id);
        setEvents(eventsData.filter((e: Event) => e.status === 'ENDED' || e.status === 'ACTIVE'));
        if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [venue?.id]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const calculateEventDuration = (event: Event) => {
    if (!event.actualStart) return 'N/A';
    const start = new Date(event.actualStart);
    const end = event.actualEnd ? new Date(event.actualEnd) : new Date();
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your venue performance and engagement
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
          <span className="text-4xl">📊</span>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No analytics data available yet. Complete your first event to see analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track your venue performance and engagement
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="mb-4">
          <label
            htmlFor="event-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Select Event
          </label>
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} - {event.status}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Duration
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {calculateEventDuration(selectedEvent)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Votes
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🎵</span>
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Tracks Played
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Active Guests
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Popular Tracks</h3>
        </div>
        <div className="px-6 py-5">
          <div className="text-center py-12">
            <span className="text-4xl">🎵</span>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Track analytics coming soon
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Voting Patterns</h3>
        </div>
        <div className="px-6 py-5">
          <div className="text-center py-12">
            <span className="text-4xl">📊</span>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Voting pattern analytics coming soon
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Analytics Features Coming Soon
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>We're working on comprehensive analytics including:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Real-time voting statistics</li>
                <li>Guest engagement metrics</li>
                <li>Popular tracks and genres</li>
                <li>Peak voting times</li>
                <li>Historical event comparisons</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
