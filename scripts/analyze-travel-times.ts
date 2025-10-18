/**
 * Travel Time Analysis Script
 * Compares HGT estimates with Google Maps actual ranges
 * Identifies systematic patterns and accuracy issues
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Test data: HGT estimates from test-travel-times.ts
const hgtData = [
  { test: 1, origin: 'El Segundo', venue: 'Ice Realm', date: '2025-10-19', time: '08:40', hgt: 31, distance: 26 },
  { test: 2, origin: 'Pasadena', venue: 'Ice Realm', date: '2025-10-19', time: '08:40', hgt: 46, distance: 43 },
  { test: 3, origin: 'NW LA', venue: 'Ice Realm', date: '2025-10-19', time: '08:40', hgt: 46, distance: 42 },
  { test: 4, origin: 'El Segundo', venue: 'Ontario Center Ice', date: '2025-11-02', time: '08:45', hgt: 62, distance: 53 },
  { test: 5, origin: 'Pasadena', venue: 'Ontario Center Ice', date: '2025-11-02', time: '08:45', hgt: 44, distance: 34 },
  { test: 6, origin: 'NW LA', venue: 'Ontario Center Ice', date: '2025-11-02', time: '08:45', hgt: 66, distance: 57 },
  { test: 7, origin: 'El Segundo', venue: 'YorbaLinda ICE', date: '2025-11-09', time: '17:00', hgt: 56, distance: 47 },
  { test: 8, origin: 'Pasadena', venue: 'YorbaLinda ICE', date: '2025-11-09', time: '17:00', hgt: 59, distance: 44 },
  { test: 9, origin: 'NW LA', venue: 'YorbaLinda ICE', date: '2025-11-09', time: '17:00', hgt: 88, distance: 62 },
  { test: 10, origin: 'El Segundo', venue: 'Lake Forest IP', date: '2025-11-23', time: '08:45', hgt: 58, distance: 50 },
  { test: 11, origin: 'Pasadena', venue: 'Lake Forest IP', date: '2025-11-23', time: '08:45', hgt: 66, distance: 61 },
  { test: 12, origin: 'NW LA', venue: 'Lake Forest IP', date: '2025-11-23', time: '08:45', hgt: 73, distance: 66 },
  { test: 13, origin: 'El Segundo', venue: 'Paramount Ice Land', date: '2025-12-14', time: '08:45', hgt: 24, distance: 18 },
  { test: 14, origin: 'Pasadena', venue: 'Paramount Ice Land', date: '2025-12-14', time: '08:45', hgt: 38, distance: 33 },
  { test: 15, origin: 'NW LA', venue: 'Paramount Ice Land', date: '2025-12-14', time: '08:45', hgt: 40, distance: 34 },
  { test: 16, origin: 'El Segundo', venue: 'Ice Realm', date: '2025-12-21', time: '12:00', hgt: 37, distance: 26 },
  { test: 17, origin: 'Pasadena', venue: 'Ice Realm', date: '2025-12-21', time: '12:00', hgt: 56, distance: 43 },
  { test: 18, origin: 'NW LA', venue: 'Ice Realm', date: '2025-12-21', time: '12:00', hgt: 57, distance: 42 },
  { test: 19, origin: 'El Segundo', venue: 'Valley Center Ice', date: '2026-01-11', time: '12:15', hgt: 59, distance: 28 },
  { test: 20, origin: 'Pasadena', venue: 'Valley Center Ice', date: '2026-01-11', time: '12:15', hgt: 37, distance: 23 },
  { test: 21, origin: 'NW LA', venue: 'Valley Center Ice', date: '2026-01-11', time: '12:15', hgt: 22, distance: 11 },
  { test: 22, origin: 'El Segundo', venue: 'Paramount Ice Land', date: '2026-01-25', time: '16:15', hgt: 28, distance: 19 },
  { test: 23, origin: 'Pasadena', venue: 'Paramount Ice Land', date: '2026-01-25', time: '16:15', hgt: 50, distance: 35 },
  { test: 24, origin: 'NW LA', venue: 'Paramount Ice Land', date: '2026-01-25', time: '16:15', hgt: 63, distance: 34 },
  { test: 25, origin: 'El Segundo', venue: 'Ontario Center Ice', date: '2026-02-01', time: '10:30', hgt: 67, distance: 53 },
  { test: 26, origin: 'Pasadena', venue: 'Ontario Center Ice', date: '2026-02-01', time: '10:30', hgt: 47, distance: 34 },
  { test: 27, origin: 'NW LA', venue: 'Ontario Center Ice', date: '2026-02-01', time: '10:30', hgt: 69, distance: 57 },
];

function loadGoogleRanges(): Record<number, string> {
  try {
    const csvPath = join(__dirname, 'google-maps-ranges.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n').slice(1); // Skip header

    const ranges: Record<number, string> = {};
    lines.forEach(line => {
      const [test, min, max] = line.split(',');
      if (min && max) {
        ranges[parseInt(test)] = `${min}-${max}`;
      }
    });

    return ranges;
  } catch (error) {
    console.error('⚠️  Could not load google-maps-ranges.csv');
    console.error('Please create the file with format: test,google_min,google_max');
    return {};
  }
}

function parseGoogleRange(range: string): { min: number; max: number; midpoint: number } {
  const [min, max] = range.split('-').map(Number);
  return { min, max, midpoint: (min + max) / 2 };
}

function analyzePatterns() {
  const googleRanges = loadGoogleRanges();

  console.log('🔍 Travel Time Analysis Report');
  console.log('='.repeat(100));
  console.log('\n📊 Individual Route Analysis:\n');

  const results = hgtData.map((test) => {
    const googleRange = googleRanges[test.test];
    if (!googleRange) {
      console.log(`Test #${test.test}: ⚠️  Missing Google Maps data`);
      return null;
    }

    const google = parseGoogleRange(googleRange);
    const delta = test.hgt - google.midpoint;
    const percentError = (delta / google.midpoint) * 100;
    const withinRange = test.hgt >= google.min && test.hgt <= google.max;

    const timeOfDay = parseInt(test.time.split(':')[0]);
    const isPeakHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 16 && timeOfDay <= 18);

    console.log(`Test #${test.test}: ${test.origin} → ${test.venue} (${test.date} ${test.time})`);
    console.log(`   HGT: ${test.hgt} min | Google: ${google.min}-${google.max} min (midpoint: ${google.midpoint.toFixed(1)})`);
    console.log(`   Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(1)} min (${percentError > 0 ? '+' : ''}${percentError.toFixed(1)}%)`);
    console.log(`   Within Range: ${withinRange ? '✅' : '❌'} | Peak Hour: ${isPeakHour ? 'Yes' : 'No'}`);
    console.log('');

    return {
      ...test,
      google,
      delta,
      percentError,
      withinRange,
      isPeakHour,
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  if (results.length === 0) {
    console.log('\n⚠️  No Google Maps data available for analysis');
    console.log('\nPlease fill in scripts/google-maps-ranges.csv with the Google Maps time ranges.');
    return;
  }

  console.log('\n' + '='.repeat(100));
  console.log('📈 Pattern Analysis:\n');

  // Overall accuracy
  const avgDelta = results.reduce((sum, r) => sum + r.delta, 0) / results.length;
  const avgPercentError = results.reduce((sum, r) => sum + r.percentError, 0) / results.length;
  const withinRangeCount = results.filter(r => r.withinRange).length;
  const withinRangePercent = (withinRangeCount / results.length) * 100;

  console.log(`1️⃣  Overall Accuracy (n=${results.length}):`);
  console.log(`   Average Delta: ${avgDelta > 0 ? '+' : ''}${avgDelta.toFixed(1)} min (${avgPercentError > 0 ? '+' : ''}${avgPercentError.toFixed(1)}%)`);
  console.log(`   Within Google Range: ${withinRangeCount}/${results.length} (${withinRangePercent.toFixed(1)}%)`);
  console.log('');

  // Distance-based analysis
  const shortTrips = results.filter(r => r.distance < 30);
  const mediumTrips = results.filter(r => r.distance >= 30 && r.distance < 50);
  const longTrips = results.filter(r => r.distance >= 50);

  console.log(`2️⃣  Distance-Based Patterns:`);
  if (shortTrips.length > 0) {
    const avgShortDelta = shortTrips.reduce((sum, r) => sum + r.delta, 0) / shortTrips.length;
    console.log(`   Short trips (<30 mi): ${avgShortDelta > 0 ? '+' : ''}${avgShortDelta.toFixed(1)} min avg delta (n=${shortTrips.length})`);
  }
  if (mediumTrips.length > 0) {
    const avgMediumDelta = mediumTrips.reduce((sum, r) => sum + r.delta, 0) / mediumTrips.length;
    console.log(`   Medium trips (30-50 mi): ${avgMediumDelta > 0 ? '+' : ''}${avgMediumDelta.toFixed(1)} min avg delta (n=${mediumTrips.length})`);
  }
  if (longTrips.length > 0) {
    const avgLongDelta = longTrips.reduce((sum, r) => sum + r.delta, 0) / longTrips.length;
    console.log(`   Long trips (>50 mi): ${avgLongDelta > 0 ? '+' : ''}${avgLongDelta.toFixed(1)} min avg delta (n=${longTrips.length})`);
  }
  console.log('');

  // Time-of-day analysis
  const peakHourTrips = results.filter(r => r.isPeakHour);
  const offPeakTrips = results.filter(r => !r.isPeakHour);

  console.log(`3️⃣  Time-of-Day Patterns:`);
  if (peakHourTrips.length > 0) {
    const avgPeakDelta = peakHourTrips.reduce((sum, r) => sum + r.delta, 0) / peakHourTrips.length;
    console.log(`   Peak hours (7-9 AM, 4-6 PM): ${avgPeakDelta > 0 ? '+' : ''}${avgPeakDelta.toFixed(1)} min avg delta (n=${peakHourTrips.length})`);
  }
  if (offPeakTrips.length > 0) {
    const avgOffPeakDelta = offPeakTrips.reduce((sum, r) => sum + r.delta, 0) / offPeakTrips.length;
    console.log(`   Off-peak hours: ${avgOffPeakDelta > 0 ? '+' : ''}${avgOffPeakDelta.toFixed(1)} min avg delta (n=${offPeakTrips.length})`);
  }
  console.log('');

  // Origin-based analysis
  const byOrigin = {
    'El Segundo': results.filter(r => r.origin === 'El Segundo'),
    'Pasadena': results.filter(r => r.origin === 'Pasadena'),
    'NW LA': results.filter(r => r.origin === 'NW LA'),
  };

  console.log(`4️⃣  Origin-Based Patterns:`);
  Object.entries(byOrigin).forEach(([origin, trips]) => {
    if (trips.length > 0) {
      const avgDelta = trips.reduce((sum, r) => sum + r.delta, 0) / trips.length;
      const withinRangeCount = trips.filter(r => r.withinRange).length;
      console.log(`   ${origin}: ${avgDelta > 0 ? '+' : ''}${avgDelta.toFixed(1)} min avg delta, ${withinRangeCount}/${trips.length} within range`);
    }
  });
  console.log('');

  // Outliers (>15 min or >30% error)
  const outliers = results.filter(r => Math.abs(r.delta) > 15 || Math.abs(r.percentError) > 30);

  if (outliers.length > 0) {
    console.log(`5️⃣  Significant Outliers (>15 min or >30% error):`);
    outliers.forEach(r => {
      console.log(`   Test #${r.test}: ${r.origin} → ${r.venue}`);
      console.log(`      ${r.delta > 0 ? '+' : ''}${r.delta.toFixed(1)} min (${r.percentError > 0 ? '+' : ''}${r.percentError.toFixed(1)}%) | ${r.distance} mi | ${r.time}`);
    });
    console.log('');
  }

  // Recommendations
  console.log('\n' + '='.repeat(100));
  console.log('💡 Recommendations:\n');

  if (avgDelta > 5) {
    console.log(`⚠️  Systematic OVERESTIMATION detected (avg +${avgDelta.toFixed(1)} min)`);
    console.log(`   → Consider reducing buffer or adjusting traffic model`);
    console.log(`   → Current model uses future traffic predictions with pessimistic weighting`);
  } else if (avgDelta < -5) {
    console.log(`⚠️  Systematic UNDERESTIMATION detected (avg ${avgDelta.toFixed(1)} min)`);
    console.log(`   → Increase safety buffer or use more conservative traffic model`);
  } else {
    console.log(`✅ Overall accuracy is acceptable (avg ${avgDelta > 0 ? '+' : ''}${avgDelta.toFixed(1)} min)`);
  }

  if (withinRangePercent < 70) {
    console.log(`\n⚠️  Only ${withinRangePercent.toFixed(1)}% of estimates fall within Google's range`);
    console.log(`   → Investigate Routes API parameters and traffic model settings`);
  } else {
    console.log(`\n✅ ${withinRangePercent.toFixed(1)}% of estimates fall within Google's range (good accuracy)`);
  }

  if (outliers.length > 3) {
    console.log(`\n⚠️  ${outliers.length} significant outliers detected`);
    console.log(`   → Review these specific routes for data quality or edge cases`);
    outliers.forEach(r => {
      console.log(`      - Test #${r.test}: ${r.origin} → ${r.venue} (${r.delta > 0 ? '+' : ''}${r.delta.toFixed(1)} min)`);
    });
  }

  console.log('\n' + '='.repeat(100));
}

analyzePatterns();
