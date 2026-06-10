FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run db:generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:./prisma/dev.db
COPY --from=build /app .
EXPOSE 3001
CMD ["npm", "start"]
