# Getting Started with Votebox

Welcome to Votebox! This guide will get you up and running in minutes.

## 🎯 What is Votebox?

Votebox is a platform that lets pub and club guests vote on music from their phones. Venues create themed events (like "Doom Rock Night") and guests vote on tracks from curated playlists.

## ⚡ Quick Start (5 Minutes)

### Prerequisites

- Node.js 20+
- Docker Desktop
- Spotify account

### Setup Steps

```bash
# 1. Clone and install
git clone https://github.com/yourusername/votebox.git
cd votebox
npm install

# 2. Start database services
docker-compose up -d postgres redis

# 3. Set up database
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..

# 4. Start development servers
npm run dev
```

### Access the App

- **Guest Voting**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
  - Login: `owner@ravensclaw.com`
  - Password: `demo123`
- **API**: http://localhost:4000

## 📖 Understanding the Flow

### For Venues (Admin)

1. **Create Account** → Sign up as a venue
2. **Connect Spotify** → Link your Spotify Premium account (see below)
3. **Create Event** → Set up "Black Metal Night" for tomorrow
4. **Choose Music** → Select genre or specific playlist
5. **Generate QR Code** → Display at venue for guests
6. **Monitor Live** → Watch votes come in real-time

### Connecting Your Spotify Account

**Requirements:**
- ✓ Spotify Premium Account (required for playback control)
- ✓ Active Spotify App (desktop, mobile, or web player)
- ✓ Internet Connection

**Steps:**

1. **Navigate to Settings**
   - Log into Admin Dashboard at http://localhost:3001
   - Click on "Settings" in the sidebar
   - Select "Spotify" from the settings menu

2. **Connect Your Account**
   - Click the green "Connect Spotify Account" button
   - A popup window will open with Spotify's authorization page
   - Log into Spotify (if not already logged in)
   - Review the permissions Votebox is requesting
   - Click "Agree" to authorize Votebox

3. **Verify Connection**
   - The popup will close automatically
   - You'll see a ✅ Connected status with your account details
   - Your available Spotify devices will be listed

4. **Start Playing Music**
   - Open Spotify on your preferred device
   - Play any song to activate the device
   - Refresh the device list in Votebox
   - You're ready to create events!

**Troubleshooting:**
- **No devices showing?** Open Spotify and play a song on any device
- **Connection failed?** Verify you're using a Spotify Premium account
- **Need to reconnect?** Click the "Reconnect" button in Settings > Spotify

