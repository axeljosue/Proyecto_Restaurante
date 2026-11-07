# Etapa 1: Build de React con Vite
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

# Incluir devDependencies (typescript, vite, tailwind) aunque NODE_ENV=production
RUN npm install --include=dev

COPY . .

RUN npm run build

# Etapa 2: Servidor de producción optimizado con Nginx
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
