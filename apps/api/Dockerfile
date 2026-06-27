ARG NODE_VERSION=24.13.1
FROM oven/bun:latest AS base

# Set working directory
WORKDIR /app

# ---
FROM base AS prepare
RUN bun add -g turbo
COPY . .
RUN turbo prune api --docker

# ---
FROM base AS builder
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN bun install

# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN bun turbo build

FROM mwader/static-ffmpeg:latest AS ffmpeg

FROM oven/bun:latest AS runner
COPY --from=ffmpeg /ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg /ffprobe /usr/local/bin/ffprobe
WORKDIR /app

COPY --from=builder /app .

CMD bun run apps/api/src/index.ts
