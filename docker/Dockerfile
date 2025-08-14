# --- STAGE 1: build ---
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# --- STAGE 2: serve statics przez vite preview ---
FROM node:20-alpine
WORKDIR /app

# CLI Vite do serwowania dist
RUN npm i -g vite@latest

# skopiuj build
COPY --from=build /app/dist ./dist

# 👇 wygeneruj minimalny config preview (BRAK importów!)
RUN printf "export default { preview: { allowedHosts: ['nexus.tablefoods.com'], host: '0.0.0.0', port: 4173 } };\n" > /app/vite.preview.config.js

EXPOSE 4173
# 👇 kluczowe: wskaż poprawny config
CMD ["vite", "preview", "-c", "/app/vite.preview.config.js", "--strictPort"]
