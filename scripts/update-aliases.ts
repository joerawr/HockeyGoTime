#!/usr/bin/env tsx
/**
 * Update Venue Aliases Script
 *
 * Adds new aliases and removes overly generic ones
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getSupabaseClient } from '../lib/venue/client';

// Load .env.local (Next.js convention)
config({ path: resolve(process.cwd(), '.env.local') });

async function updateAliases() {
  console.log('📝 Updating venue aliases...\n');

  const supabase = getSupabaseClient();

  // Step 1: Remove problematic aliases
  const aliasesToRemove = [
    'El Segundo Ice',
    'Kings Ice',
    'LA Kings Ice',
    'Ice Palace'
  ];

  console.log('🗑️  Removing generic/incorrect aliases...');
  for (const aliasText of aliasesToRemove) {
    const { error } = await supabase
      .from('venue_aliases')
      .delete()
      .eq('alias_text', aliasText);

    if (error) {
      console.warn(`⚠️  Failed to remove "${aliasText}": ${error.message}`);
    } else {
      console.log(`✅ Removed: "${aliasText}"`);
    }
  }

  console.log('\n➕ Adding new aliases...');

  // Step 2: Add new aliases
  // Need to map alias text to canonical venue name
  const newAliases = [
    { canonical: 'Aliso Viejo Ice', alias: 'Aliso Viejo' },
    { canonical: 'Dublin Iceland', alias: 'Dublin' },
    { canonical: 'LA Kings Iceland', alias: 'Paramount' },
    { canonical: 'Toyota Sports Performance Center', alias: 'El Segundo' },
    { canonical: 'KHS Ice Arena', alias: 'KHS' },
    { canonical: 'Great Park Ice & Fivepoint Arena', alias: 'Great Park' },
    { canonical: 'The Cube Santa Clarita', alias: 'Valencia' },
    { canonical: 'Oak Park Ice Rink', alias: 'Oak Park' },
    { canonical: 'Yorba Linda ICE', alias: 'Yorba' },
    { canonical: 'Yorba Linda ICE', alias: 'Yorba Linda' },
    { canonical: 'Lakewood ICE', alias: 'Lakewood' },
    { canonical: 'Lake Forest Ice Palace', alias: 'Lake Forest' },
    { canonical: 'Anaheim ICE', alias: 'Anaheim' },
    { canonical: 'Vacaville Ice Sports', alias: 'Vacaville' },
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const { canonical, alias } of newAliases) {
    // First, get the venue_id by canonical name
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id')
      .eq('canonical_name', canonical)
      .single();

    if (venueError || !venue) {
      console.warn(`⚠️  Venue not found: "${canonical}"`);
      skippedCount++;
      continue;
    }

    // Then insert the alias (upsert to avoid duplicates)
    const { error: aliasError } = await supabase
      .from('venue_aliases')
      .upsert(
        {
          venue_id: venue.id,
          alias_text: alias,
        },
        { onConflict: 'venue_id,alias_text' }
      );

    if (aliasError) {
      console.warn(`⚠️  Failed to add "${alias}": ${aliasError.message}`);
      skippedCount++;
    } else {
      console.log(`✅ Added: "${alias}" → ${canonical}`);
      addedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Removed: ${aliasesToRemove.length} aliases`);
  console.log(`   Added: ${addedCount} aliases`);
  if (skippedCount > 0) {
    console.log(`   Skipped: ${skippedCount} (errors or not found)`);
  }
  console.log('\n✅ Alias update complete!');
}

updateAliases().catch((error) => {
  console.error('❌ Fatal error during alias update:', error);
  process.exit(1);
});
