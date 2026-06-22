FROM python:3.14-slim-bookworm AS base 
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

FROM python:3.14-slim-bookworm  AS node
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Avoid prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install curl and CA certificates
RUN mkdir -p /etc/apt/keyrings \
    # Download the NodeSource GPG key and add the setup repository (Node 22 is an LTS version)
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    # Install Node.js
    && apt-get update && apt-get install -y nodejs \
    # Clean up apt caches to save space
    && rm -rf /var/lib/apt/lists/*


FROM node AS build-frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM base AS runtime
WORKDIR /app

# uv is not in the base image; pull the static binary from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen
COPY main.py .
COPY --from=build-frontend /build/dist dist
COPY static static

COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

