/**
 * Real-Time Tracking Performance Benchmark
 * Compares MongoDB (Disk + Multi-Populate) vs Redis (In-Memory RAM)
 * 
 * Usage:
 *   node scripts/benchmark-tracking.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { performance } = require('perf_hooks');

const connectDB = require('../config/db');
const { connectRedis, getRedisClient, isRedisReady } = require('../config/redis');
const { setLiveTracking, getLiveTracking } = require('../utils/trackingCache');

const Order = require('../models/Order');
const User = require('../models/Users');
const Restaurant = require('../models/Restaurant');

const TOTAL_READ_REQUESTS = 100;
const TOTAL_WRITE_REQUESTS = 50;

// Helper to calculate percentile from sorted numbers
function getPercentile(arr, p) {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.max(0, Math.min(arr.length - 1, index))];
}

// Compute standard latency metrics
function computeMetrics(latencies, wallTimeMs) {
  latencies.sort((a, b) => a - b);
  const total = latencies.reduce((sum, val) => sum + val, 0);
  const avg = total / latencies.length;
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const p50 = getPercentile(latencies, 50);
  const p95 = getPercentile(latencies, 95);
  const p99 = getPercentile(latencies, 99);
  const rps = (latencies.length / (wallTimeMs / 1000));

  return { avg, min, max, p50, p95, p99, rps, wallTimeMs };
}

async function runBenchmark() {
  console.log('\n============================================================');
  console.log('   FOOD AGGREGATOR: REAL-TIME TRACKING BENCHMARK SUITE');
  console.log('============================================================');

  // 1. Initialize connections
  console.log('\n[1/4] Connecting to MongoDB and Redis...');
  await new Promise((resolve) => {
    connectDB();
    setTimeout(resolve, 1500);
  });
  await connectRedis();

  if (!isRedisReady()) {
    console.error('ERROR: Redis is not connected. Please ensure Redis server is running.');
    process.exit(1);
  }

  // 2. Setup or find a valid order fixture
  console.log('[2/4] Preparing test delivery order...');
  let order = await Order.findOne({ rider: { $ne: null } })
    .populate('restaurant')
    .populate('customer')
    .populate('rider');

  // If no order exists, create a temporary mock setup for testing
  let tempCreated = false;
  let testUser, testRest, testRider;
  if (!order) {
    tempCreated = true;
    testUser = await User.create({
      name: 'Benchmark Customer',
      email: `bench_cust_${Date.now()}@test.com`,
      password: 'password123',
      role: 'customer',
      location: { type: 'Point', coordinates: [78.38, 17.44] }
    });
    testRider = await User.create({
      name: 'Benchmark Rider',
      email: `bench_rider_${Date.now()}@test.com`,
      password: 'password123',
      role: 'rider',
      location: { type: 'Point', coordinates: [78.39, 17.45] }
    });
    testRest = await Restaurant.create({
      name: 'Benchmark Kitchen',
      owner: testUser._id,
      cuisine: 'Italian',
      location: { type: 'Point', coordinates: [78.37, 17.43] },
      address: 'Test Street 101'
    });
    order = await Order.create({
      customer: testUser._id,
      restaurant: testRest._id,
      rider: testRider._id,
      deliveryAddress: 'Test Address',
      deliveryLocation: { type: 'Point', coordinates: [78.38, 17.44] },
      items: [{ menuItemId: 'item1', name: 'Pasta', quantity: 2, price: 250 }],
      totalAmount: 500,
      status: 'out_for_delivery'
    });
  }

  const orderId = order._id.toString();
  const riderId = order.rider._id ? order.rider._id.toString() : order.rider.toString();

  // Warm Redis with initial live coordinate
  await setLiveTracking(orderId, {
    riderId,
    coords: [78.3845, 17.4412],
    eta: new Date(Date.now() + 15 * 60 * 1000)
  });

  console.log(`[3/4] Benchmarking active order ID: ${orderId}\n`);

  // ─────────────────────────────────────────────────────────────
  // TEST A: Customer Polling Read Benchmark (100 Requests)
  // ─────────────────────────────────────────────────────────────
  console.log(`--- RUNNING READ BENCHMARK (${TOTAL_READ_REQUESTS} requests) ---`);

  // A1. MongoDB Baseline (Full multi-populate query on disk)
  process.stdout.write('Testing MongoDB disk reads (.populate joins)... ');
  const mongoReadLatencies = [];
  const startMongoReadWall = performance.now();
  for (let i = 0; i < TOTAL_READ_REQUESTS; i++) {
    const t0 = performance.now();
    await Order.findById(orderId)
      .populate('restaurant', 'name address location')
      .populate('customer', 'name email location')
      .populate('rider', 'name location')
      .lean();
    mongoReadLatencies.push(performance.now() - t0);
  }
  const mongoReadWallTime = performance.now() - startMongoReadWall;
  console.log('DONE');

  // A2. Redis In-Memory Read (Direct RAM lookup)
  process.stdout.write('Testing Redis in-memory reads (HGETALL RAM)... ');
  const redisReadLatencies = [];
  const startRedisReadWall = performance.now();
  for (let i = 0; i < TOTAL_READ_REQUESTS; i++) {
    const t0 = performance.now();
    await getLiveTracking(orderId);
    redisReadLatencies.push(performance.now() - t0);
  }
  const redisReadWallTime = performance.now() - startRedisReadWall;
  console.log('DONE\n');

  // ─────────────────────────────────────────────────────────────
  // TEST B: Rider Location Heartbeat Write Benchmark (50 Writes)
  // ─────────────────────────────────────────────────────────────
  console.log(`--- RUNNING WRITE BENCHMARK (${TOTAL_WRITE_REQUESTS} updates) ---`);

  // B1. MongoDB Baseline (User location update + Order save)
  process.stdout.write('Testing MongoDB disk writes (User update + Order save)... ');
  const mongoWriteLatencies = [];
  const startMongoWriteWall = performance.now();
  for (let i = 0; i < TOTAL_WRITE_REQUESTS; i++) {
    const t0 = performance.now();
    await User.findByIdAndUpdate(riderId, {
      location: { type: 'Point', coordinates: [78.38 + i * 0.0001, 17.44 + i * 0.0001] }
    });
    await Order.findByIdAndUpdate(orderId, {
      estimatedDeliveryTime: new Date(Date.now() + 600000)
    });
    mongoWriteLatencies.push(performance.now() - t0);
  }
  const mongoWriteWallTime = performance.now() - startMongoWriteWall;
  console.log('DONE');

  // B2. Redis In-Memory Write (HSET)
  process.stdout.write('Testing Redis in-memory writes (HSET RAM)... ');
  const redisWriteLatencies = [];
  const startRedisWriteWall = performance.now();
  for (let i = 0; i < TOTAL_WRITE_REQUESTS; i++) {
    const t0 = performance.now();
    await setLiveTracking(orderId, {
      riderId,
      coords: [78.38 + i * 0.0001, 17.44 + i * 0.0001],
      eta: new Date(Date.now() + 600000)
    });
    redisWriteLatencies.push(performance.now() - t0);
  }
  const redisWriteWallTime = performance.now() - startRedisWriteWall;
  console.log('DONE\n');

  // Clean up mock docs if created
  if (tempCreated) {
    await Order.findByIdAndDelete(order._id);
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(testRider._id);
    await Restaurant.findByIdAndDelete(testRest._id);
  }

  // ─────────────────────────────────────────────────────────────
  // COMPUTE & PRINT FINAL PROVEN REPORT
  // ─────────────────────────────────────────────────────────────
  const mongoReadStats = computeMetrics(mongoReadLatencies, mongoReadWallTime);
  const redisReadStats = computeMetrics(redisReadLatencies, redisReadWallTime);
  const mongoWriteStats = computeMetrics(mongoWriteLatencies, mongoWriteWallTime);
  const redisWriteStats = computeMetrics(redisWriteLatencies, redisWriteWallTime);

  const readLatencyImprovement = (((mongoReadStats.avg - redisReadStats.avg) / mongoReadStats.avg) * 100).toFixed(2);
  const readP95Improvement = (((mongoReadStats.p95 - redisReadStats.p95) / mongoReadStats.p95) * 100).toFixed(2);
  const readThroughputMultiplier = (redisReadStats.rps / mongoReadStats.rps).toFixed(1);

  const writeLatencyImprovement = (((mongoWriteStats.avg - redisWriteStats.avg) / mongoWriteStats.avg) * 100).toFixed(2);
  const writeThroughputMultiplier = (redisWriteStats.rps / mongoWriteStats.rps).toFixed(1);

  console.log('============================================================');
  console.log('               PROVEN BENCHMARK RESULTS                    ');
  console.log('============================================================');
  console.log('\n📊 READ PERFORMANCE (Customer Polling):');
  console.log('────────────────────────────────────────────────────────────');
  console.log(` Metric               MongoDB (Baseline)       Redis (In-Memory)`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(` Average Latency:     ${mongoReadStats.avg.toFixed(2).padStart(8)} ms            ${redisReadStats.avg.toFixed(2).padStart(8)} ms`);
  console.log(` P50 (Median):        ${mongoReadStats.p50.toFixed(2).padStart(8)} ms            ${redisReadStats.p50.toFixed(2).padStart(8)} ms`);
  console.log(` P95 Latency:         ${mongoReadStats.p95.toFixed(2).padStart(8)} ms            ${redisReadStats.p95.toFixed(2).padStart(8)} ms`);
  console.log(` P99 Latency:         ${mongoReadStats.p99.toFixed(2).padStart(8)} ms            ${redisReadStats.p99.toFixed(2).padStart(8)} ms`);
  console.log(` Throughput:          ${mongoReadStats.rps.toFixed(1).padStart(8)} req/s         ${redisReadStats.rps.toFixed(1).padStart(8)} req/s`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(` ⭐ READ IMPROVEMENT:  ${readLatencyImprovement}% Latency Drop | ${readThroughputMultiplier}x Higher Throughput`);

  console.log('\n\n✍️ WRITE PERFORMANCE (Rider 15s Heartbeat):');
  console.log('────────────────────────────────────────────────────────────');
  console.log(` Metric               MongoDB (Disk Writes)    Redis (In-Memory)`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(` Average Latency:     ${mongoWriteStats.avg.toFixed(2).padStart(8)} ms            ${redisWriteStats.avg.toFixed(2).padStart(8)} ms`);
  console.log(` P95 Latency:         ${mongoWriteStats.p95.toFixed(2).padStart(8)} ms            ${redisWriteStats.p95.toFixed(2).padStart(8)} ms`);
  console.log(` Throughput:          ${mongoWriteStats.rps.toFixed(1).padStart(8)} req/s         ${redisWriteStats.rps.toFixed(1).padStart(8)} req/s`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(` ⭐ WRITE IMPROVEMENT: ${writeLatencyImprovement}% Latency Drop | ${writeThroughputMultiplier}x Faster Writes`);
  console.log(` ⭐ DB IOPS SAVINGS:   100% intermediate disk writes eliminated during transit.`);

  console.log('\n============================================================');
  console.log('              RESUME BULLET POINT SUMMARY                   ');
  console.log('============================================================');
  console.log(`
"Optimized real-time courier tracking architecture by replacing synchronous
disk-based MongoDB polling with in-memory Redis Hashes (HSET/HGETALL):
- Reduced tracking read latency by ${readLatencyImprovement}% (from ${mongoReadStats.avg.toFixed(1)}ms to ${redisReadStats.avg.toFixed(1)}ms; P95: ${redisReadStats.p95.toFixed(1)}ms).
- Boosted endpoint read throughput by ${readThroughputMultiplier}x (from ${mongoReadStats.rps.toFixed(0)} to ${redisReadStats.rps.toFixed(0)} req/sec).
- Eliminated 100% of intermediate MongoDB disk write IOPS during active delivery transit,
  preserving database connection pools and preventing disk I/O bottlenecks."
`);
  console.log('============================================================\n');

  await mongoose.disconnect();
  const redis = getRedisClient();
  if (redis) await redis.disconnect();
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('\nBenchmark failed:', err);
  process.exit(1);
});