See [GitHub Issue #34](https://github.com/olafkfreund/Votebox/issues/34) for upcoming improvements to the Spotify setup experience.

### For Guests

1. **Scan QR Code** → Opens voting page instantly
2. **Browse Tracks** → See available songs for tonight
3. **Vote** → Click vote button on favorite tracks
4. **Watch Queue** → See what's playing next
5. **Keep Voting** → Influence the playlist all night

## 🏗️ Project Structure

```
votebox/
├── apps/
│   ├── web/          # Guest voting interface (Next.js PWA)
│   ├── admin/        # Venue admin dashboard (Next.js)
│   └── api/          # Backend API (NestJS)
├── packages/
│   ├── ui/           # Shared React components
│   ├── database/     # Prisma schema
│   └── types/        # TypeScript types
└── docs/             # Documentation
```

## 🎓 Key Concepts

### Events

Events are themed music sessions (e.g., "Doom Rock Night"). Each event has:

- Start/end time
- Playlist configuration (genre/playlist/custom)
- Voting rules (votes per hour, cooldowns)

### Voting

Guests can vote on tracks within an event's playlist. The queue is reordered based on:

- Vote count (most votes = higher priority)
- Recency (recent votes get bonus)
- Diversity (different artists get small boost)

### Queue

The queue shows upcoming tracks sorted by score. Tracks automatically play when current song ends via Spotify Web Playback SDK.

## 🔧 Common Tasks

### Create a New Event

```bash
curl -X POST http://localhost:4000/venues/:venueId/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Metal Night",
    "scheduledDate": "2026-01-20",
    "startTime": "2026-01-20T20:00:00Z",
    "endTime": "2026-01-21T02:00:00Z",
    "playlistSource": "GENRE",
    "playlistConfig": {
      "type": "genre",
      "genres": ["black-metal"],
      "filters": {
        "explicit": true
      }
    }
  }'
```

### Vote for a Track

```bash
curl -X POST http://localhost:4000/events/:eventId/votes \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "spotify:track:abc123",
    "sessionId": "guest-session-id"
  }'
```

### View Queue

```bash
curl http://localhost:4000/events/:eventId/queue
```

## 🎨 Customization

### Change Theme Colors

Edit `apps/web/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#8B0000', // Dark red for metal venues
        600: '#660000',
        700: '#4D0000'
      }
    }
  }
}
```

### Adjust Voting Rules

Modify event creation or update voting rules:

```typescript
{
  votingRules: {
    votesPerHour: 5,        // Allow 5 votes per hour
    voteCooldown: 20,       // 20 seconds between votes
    replayCooldown: 3600    // 1 hour before same song can be voted again
  }
}
```

## 📱 Testing on Mobile

### On Same Network

1. Find your local IP:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

2. Update `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_API_URL=http://YOUR_IP:4000
```

3. Visit on phone: `http://YOUR_IP:3000`

### Using ngrok (Public URL)

```bash
# Install ngrok
npm install -g ngrok

# Expose API
ngrok http 4000

# Expose Web
ngrok http 3000
```

## 🐛 Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

### API Won't Start

```bash
# Check if port 4000 is available
lsof -i :4000

# Or change port in apps/api/.env
PORT=4001
```

### Spotify Integration Not Working

**For Venue Owners:**

1. **Connection Failed**
   - Verify you have a Spotify Premium account (free accounts won't work)
   - Try disconnecting and reconnecting in Settings > Spotify
   - Ensure popup blocker isn't blocking the authorization window
   - Check your internet connection

2. **No Devices Found**
   - Open Spotify on any device (desktop, mobile, or web player)
   - Play any song to activate the device
   - Click "Refresh" in the Devices section
   - Wait a few seconds and refresh again if needed

3. **Connection Test Failed**
   - Click "Test Connection" in Settings > Spotify
   - If it fails, try reconnecting your account
   - Check that your Spotify Premium subscription is active
   - Verify you granted all requested permissions during authorization

**For Developers:**

1. Verify credentials in `apps/api/.env`:
   ```bash
   echo $SPOTIFY_CLIENT_ID
   echo $SPOTIFY_CLIENT_SECRET
   ```

2. Check redirect URI matches exactly in [Spotify Dashboard](https://developer.spotify.com/dashboard):
   - Development: `http://localhost:4000/api/v1/spotify/callback`
   - Production: `https://api.yourdomain.com/api/v1/spotify/callback`

3. Review API logs for detailed errors:
   ```bash
   docker-compose logs -f api | grep -i spotify
   ```

4. Test the OAuth flow manually:
   ```bash
   # Get auth URL
   curl http://localhost:4000/api/v1/spotify/auth-url/YOUR_VENUE_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 📚 Learn More

- **Full Setup Guide**: [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Documentation**: [API_DESIGN.md](./API_DESIGN.md)
- **Database Schema**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

## 🚀 Next Steps

1. ✅ Complete local setup
2. 🎵 Connect your Spotify account
3. 📅 Create your first event
4. 🎸 Test voting flow
5. 📊 Explore admin dashboard
6. 🛠️ Start building features!

## 💡 Feature Ideas

Want to contribute? Here are some feature ideas:

- **Social Features**: Share favorite tracks on social media
- **Rewards**: Badges for top voters
- **Themes**: Dark mode, custom venue themes
- **Analytics**: Advanced insights for venue owners
- **Mobile Apps**: Native iOS/Android apps
- **Integrations**: Connect with POS systems, loyalty programs

## 🤝 Getting Help

- **Documentation**: Read the docs in this repo
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions, share ideas
- **Discord**: Join our community (coming soon)

## 📄 License

MIT License - feel free to use for commercial projects!

---

**Happy Coding!** 🎉

Built with ❤️ by developers who love live music.
