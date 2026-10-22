const { createClient } = require('redis');

let redisClient = null;
let isReady = false;

const connectRedis = async () => {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    try {
        redisClient = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 3000,
                reconnectStrategy: (retries) => {
                    // Retry every 2 seconds, stop after 5 attempts if server isn't up
                    if (retries > 5) {
                        console.warn('[Redis] Max reconnection attempts reached. Operating in DB-only fallback mode.');
                        return false;
                    }
                    return 2000;
                }
            }
        });

        redisClient.on('connect', () => {
            console.log('[Redis] Connecting to server...');
        });

        redisClient.on('ready', () => {
            isReady = true;
            console.log('[Redis] Connected and ready for caching!');
        });

        redisClient.on('error', (err) => {
            isReady = false;
            console.warn(`[Redis] Connection warning: ${err.message}. Operating in fallback mode.`);
        });

        redisClient.on('end', () => {
            isReady = false;
            console.log('[Redis] Connection closed.');
        });

        await redisClient.connect();
    } catch (err) {
        isReady = false;
        console.warn(`[Redis] Initial connection failed (${err.message}). Application running with MongoDB fallback.`);
    }
};

/**
 * Helper to check if Redis is currently connected and healthy
 */
const isRedisReady = () => isReady && redisClient !== null;

/**
 * Returns the client if connected, or null
 */
const getRedisClient = () => (isRedisReady() ? redisClient : null);

module.exports = {
    connectRedis,
    isRedisReady,
    getRedisClient
};
