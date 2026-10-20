# 1. Use the official lightweight Node.js 20 Linux image
FROM node:20-alpine

# 2. Set the working folder inside the container
WORKDIR /app

# 3. Copy package files first to take advantage of Docker layer caching
COPY package*.json ./

# 4. Install dependencies inside the container
RUN npm install

# 5. Copy the rest of the server source code
COPY . .

# 6. Expose the port your server listens on
EXPOSE 5000

# 7. Start the server
CMD ["node", "app.js"]
