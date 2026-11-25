# syntax=docker/dockerfile:1.7

# Etapa 1: build de la SPA
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Las variables VITE_* se incrustan en el bundle en tiempo de build. Se pasan
# como secreto de BuildKit para no dejarlas en capas ni en el historial:
#   docker build --secret id=vite_env,src=.env -t theme-studio .
# Sin secreto, la app arranca en modo local (sin cuentas ni base de datos).
RUN --mount=type=secret,id=vite_env \
    if [ -f /run/secrets/vite_env ]; then set -a; . /run/secrets/vite_env; set +a; fi; \
    npm run build

# Etapa 2: servidor estático
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
