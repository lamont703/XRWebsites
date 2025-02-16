FROM node:22.8.0

WORKDIR /usr/src/app

# Add environment variables
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]