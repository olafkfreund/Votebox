{
  description = "Votebox - Democratic Music Selection for Venues";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true; # Required for some Playwright dependencies
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "votebox-dev";

          buildInputs = with pkgs; [
            # Node.js and package managers
            nodejs_20
            nodePackages.npm
            nodePackages.pnpm

            # Playwright browsers and dependencies
            playwright-driver.browsers

            # Database tools
            postgresql_16
            redis

            # Docker (for running services)
            docker
            docker-compose

            # Development tools
            git
            jq
            curl

            # Optional: useful development utilities
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.prettier
            nodePackages.eslint
          ];

          shellHook = ''
            echo "🎵 Votebox Development Environment"
            echo "=================================="
            echo ""
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo ""

            # Configure Playwright to use Nix-installed browsers
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

            echo "✅ Playwright browsers: $PLAYWRIGHT_BROWSERS_PATH"
            echo ""

            # Ensure node_modules/.bin is in PATH
            export PATH="$PWD/node_modules/.bin:$PATH"

            # Set up environment for local development
            if [ -f .env ]; then
              echo "✅ .env file found"
            else
              echo "⚠️  .env file not found - copy .env.example to .env"
            fi

            echo ""
            echo "Available commands:"
            echo "  npm run dev              - Start development servers"
            echo "  npm run test             - Run unit tests"
            echo "  npm run test:e2e         - Run E2E tests (Playwright)"
            echo "  npm run test:e2e:ui      - Open Playwright UI"
            echo "  npm run db:migrate       - Run database migrations"
            echo "  npm run db:studio        - Open Prisma Studio"
            echo "  docker-compose up -d     - Start PostgreSQL and Redis"
            echo ""
            echo "📚 Documentation: ./DOCUMENTATION_INDEX.md"
            echo "🏗️  Architecture: ./ARCHITECTURE.md"
            echo ""
          '';

          # Additional environment variables
          PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma-engines}/lib/libquery_engine.node";
          PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
          PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
          PRISMA_FMT_BINARY = "${pkgs.prisma-engines}/bin/prisma-fmt";
        };
      }
    );
}
