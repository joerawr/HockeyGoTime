#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';
import { getVenuesFromCache } from '../lib/venue/cache';

config({ path: resolve(process.cwd(), '.env.local') });

async function debugCache() {
  const cache = await getVenuesFromCache();

  console.log(`Total cache entries: ${cache.size}\n`);

  // Find all keys containing "el segundo"
  console.log('Keys containing "el segundo":');
  for (const [key, venue] of cache.entries()) {
    if (key.includes('el segundo')) {
      console.log(`  - "${key}" → ${venue.canonical_name}`);
    }
  }

  // Check exact match
  const exact = cache.get('el segundo');
  console.log(`\nExact match for "el segundo": ${exact ? exact.canonical_name : 'NOT FOUND'}`);
}

debugCache();
