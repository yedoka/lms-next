# Build context is the REPO ROOT, not this directory:
#   docker build -f apps/realtime/Dockerfile -t skillbase-realtime .
#
# UNVERIFIED: updated for the monorepo layout during the 2026-08-02 migration
# but never built. The project currently runs locally only. Treat this as a
# starting point, not a working image.
FROM oven/bun:1
WORKDIR /app

# bun install migrates yarn.lock, so the workspace resolves from one lockfile.
COPY package.json yarn.lock ./
COPY apps/realtime/package.json apps/realtime/
COPY packages/db/package.json packages/db/
RUN bun install

COPY packages/db packages/db
COPY apps/realtime apps/realtime

# The realtime server never runs migrations, but it needs the generated client.
RUN cd packages/db && DATABASE_URL="postgresql://placeholder:5432/db" bunx prisma generate

WORKDIR /app/apps/realtime
EXPOSE 8080
ENV PORT=8080

CMD ["bun", "run", "index.ts"]
