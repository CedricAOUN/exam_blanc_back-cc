FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "const net=require('net');const socket=net.connect(process.env.PORT||5000,'127.0.0.1',()=>socket.end());socket.on('error',()=>process.exit(1))"

CMD ["npm", "start"]
