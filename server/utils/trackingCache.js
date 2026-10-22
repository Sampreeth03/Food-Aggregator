const { getRedisClient, isRedisReady } = require('../config/redis');

// TTL for live tracking cache: 1 hour (3600 seconds)
const TRACKING_TTL_SECONDS = 3600;

/**
 * Generate Redis key for order live tracking
 */
const getTrackingKey = (orderId) => `order:live:${orderId}`;

/**
 * 1. Save or update live rider coordinates & ETA in Redis Hash
 */
const setLiveTracking = async (orderId, { riderId, coords, eta }) => {
    if (!isRedisReady()) return null;

    try {
        const client = getRedisClient();
        const key = getTrackingKey(orderId);

        await client.hSet(key, {
            riderId: riderId ? riderId.toString() : '',
            lng: coords[0].toString(),
            lat: coords[1].toString(),
            eta: eta ? (typeof eta === 'string' ? eta : eta.toISOString()) : '',
            updatedAt: Date.now().toString()
        });

        await client.expire(key, TRACKING_TTL_SECONDS);
        return true;
    } catch (err) {
        console.error(`[Redis] Error setting live tracking for order ${orderId}:`, err.message);
        return null;
    }
};

/**
 * 2. Get live tracking data from Redis Hash
 */
const getLiveTracking = async (orderId) => {
    if (!isRedisReady()) return null;

    try {
        const client = getRedisClient();
        const key = getTrackingKey(orderId);

        const data = await client.hGetAll(key);

        if (!data || Object.keys(data).length === 0) {
            return null;
        }

        return {
            riderId: data.riderId,
            coords: [parseFloat(data.lng), parseFloat(data.lat)],
            eta: data.eta || null,
            updatedAt: parseInt(data.updatedAt, 10)
        };
    } catch (err) {
        console.error(`[Redis] Error reading live tracking for order ${orderId}:`, err.message);
        return null;
    }
};

/**
 * 3. Delete live tracking data when order is delivered/cancelled
 */
const clearLiveTracking = async (orderId) => {
    if (!isRedisReady()) return null;

    try {
        const client = getRedisClient();
        const key = getTrackingKey(orderId);
        await client.del(key);
        return true;
    } catch (err) {
        console.error(`[Redis] Error clearing live tracking for order ${orderId}:`, err.message);
        return null;
    }
};

module.exports = {
    setLiveTracking,
    getLiveTracking,
    clearLiveTracking
};
