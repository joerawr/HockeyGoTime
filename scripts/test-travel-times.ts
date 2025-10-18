/**
 * Travel Time Test Script
 * Tests all 27 route combinations (3 origins × 9 games)
 * Outputs HGT estimates for manual comparison with Google Maps
 */

import { calculateTravelTimes } from '@/lib/travel/time-calculator';
import type { Game } from '@/types/schedule';
import type { UserPreferences } from '@/types/preferences';

// Test origins
const origins = [
  { name: 'El Segundo', address: '555 Nash St, El Segundo, CA 90245' },
  { name: 'Pasadena', address: '1166 E Mountain St, Pasadena, CA 91104' },
  { name: 'NW LA', address: '2769 Casiano Rd, Los Angeles, CA 90077' },
];

// Games with venue addresses
const games: Array<Game & { venueAddress: string }> = [
  {
    id: '1',
    date: '2025-10-19',
    time: '08:40:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Ice Realm',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '13071 Springdale St, Westminster, CA 92683',
  },
  {
    id: '2',
    date: '2025-11-02',
    time: '08:45:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Ontario Center Ice',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '201 S Plum Ave, Ontario, CA 91761',
  },
  {
    id: '3',
    date: '2025-11-09',
    time: '17:00:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'YorbaLinda ICE',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '23641 La Palma Ave, Yorba Linda, CA 92887',
  },
  {
    id: '4',
    date: '2025-11-23',
    time: '08:45:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Lake Forest IP',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '25821 Atlantic Ocean Dr, Lake Forest, CA 92630',
  },
  {
    id: '5',
    date: '2025-12-14',
    time: '08:45:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Paramount Ice Land',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '8041 Jackson St, Paramount, CA 90723',
  },
  {
    id: '6',
    date: '2025-12-21',
    time: '12:00:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Ice Realm',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '13071 Springdale St, Westminster, CA 92683',
  },
  {
    id: '7',
    date: '2026-01-11',
    time: '12:15:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Valley Center Ice',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '8750 Van Nuys Blvd, Panorama City, CA 91402',
  },
  {
    id: '8',
    date: '2026-01-25',
    time: '16:15:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Paramount Ice Land',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '8041 Jackson St, Paramount, CA 90723',
  },
  {
    id: '9',
    date: '2026-02-01',
    time: '10:30:00',
    timezone: 'America/Los_Angeles',
    homeTeam: 'TBD',
    awayTeam: 'Jr Kings',
    homeJersey: 'Dark',
    awayJersey: 'White',
    venue: 'Ontario Center Ice',
    rink: '1',
    season: '2025/26',
    division: '14U B',
    gameType: 'Regular Season',
    venueAddress: '201 S Plum Ave, Ontario, CA 91761',
  },
];

// Standard test preferences (60 min buffer, 30 min prep)
const basePreferences: Omit<UserPreferences, 'homeAddress'> = {
  mcpServer: 'scaha',
  team: 'Jr Kings',
  division: '14U B',
  season: '2025/26',
  prepTimeMinutes: 30,
  arrivalBufferMinutes: 60,
};

async function runTests() {
  console.log('🧪 Travel Time Test Matrix');
  console.log('=' .repeat(80));
  console.log('Testing 3 origins × 9 games = 27 routes\n');

  let testNumber = 1;

  for (const game of games) {
    console.log(`\n📍 Game ${games.indexOf(game) + 1}: ${game.venue} - ${game.date} ${game.time}`);
    console.log(`   Destination: ${game.venueAddress}`);
    console.log('-'.repeat(80));

    for (const origin of origins) {
      const preferences: UserPreferences = {
        ...basePreferences,
        homeAddress: origin.address,
      };

      try {
        const result = await calculateTravelTimes(game, preferences, {
          venueAddress: game.venueAddress,
        });

        const travelMinutes = Math.round(result.travelDurationSeconds / 60);
        const distanceMiles = Math.round(result.distanceMeters * 0.000621371);

        console.log(`\n   Test #${testNumber}: ${origin.name}`);
        console.log(`   Origin: ${origin.address}`);
        console.log(`   HGT Travel Time: ${travelMinutes} min (${distanceMiles} mi)`);
        console.log(`   Google Maps: ___ min (compare manually)`);
        console.log(`   Difference: ___`);

        if (result.isEstimated) {
          console.log(`   ⚠️  ESTIMATED (API fallback)`);
        }
      } catch (error) {
        console.error(`\n   Test #${testNumber}: ${origin.name}`);
        console.error(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
      }

      testNumber++;
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📋 MANUAL COMPARISON INSTRUCTIONS:');
  console.log('='.repeat(80));
  console.log('For each test above:');
  console.log('1. Open Google Maps');
  console.log('2. Enter the Origin address');
  console.log('3. Enter the Destination address');
  console.log('4. Click "Arrive by" and set to the game time');
  console.log('5. Note the travel time range (e.g., "35-50 min")');
  console.log('6. Calculate difference: HGT time - Google midpoint');
  console.log('\nLook for patterns:');
  console.log('- Systematic over/under estimation');
  console.log('- Distance-based errors');
  console.log('- Time-of-day patterns');
  console.log('- Directional biases\n');
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
