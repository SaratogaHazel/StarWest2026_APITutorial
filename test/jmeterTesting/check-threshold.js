#!/usr/bin/env node
/**
 * Fails the build when the login endpoint misses its performance budget.
 *
 * JMeter exits 0 whether the run was fast or slow -- its assertions only check
 * correctness, so without this gate a p95 regression would pass CI silently.
 *
 * Reads the JMeter HTML dashboard's statistics.json, where:
 *   pct1ResTime = 90th percentile
 *   pct2ResTime = 95th percentile
 *   pct3ResTime = 99th percentile
 *
 * Usage:
 *   node test/jmeterTesting/check-threshold.js [statistics.json] [thresholdMs]
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_STATS = path.join(__dirname, 'results', 'html', 'statistics.json');
const DEFAULT_THRESHOLD_MS = 500;

const statsPath = process.argv[2] || DEFAULT_STATS;
const thresholdMs = Number(process.argv[3] || process.env.P95_THRESHOLD_MS || DEFAULT_THRESHOLD_MS);

if (!fs.existsSync(statsPath)) {
  console.error(`No JMeter statistics found at ${statsPath}.`);
  console.error('Run the load test with -e -o <dir> first so the dashboard is generated.');
  process.exit(1);
}

const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
const total = stats.Total;

if (!total) {
  console.error(`${statsPath} has no "Total" entry - the run produced no samples.`);
  process.exit(1);
}

const p95 = total.pct2ResTime;
const failures = [];

console.log('Login endpoint performance gate');
console.log('-------------------------------');
console.log(`samples     : ${total.sampleCount}`);
console.log(`errors      : ${total.errorCount} (${total.errorPct.toFixed(2)}%)`);
console.log(`mean        : ${total.meanResTime.toFixed(1)} ms`);
console.log(`p90         : ${total.pct1ResTime} ms`);
console.log(`p95         : ${p95} ms   (budget ${thresholdMs} ms)`);
console.log(`p99         : ${total.pct3ResTime} ms`);
console.log(`max         : ${total.maxResTime} ms`);
console.log(`throughput  : ${total.throughput.toFixed(1)} req/s`);
console.log('-------------------------------');

if (total.sampleCount === 0) {
  failures.push('No samples were recorded.');
}

if (total.errorCount > 0) {
  failures.push(`${total.errorCount} request(s) failed; a performance number is meaningless when requests are erroring.`);
}

if (p95 >= thresholdMs) {
  failures.push(`p95 was ${p95} ms, which is over the ${thresholdMs} ms budget.`);
}

if (failures.length > 0) {
  failures.forEach((reason) => console.error(`FAIL: ${reason}`));
  process.exit(1);
}

const headroom = (thresholdMs / p95).toFixed(1);
console.log(`PASS: p95 ${p95} ms is within the ${thresholdMs} ms budget (${headroom}x headroom).`);
