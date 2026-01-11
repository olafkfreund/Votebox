# Votebox 🎵

**Democratic Music Selection for Venues**

Votebox is a cloud-native platform that enables pub and club guests to democratically vote on music from their phones. Venues can create themed events (e.g., "Doom Rock Night", "Black Metal Evening") and guests vote on tracks from curated playlists or genres.

## 🎯 Vision

Transform the music experience in venues by:
- Giving guests a voice in music selection
- Maintaining venue control over atmosphere and theme
- Creating engagement and interaction
- Providing insights into customer preferences

## ✨ Key Features

### For Venues
- **Event Management**: Schedule themed music nights with specific genres/playlists
- **Smart Queue System**: Weighted voting algorithm for track selection
- **Admin Dashboard**: Real-time monitoring and control
- **Analytics**: Understand what your crowd loves
- **Content Moderation**: Skip tracks, set filters, control the vibe

### For Guests
- **Easy Access**: QR code → instant voting (no app install)
- **Real-time Updates**: See what's playing and what's coming next
- **Vote Power**: Influence the playlist within event boundaries
- **Discovery**: Find new artists in your favorite genres

### For Display Screens
- **Now Playing**: Beautiful display of current track
- **Queue Visualization**: Upcoming songs with vote counts
- **Engagement Stats**: Top voters, popular tracks

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Guest     │────▶│   Backend    │────▶│   Spotify   │
│   PWA       │◀────│   API        │◀────│     API     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │  Admin   │  │ Display  │
              │Dashboard │  │  Screen  │
              └──────────┘  └──────────┘
```

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, PWA
- **Backend**: Node.js, NestJS, TypeScript
- **Real-time**: Socket.io for live updates
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and queue caching
- **Auth**: NextAuth.js for venue authentication
- **API**: Spotify Web API + Web Playback SDK
- **Infrastructure**: Docker, Kubernetes (optional), GitHub Actions
- **Monitoring**: Prometheus, Grafana

## 📋 Prerequisites

- Node.js 20.x or later
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+
- Spotify Premium account
- Spotify Developer account (for API credentials)

## 🛠️ Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/votebox.git
cd votebox

# Install dependencies
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your Spotify credentials

# Start development environment
docker-compose up -d

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

Visit:
- Guest App: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Display Screen: http://localhost:3000/display
- API: http://localhost:4000

## 📚 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Development phases and timeline
- [Architecture](./ARCHITECTURE.md) - System design and components
- [Tech Stack](./TECH_STACK.md) - Technology choices and rationale
- [Database Schema](./DATABASE_SCHEMA.md) - Data model and relationships
- [API Design](./API_DESIGN.md) - REST endpoints and WebSocket events
- [Development Setup](./DEVELOPMENT_SETUP.md) - Local development guide
- [Deployment](./DEPLOYMENT.md) - Production deployment strategies
- [Claude Instructions](./CLAUDE.md) - AI assistant context

## 🗓️ Development Roadmap

### Phase 1: MVP (Weeks 1-4)
- Basic event management
- Spotify integration
- Voting system
- Simple queue algorithm
- Guest PWA

### Phase 2: Enhancement (Weeks 5-8)
- Admin dashboard
- Display screen
- Advanced queue algorithms
- Analytics basics
- Multi-venue support

### Phase 3: Production (Weeks 9-12)
- Payment integration
- Advanced analytics
- Performance optimization
- Security hardening
- Monitoring and logging

### Phase 4: Scale (Post-MVP)
- Mobile apps (React Native)
- Advanced features (rewards, gamification)
- API for third-party integrations
- White-label options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spotify for their excellent API
- The open-source community
- All the venues and music lovers who inspired this project

## 📧 Contact

- Project Lead: Olaf Kfreund
- Email: [your-email]
- Website: [your-website]

---

Built with ❤️ by developers who love live music
