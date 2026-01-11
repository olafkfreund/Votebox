import { create } from 'zustand';
import { Event, QueueItem, SpotifyTrack } from '@votebox/types';
import { apiClient } from '../api-client';
import { connectSocket, disconnectSocket, getSocket } from '../socket';

interface EventState {
  // State
  event: Event | null;
  queue: QueueItem[];
  nowPlaying: SpotifyTrack | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // User session
  sessionId: string | null;
  votedTracks: Set<string>;
  lastVoteTime: number | null;

  // Actions
  loadEvent: (eventId: string) => Promise<void>;
  loadQueue: (eventId: string) => Promise<void>;
  voteForTrack: (eventId: string, trackId: string, trackData: SpotifyTrack) => Promise<void>;
  connectToEvent: (eventId: string) => void;
  disconnectFromEvent: () => void;
  setSessionId: (sessionId: string) => void;
  canVote: (trackId: string) => boolean;
  clearError: () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  // Initial state
  event: null,
  queue: [],
  nowPlaying: null,
  isConnected: false,
  isLoading: false,
  error: null,
  sessionId: null,
  votedTracks: new Set<string>(),
  lastVoteTime: null,

  // Load event details
  loadEvent: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      const event = await apiClient.get<Event>(`/events/${eventId}`);
      set({ event, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load event',
        isLoading: false
      });
    }
  },

  // Load queue
  loadQueue: async (eventId: string) => {
    try {
      const queue = await apiClient.get<QueueItem[]>(`/events/${eventId}/queue`);
      set({ queue });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to load queue' });
    }
  },

  // Vote for a track
  voteForTrack: async (eventId: string, trackId: string, trackData: SpotifyTrack) => {
    const { sessionId, canVote } = get();

    if (!sessionId) {
      set({ error: 'Session not initialized' });
      return;
    }

    if (!canVote(trackId)) {
      set({ error: 'Please wait before voting again' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await apiClient.post(`/events/${eventId}/queue`, {
        trackId: trackData.id,
        trackUri: trackData.uri,
        trackName: trackData.name,
        artistName: trackData.artists.map(a => a.name).join(', '),
        albumName: trackData.album.name,
        albumArt: trackData.album.images[0]?.url || null,
        duration: Math.floor(trackData.duration_ms / 1000),
        addedBy: sessionId,
      });

      // Add to voted tracks
      const votedTracks = new Set(get().votedTracks);
      votedTracks.add(trackId);

      set({
        votedTracks,
        lastVoteTime: Date.now(),
        isLoading: false
      });

      // Reload queue to show updated positions
      await get().loadQueue(eventId);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to vote',
        isLoading: false
      });
    }
  },

  // Connect to WebSocket for real-time updates
  connectToEvent: (eventId: string) => {
    const socket = connectSocket();

    socket.emit('joinEvent', { eventId });

    socket.on('queueUpdate', (data: { eventId: string; queue: QueueItem[] }) => {
      if (data.eventId === eventId) {
        set({ queue: data.queue });
      }
    });

    socket.on('nowPlayingUpdate', (data: { eventId: string; track: SpotifyTrack | null }) => {
      if (data.eventId === eventId) {
        set({ nowPlaying: data.track });
      }
    });

    socket.on('eventStatusChange', (data: { eventId: string; status: any }) => {
      if (data.eventId === eventId) {
        const currentEvent = get().event;
        if (currentEvent) {
          set({ event: { ...currentEvent, status: data.status } });
        }
      }
    });

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    set({ isConnected: socket.connected });
  },

  // Disconnect from WebSocket
  disconnectFromEvent: () => {
    const { event } = get();
    if (event) {
      const socket = getSocket();
      socket.emit('leaveEvent', { eventId: event.id });
    }
    disconnectSocket();
    set({ isConnected: false });
  },

  // Set session ID
  setSessionId: (sessionId: string) => {
    set({ sessionId });
  },

  // Check if user can vote
  canVote: (trackId: string) => {
    const { lastVoteTime, votedTracks } = get();

    // Vote cooldown: 30 seconds
    const VOTE_COOLDOWN = 30 * 1000;

    if (lastVoteTime && Date.now() - lastVoteTime < VOTE_COOLDOWN) {
      return false;
    }

    // Can't vote for the same track again in this session
    if (votedTracks.has(trackId)) {
      return false;
    }

    return true;
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
