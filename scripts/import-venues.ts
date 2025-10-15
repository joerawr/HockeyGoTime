#!/usr/bin/env tsx
/**
 * Venue Import Script
 *
 * Imports venues from CSV file into Supabase database.
 * Usage: pnpm tsx scripts/import-venues.ts <csv-file-path>
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { getSupabaseClient } from '../lib/venue/client';

// Load .env.local (Next.js convention)
config({ path: resolve(process.cwd(), '.env.local') });

type VenueRow = {
  canonical_name: string;
  address: string;
  place_id: string;
  aliases?: string;
};

async function importVenues(csvPath: string) {
  console.log(`📥 Importing venues from ${csvPath}...`);

  // Read and parse CSV
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as VenueRow[];

  console.log(`Found ${records.length} venues to import`);

  const supabase = getSupabaseClient();
  let venueCount = 0;
  let aliasCount = 0;
  let errorCount = 0;

  for (const row of records) {
    try {
      // Validate required fields
      if (!row.canonical_name || !row.address || !row.place_id) {
        console.warn(
          `⚠️  Skipped row: Missing required fields (canonical_name, address, or place_id)`
        );
        errorCount++;
        continue;
      }

      // Insert or update venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .upsert(
          {
            canonical_name: row.canonical_name,
            address: row.address,
            place_id: row.place_id,
          },
          { onConflict: 'canonical_name' }
        )
        .select()
        .single();

      if (venueError) {
        console.warn(
          `⚠️  Skipped ${row.canonical_name}: ${venueError.message}`
        );
        errorCount++;
        continue;
      }

      venueCount++;
      let venueAliasCount = 0;

      // Insert aliases if present
      if (row.aliases && row.aliases.trim()) {
        const aliases = row.aliases
          .split('|')
          .map((a: string) => a.trim())
          .filter((a: string) => a.length > 0);

        for (const aliasText of aliases) {
          const { error: aliasError } = await supabase
            .from('venue_aliases')
            .upsert(
              {
                venue_id: venue.id,
                alias_text: aliasText,
              },
              { onConflict: 'venue_id,alias_text' }
            );

          if (aliasError) {
            console.warn(
              `⚠️  Skipped alias "${aliasText}": ${aliasError.message}`
            );
          } else {
            venueAliasCount++;
            aliasCount++;
          }
        }
      }

      console.log(
        `✅ Imported ${row.canonical_name} (${venueAliasCount} aliases)`
      );
    } catch (error) {
      console.error(`❌ Error processing row:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   Venues imported: ${venueCount}`);
  console.log(`   Aliases imported: ${aliasCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  console.log('\n✅ Import complete!');
}

// Main execution
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('❌ Error: No CSV file specified');
  console.error('Usage: pnpm tsx scripts/import-venues.ts <csv-file-path>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Error: File not found: ${csvPath}`);
  process.exit(1);
}

importVenues(csvPath).catch((error) => {
  console.error('❌ Fatal error during import:', error);
  process.exit(1);
});
