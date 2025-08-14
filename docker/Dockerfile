# --- STAGE 1: build ---
FROM node:20-alpine AS build
WORKDIR /app

# Wstrzykujemy tylko podczas builda (Vite czyta VITE_*)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Zainstaluj zależności i zbuduj
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# --- STAGE 2: serve statics przez vite preview ---
FROM node:20-alpine
WORKDIR /app

# Vite jako serwer podglądu prod-builda
RUN npm i -g vite@latest

# Skopiuj zbudowane pliki
COPY --from=build /app/dist ./dist

EXPOSE 4173
CMD ["vite", "preview", "--host", "0.0.0.0", "--strictPort"]
