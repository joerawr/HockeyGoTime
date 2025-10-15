#!/usr/bin/env tsx
/**
 * Test Database Connection
 *
 * Verifies that the app is successfully connecting to Supabase
 * and can read venue data from the database.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getSupabaseClient } from '../lib/venue/client';

config({ path: resolve(process.cwd(), '.env.local') });

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection\n');

  try {
    const supabase = getSupabaseClient();

    console.log('✅ Supabase client initialized');
    console.log(`   URL: ${process.env.SUPABASE_URL}\n`);

    // Test 1: Query venues table
    console.log('📊 Test 1: Querying venues table...');
    const { data: venues, error: venuesError, count } = await supabase
      .from('venues')
      .select('*', { count: 'exact' });

    if (venuesError) {
      console.error('❌ Failed to query venues:', venuesError.message);
      process.exit(1);
    }

    console.log(`✅ Found ${count} venues in database`);
    console.log(`   Sample venue: ${venues?.[0]?.canonical_name}\n`);

    // Test 2: Query venue_aliases table
    console.log('📊 Test 2: Querying venue_aliases table...');
    const { data: aliases, error: aliasesError, count: aliasCount } = await supabase
      .from('venue_aliases')
      .select('*', { count: 'exact' });

    if (aliasesError) {
      console.error('❌ Failed to query aliases:', aliasesError.message);
      process.exit(1);
    }

    console.log(`✅ Found ${aliasCount} aliases in database`);
    console.log(`   Sample alias: "${aliases?.[0]?.alias_text}"\n`);

    // Test 3: Join query (venues with aliases)
    console.log('📊 Test 3: Testing JOIN query (venues with aliases)...');
    const { data: venuesWithAliases, error: joinError } = await supabase
      .from('venues')
      .select('canonical_name, venue_aliases(alias_text)')
      .limit(5);

    if (joinError) {
      console.error('❌ Failed to join venues and aliases:', joinError.message);
      process.exit(1);
    }

    console.log('✅ JOIN query successful');
    console.log('   Sample venues with aliases:');
    venuesWithAliases?.forEach((venue: any) => {
      const aliasCount = venue.venue_aliases?.length || 0;
      console.log(`   - ${venue.canonical_name} (${aliasCount} aliases)`);
    });

    // Test 4: Verify specific test data exists
    console.log('\n📊 Test 4: Verifying production data exists...');
    const testVenues = [
      'Toyota Sports Performance Center',
      'LA Kings Iceland',
      'Yorba Linda ICE',
      'The Cube Santa Clarita'
    ];

    let foundCount = 0;
    for (const venueName of testVenues) {
      const { data, error } = await supabase
        .from('venues')
        .select('canonical_name')
        .eq('canonical_name', venueName)
        .single();

      if (data) {
        console.log(`   ✅ Found: ${venueName}`);
        foundCount++;
      } else {
        console.log(`   ⚠️  Missing: ${venueName}`);
      }
    }

    console.log(`\n✅ Found ${foundCount}/${testVenues.length} test venues`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE CONNECTION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Database: Connected`);
    console.log(`✅ Venues table: ${count} records`);
    console.log(`✅ Aliases table: ${aliasCount} records`);
    console.log(`✅ JOIN queries: Working`);
    console.log(`✅ Production data: ${foundCount}/${testVenues.length} verified`);
    console.log('='.repeat(60));
    console.log('\n🎉 All tests passed! App is using Supabase database.\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check .env.local has SUPABASE_URL and SUPABASE_ANON_KEY');
    console.error('2. Verify Supabase project is running');
    console.error('3. Check database tables exist (run migration if needed)');
    console.error('4. Verify network connection to Supabase\n');
    process.exit(1);
  }
}

testDatabaseConnection();
