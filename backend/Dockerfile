FROM node:20.18.0

WORKDIR /usr/src/app

# Add environment variables
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "src/index.js"]