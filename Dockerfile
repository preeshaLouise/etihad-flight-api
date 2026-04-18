# ── Stage: base image ──────────────────────────────────────────
# Alpine = a 5MB Linux distro. Etihad uses slim images to reduce
# attack surface and keep container startup times under 2 seconds.
FROM node:18-alpine

# ── Working directory inside the container ─────────────────────
# This is like cd-ing into a folder. All subsequent commands
# run from here. Convention: /app or /usr/src/app
WORKDIR /app

# ── Install dependencies first (Docker layer caching trick) ────
# We copy package.json BEFORE the rest of the code.
# If only app.js changes, Docker reuses the cached npm install layer.
# This makes rebuilds ~10x faster — critical in CI/CD pipelines.
COPY package*.json ./
RUN npm install --production

# ── Copy app source code ────────────────────────────────────────
COPY app.js .

# ── Document which port the app uses ───────────────────────────
# This doesn't actually publish the port — it's documentation
# for engineers and orchestration tools like Kubernetes
EXPOSE 3000

# ── The command that runs when the container starts ─────────────
CMD ["node", "app.js"]