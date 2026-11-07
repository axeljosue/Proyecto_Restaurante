# Imagen base liviana con Node.js
FROM node:20-alpine AS builder 
WORKDIR /app 

# Copiar archivos de dependencias 
COPY package*.json ./ 

# Instalación de dependencias 
RUN npm install 

# Copiar el resto del código fuente del backend 
COPY . . 

# Compilar TypeScript a JavaScript
RUN npm run build 

# Etapa de producción 
FROM node:20-alpine AS runner

WORKDIR /app 

COPY package*.json ./ 
RUN npm install --only=production 

COPY --from=builder /app/dist ./dist 

EXPOSE 4000 

CMD ["node", "dist/server.js"]