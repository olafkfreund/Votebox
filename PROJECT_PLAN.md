# Votebox Project Plan

## 📊 Project Overview

**Project Name**: Votebox  
**Duration**: 12 weeks (MVP), 6 months (Production-ready)  
**Team Size**: 1-2 developers (initial), scaling as needed  
**Budget**: £5,000-10,000 (cloud infrastructure first year)

## 🎯 Project Goals

1. **Primary**: Create a working MVP that venues can use for music voting
2. **Secondary**: Build a scalable SaaS platform for multiple venues
3. **Tertiary**: Generate revenue through subscription or per-event licensing

## 📅 Development Phases

### Phase 1: Foundation & MVP (Weeks 1-4)

**Objective**: Build a minimal working product for single-venue testing

#### Week 1: Project Setup & Infrastructure

**Deliverables**:

- ✅ Repository setup with monorepo structure
- ✅ Docker Compose development environment
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Database schema design
- ✅ Spotify Developer account setup
- ✅ Basic authentication setup

**Tasks**:

```bash
# Day 1-2: Project scaffolding
- Initialize monorepo (Turborepo/Nx)
- Set up frontend (Next.js)
- Set up backend (NestJS)
- Configure TypeScript, ESLint, Prettier

# Day 3-4: Infrastructure
- Docker Compose configuration
- PostgreSQL setup with Prisma
- Redis setup
- Environment variable management

# Day 5-7: Foundation
- Database migrations
- Basic API structure
- Health check endpoints
- Spotify OAuth integration
- GitHub Actions workflow
```

#### Week 2: Core Backend Services

**Deliverables**:

- ✅ Venue management API
- ✅ Event CRUD operations
- ✅ Spotify integration service
- ✅ Basic queue management

**Tasks**:

```typescript
// Services to implement
1. VenueService
   - Create/read/update venues
   - Spotify account linking

2. EventService
   - Create events with playlist config
   - Activate/deactivate events
   - Load tracks from Spotify

3. SpotifyService
   - OAuth flow
   - Search tracks/playlists
   - Get recommendations by genre
   - Playback control

4. QueueService
   - Add tracks to queue
   - Sort by votes
   - Handle playback queue
```

#### Week 3: Guest Voting Interface

**Deliverables**:

- ✅ Guest PWA (mobile-first)
- ✅ QR code landing page
- ✅ Track browsing and search
- ✅ Voting mechanism
- ✅ Real-time updates (Socket.io)

**Pages**:

```
/                          # Landing page
/v/:venueId/event/:eventId # Active event voting page
/v/:venueId/display        # Display screen
```

**Components**:

- NowPlaying card
- UpcomingQueue list
- TrackBrowser with search
- VoteButton with cooldown
- ConnectionStatus indicator

#### Week 4: Queue Algorithm & Testing

**Deliverables**:

- ✅ Weighted voting algorithm
- ✅ Anti-spam measures
- ✅ Playback automation
- ✅ Basic admin controls
- ✅ End-to-end testing

**Algorithm Features**:

```javascript
// Queue scoring system
score = (
  votes * 1.0 +
  recency_factor * 0.3 +
  diversity_bonus * 0.2 -
  recently_played_penalty * 0.5
)

// Anti-spam measures
- Rate limiting: 3 votes per user per hour
- IP tracking
- Session fingerprinting
- Vote cooldown: 30 seconds between votes
- Same song cooldown: 2 hours
```

### Phase 2: Enhancement & Polish (Weeks 5-8)

**Objective**: Add professional features and prepare for multi-venue deployment

#### Week 5: Admin Dashboard

**Deliverables**:

- ✅ Venue admin authentication
- ✅ Event management UI
- ✅ Real-time monitoring dashboard
- ✅ Manual queue controls

**Dashboard Pages**:

```
/admin/login               # Venue login
/admin/dashboard           # Overview
/admin/events              # Event calendar
/admin/events/new          # Create event
/admin/events/:id          # Event details
/admin/events/:id/live     # Live control during event
/admin/settings            # Venue settings
/admin/analytics           # Basic analytics
```

**Key Features**:

- Event scheduler with recurring events
- Genre/playlist selection interface
- Live queue monitoring
- Skip track / emergency stop
- Vote activity monitoring

#### Week 6: Display Screen & Branding

**Deliverables**:

- ✅ TV-optimized display interface
- ✅ Customizable themes
- ✅ Venue branding options
- ✅ Animations and transitions

**Display Features**:

- Full-screen now playing with album art
- Animated queue carousel
- Vote activity visualization
- Venue logo/branding
- QR code for easy access

#### Week 7: Advanced Features

