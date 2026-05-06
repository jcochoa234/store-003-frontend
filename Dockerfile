# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
#   Uses node:20-alpine to install dependencies and compile the Angular app.
#   The output is placed in /app/dist/Store003Frontend/browser/.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy manifests first — leverages Docker layer cache.
# npm ci only re-runs when package-lock.json changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npm run build:prod


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Serve
#   Minimal nginx:alpine image. Copies only the compiled static files and
#   the custom nginx config. No Node.js runtime in the final image.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS final

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled Angular app from the build stage
COPY --from=build /app/dist/Store003Frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
