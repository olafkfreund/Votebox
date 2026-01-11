# NixOS Development Guide

This guide provides NixOS-specific instructions for developing Votebox.

## Prerequisites

### 1. Enable Flakes

Ensure Nix flakes are enabled in your NixOS configuration:

```nix
# /etc/nixos/configuration.nix
{
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
```

Then rebuild your system:
```bash
sudo nixos-rebuild switch
```

### 2. Install direnv (Optional but Recommended)

Add to your NixOS configuration:

```nix
# /etc/nixos/configuration.nix
{
  programs.direnv.enable = true;
}
```

Or install in your user profile:
```bash
nix profile install nixpkgs#direnv
```

Then add to your shell configuration (`~/.bashrc` or `~/.zshrc`):
```bash
eval "$(direnv hook bash)"  # or zsh, fish, etc.
```

## Quick Start

### Method 1: Using direnv (Recommended)

1. Clone and enter the project directory:
```bash
cd /path/to/Votebox
```

2. Allow direnv to load the environment:
```bash
direnv allow
```

The development environment will automatically load! You'll see:
```
🎵 Votebox Development Environment
==================================

Node.js version: v20.x.x
npm version: 10.x.x

✅ Playwright browsers: /nix/store/...-playwright-browsers
```

### Method 2: Using nix develop

Manually enter the development shell:

```bash
nix develop
```

This will drop you into a shell with all dependencies available.

### Method 3: Using nix-shell (Legacy)

```bash
nix-shell
```

## What's Included

The Nix development environment provides:

### Core Dependencies
- **Node.js 20** - JavaScript runtime
- **npm** - Package manager
- **pnpm** - Alternative package manager

### Playwright (E2E Testing)
- **playwright-driver.browsers** - Chromium, Firefox, WebKit
- Automatically configured to use Nix-installed browsers
- No manual browser download required

### Database Tools
- **PostgreSQL 16** - Database server and client tools
- **Redis** - Cache server and client tools

### Development Tools
- **Docker & Docker Compose** - Container management
- **Git** - Version control
- **jq** - JSON processor
- **curl** - HTTP client
- **TypeScript** - Language and LSP
- **Prettier** - Code formatter
- **ESLint** - Code linter

## Running E2E Tests on NixOS

The Nix environment is pre-configured for Playwright:

```bash
# Run E2E tests
npm run test:e2e

# Open Playwright UI
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### Environment Variables

The following are automatically set:

- `PLAYWRIGHT_BROWSERS_PATH` - Points to Nix-installed browsers
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` - Prevents npm from downloading browsers
- `PRISMA_*_BINARY` - Points to Nix-installed Prisma engines

## Development Workflow

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Or use NixOS system services if configured
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### 4. Start Development Servers

```bash
npm run dev
```

This starts:
- Web App: http://localhost:3000
- API Server: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

## Troubleshooting

### Playwright Browser Issues

If you encounter browser installation errors:

1. **Verify environment variables:**
```bash
echo $PLAYWRIGHT_BROWSERS_PATH
# Should output: /nix/store/...-playwright-browsers

echo $PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
# Should output: 1
```

2. **Re-enter the shell:**
```bash
# If using direnv
direnv reload

# If using nix develop
exit
nix develop
```

3. **Check browser availability:**
```bash
ls -la $PLAYWRIGHT_BROWSERS_PATH
# Should show chromium-*, firefox-*, webkit-* directories
```

### Prisma Issues

If Prisma commands fail:

1. **Regenerate Prisma Client:**
```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

2. **Verify Prisma binaries:**
```bash
echo $PRISMA_QUERY_ENGINE_BINARY
# Should output: /nix/store/...-prisma-engines-.../bin/query-engine
```

### Docker Permission Issues

If you encounter Docker permission errors:

1. **Add your user to the docker group (NixOS):**
```nix
# /etc/nixos/configuration.nix
{
  users.users.YOUR_USERNAME.extraGroups = [ "docker" ];
}
```

2. **Rebuild and re-login:**
```bash
sudo nixos-rebuild switch
# Log out and log back in
```

### Port Conflicts

If ports are already in use:

```bash
# Find processes using ports
lsof -i :3000   # Web
lsof -i :4000   # API
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis

# Or change ports in .env file
```

## NixOS System Services (Optional)

You can run PostgreSQL and Redis as NixOS system services instead of Docker:

### PostgreSQL

```nix
# /etc/nixos/configuration.nix
{
  services.postgresql = {
    enable = true;
    package = pkgs.postgresql_16;
    ensureDatabases = [ "votebox_dev" ];
    ensureUsers = [{
      name = "votebox";
      ensureDBOwnership = true;
    }];
  };
}
```

### Redis

```nix
# /etc/nixos/configuration.nix
{
  services.redis = {
    servers."votebox" = {
      enable = true;
      port = 6379;
    };
  };
}
```

Then update your `.env`:
```env
DATABASE_URL="postgresql://votebox@localhost:5432/votebox_dev?schema=public"
REDIS_URL="redis://localhost:6379"
```

## CI/CD Integration

The project uses GitHub Actions for CI/CD, which runs on Ubuntu (not NixOS).

### E2E Tests in CI

The `.github/workflows/e2e.yml` workflow:
- ✅ Runs on Ubuntu with standard Playwright installation
- ✅ Uses PostgreSQL and Redis service containers
- ✅ Automatically installs Chromium browsers
- ✅ Runs all E2E tests on every push to main/develop

### Local Testing Before Push

Always run tests locally before pushing:

```bash
# Unit tests
npm run test

# E2E tests (using Nix-installed browsers)
npm run test:e2e

# All tests with coverage
npm run test:ci
```

## Updating Dependencies

### Update Nix Flake

```bash
# Update all flake inputs
nix flake update

# Update specific input
nix flake lock --update-input nixpkgs
```

### Update npm Packages

```bash
# Update package.json dependencies
npm update

# Or update specific package
npm update @playwright/test
```

## Advanced: Custom Nix Configuration

### Adding More Tools

Edit `flake.nix` and add to `buildInputs`:

```nix
buildInputs = with pkgs; [
  # ... existing packages ...

  # Add your tools here
  pgcli        # PostgreSQL CLI with autocomplete
  redis-cli    # Redis CLI
  httpie       # Modern HTTP client
];
```

### Environment Variables

Add custom environment variables in `shellHook`:

```nix
shellHook = ''
  # ... existing shellHook ...

  export MY_CUSTOM_VAR="value"
'';
```

## Useful Commands

```bash
# Development
nix develop              # Enter development shell
nix flake check         # Check flake validity
nix flake show          # Show flake outputs

# Cleaning
nix-collect-garbage     # Clean old generations
nix-collect-garbage -d  # Deep clean (delete all old generations)

# Information
nix flake metadata      # Show flake metadata
nix show-derivation     # Show derivation details
```

## Resources

- [Nix Flakes Documentation](https://nixos.wiki/wiki/Flakes)
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [Playwright on Nix](https://nixos.wiki/wiki/Playwright)
- [Votebox Architecture](../ARCHITECTURE.md)
- [Votebox Development Setup](../DEVELOPMENT_SETUP.md)

## Support

If you encounter NixOS-specific issues:

1. Check this guide first
2. Review the [main README](../README.md)
3. Open an issue on [GitHub Issues](https://github.com/olafkfreund/Votebox/issues)
4. Tag with `nixos` label

---

**Happy NixOS Development!** 🎵 ❄️