**Deliverables**:

- ✅ Genre-based track loading
- ✅ Track caching system
- ✅ Advanced filtering
- ✅ Content moderation tools

**Implementations**:

```typescript
// Genre Configuration System
interface GenreConfig {
  id: string;
  displayName: string;
  seedGenres: string[];
  seedArtists: string[];
  fallbackPlaylists: string[];
  filters: {
    energy?: [number, number];
    tempo?: [number, number];
    valence?: [number, number];
    minDuration?: number;
    maxDuration?: number;
    minPopularity?: number;
    explicitAllowed?: boolean;
  };
}

// Track Loading Strategies
1. Genre-based: Use Spotify recommendations API
2. Playlist-based: Fetch tracks from playlist
3. Artist-based: Get similar artists' top tracks
4. Hybrid: Combine multiple sources
```

#### Week 8: Testing & Bug Fixes

**Deliverables**:

- ✅ Comprehensive test suite
- ✅ Performance testing
- ✅ Security audit
- ✅ Bug fixes
- ✅ Documentation

**Testing Strategy**:

- Unit tests: 80% coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows
- Load testing: 100 concurrent voters
- Security testing: OWASP Top 10

### Phase 3: Production Ready (Weeks 9-12)

**Objective**: Deploy to production and onboard first customers

#### Week 9: Multi-Tenant Architecture

**Deliverables**:

- ✅ Multi-venue support
- ✅ Tenant isolation
- ✅ Subscription management
- ✅ Usage tracking

**Changes**:

- Tenant-aware database queries
- Venue-specific customization
- Resource quotas per tier
- Billing integration prep

#### Week 10: Analytics & Insights

**Deliverables**:

- ✅ Track analytics
- ✅ Venue insights dashboard
- ✅ Export capabilities
- ✅ Popular tracks/artists reports

**Metrics to Track**:

- Total votes per event
- Most popular tracks/genres
- Peak voting times
- User engagement rates
- Device types
- Geographic distribution

#### Week 11: Payment & Subscriptions

**Deliverables**:

- ✅ Stripe integration
- ✅ Subscription tiers
- ✅ Trial period management
- ✅ Invoicing

**Pricing Tiers**:

```yaml
Free Tier:
  - 1 venue
  - 2 events/month
  - 50 votes/event
  - Basic support
  - Votebox branding

Starter: £29/month
  - 1 venue
  - Unlimited events
  - 500 votes/event
  - Email support
  - Custom branding

Pro: £79/month
  - 1 venue
  - Unlimited everything
  - Priority support
  - Advanced analytics
  - White label option

Enterprise: Custom
  - Multiple venues
  - Dedicated support
  - SLA guarantees
  - Custom features
```

#### Week 12: Launch Preparation

**Deliverables**:

- ✅ Production infrastructure
- ✅ Monitoring and alerting
- ✅ Backup and disaster recovery
- ✅ Documentation
- ✅ Marketing website
- ✅ Onboarding flow

**Infrastructure**:

```yaml
Production Stack:
  - Cloud: AWS/Azure/GCP
  - Container Orchestration: Kubernetes (optional) or Docker Swarm
  - Database: Managed PostgreSQL (RDS/Azure Database)
  - Cache: Managed Redis (ElastiCache/Azure Cache)
  - CDN: CloudFlare
  - Monitoring: Prometheus + Grafana
  - Logging: ELK Stack or Loki
  - Uptime: StatusPage.io
```

### Phase 4: Post-Launch (Weeks 13+)

#### Month 4: User Feedback & Iteration

- Onboard 5-10 pilot venues
- Gather feedback
- Fix critical issues
- Feature refinements

#### Month 5-6: Scale & Growth Features

- Mobile apps (React Native)
- Advanced gamification
- Rewards system
- Social features
- Third-party integrations

## 🏗️ Technical Architecture

### Monorepo Structure

```
votebox/
├── apps/
│   ├── web/                  # Next.js PWA (Guest + Display)
│   ├── admin/                # Next.js Admin Dashboard
│   └── api/                  # NestJS Backend API
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── database/             # Prisma schema and migrations
│   ├── types/                # Shared TypeScript types
│   ├── config/               # Shared configs (ESLint, TS, etc.)
│   └── utils/                # Shared utilities
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docs/                     # Documentation
├── scripts/                  # Build and deploy scripts
└── terraform/               # Infrastructure as Code (optional)
```

### Data Flow

```
Guest votes → WebSocket → Backend → Queue Recalculation
                           ↓
                    Vote stored in DB
                           ↓
                    Broadcast update → All connected clients
                           ↓
                    Spotify SDK → Play next track
```

