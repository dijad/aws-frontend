# syntax=docker/dockerfile:1
# Nuxt 3 SSR (Nitro node server) for Cloud Run

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NUXT_PUBLIC_API_BASE
ARG NUXT_PUBLIC_WS_BASE
ARG NUXT_PUBLIC_AUTH_DISABLED=false

ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_WS_BASE=$NUXT_PUBLIC_WS_BASE
ENV NUXT_PUBLIC_AUTH_DISABLED=$NUXT_PUBLIC_AUTH_DISABLED

RUN npm run build \
  && ln -sf ../../public /app/.output/server/chunks/public

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080

COPY --from=build /app/.output ./.output

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["node", ".output/server/index.mjs"]
