FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Run build to build the Next.js production build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