## 📊 Project Metrics & KPIs

### Development Metrics

- Code coverage: >80%
- Build time: <5 minutes
- Test suite runtime: <2 minutes
- Deployment time: <10 minutes

### Product Metrics (Post-Launch)

- Venues onboarded: 10 (Month 1), 50 (Month 6)
- Monthly active users: 1,000 (Month 3)
- Average votes per event: 200+
- User retention: >60% return visitors
- System uptime: 99.5%+

### Business Metrics

- Monthly Recurring Revenue: £1,000 (Month 3)
- Customer Acquisition Cost: <£100
- Lifetime Value: >£500
- Churn rate: <10%

## ⚠️ Risks & Mitigation

| Risk                       | Impact | Probability | Mitigation                                             |
| -------------------------- | ------ | ----------- | ------------------------------------------------------ |
| Spotify API rate limits    | High   | Medium      | Implement aggressive caching, use multiple API keys    |
| Venue internet reliability | High   | High        | Offline mode, retry logic, clear error messaging       |
| Vote manipulation          | Medium | Medium      | Rate limiting, fingerprinting, cooldowns               |
| Licensing issues           | High   | Low         | Use Spotify's proper channels, verify venue compliance |
| Competition                | Medium | Medium      | Focus on unique features, excellent UX                 |
| Slow adoption              | High   | Medium      | Pilot program, free tier, excellent onboarding         |

## 🔐 Security Considerations

1. **Authentication**: JWT tokens, secure password hashing (bcrypt)
2. **Authorization**: Role-based access control (RBAC)
3. **Data Protection**: Encrypt sensitive data at rest
4. **API Security**: Rate limiting, input validation, CORS
5. **Infrastructure**: HTTPS only, security headers, DDoS protection
6. **Monitoring**: Audit logs, intrusion detection, regular security scans

## 📈 Success Criteria

### MVP Success (Week 4)

- [ ] Single venue can run a themed event
- [ ] Guests can vote from phones
- [ ] Queue updates automatically
- [ ] Spotify playback works reliably
- [ ] Admin can control event

### Launch Success (Week 12)

- [ ] 5 venues actively using platform
- [ ] Zero critical bugs in production
- [ ] 99% uptime
- [ ] Positive user feedback (>4/5 rating)
- [ ] Payment processing works

### 6-Month Success

- [ ] 50+ active venue customers
- [ ] £3,000+ MRR
- [ ] <5% churn rate
- [ ] Feature-complete platform
- [ ] Scalable infrastructure

## 💰 Budget Breakdown

### Development Phase (3 months)

- Infrastructure: £300
- Spotify Premium: £30
- Testing tools: £100
- Domain & SSL: £50
- **Total: £480**

### Launch & First Year

- Cloud hosting: £200/month = £2,400
- Monitoring & tools: £50/month = £600
- Payment processing: 2.9% + £0.20 per transaction
- Marketing: £1,000
- Support tools: £300
- **Total: ~£4,300**

## 📞 Communication Plan

### Stakeholders

- Development team (you)
- Early adopter venues
- Beta testers
- Potential investors (future)

### Updates

- Weekly: Internal progress review
- Bi-weekly: Pilot venue check-ins
- Monthly: Public blog post/newsletter
- Quarterly: Investor updates (if applicable)

## 🎓 Learning & Development

### Skills to Develop

- Advanced NestJS patterns
- Real-time WebSocket architectures
- Spotify API deep dive
- Payment processing (Stripe)
- Cloud infrastructure (if going beyond VPS)
- SaaS metrics and analytics

### Resources

- NestJS documentation
- Spotify for Developers
- Real-time web patterns
- SaaS playbooks
- Your existing DevOps expertise (huge advantage!)

## 🚀 Go-to-Market Strategy

### Phase 1: Pilot (Month 1-2)

- Approach 3-5 friendly venues
- Offer free usage for feedback
- Iterate based on real-world use

### Phase 2: Limited Launch (Month 3-4)

- 20 venue limit
- Referral program
- Case studies and testimonials

### Phase 3: Public Launch (Month 5+)

- Open signups
- Content marketing
- Paid advertising
- Industry partnerships

## 📚 Next Steps

1. **Review this plan** - Adjust timeline based on your availability
2. **Set up development environment** - Follow DEVELOPMENT_SETUP.md
3. **Create GitHub repository** - Initialize with this structure
4. **Start Week 1 tasks** - Begin with project scaffolding
5. **Schedule pilot venues** - Line up early testers

---

**Last Updated**: January 2026  
**Project Owner**: Olaf Kfreund  
**Status**: Planning Phase
