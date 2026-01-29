#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';
import { getSupabaseClient } from '../lib/venue/client';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkAliases() {
  const supabase = getSupabaseClient();

  // Get Toyota venue
  const { data: toyota } = await supabase
    .from('venues')
    .select('id, canonical_name')
    .eq('canonical_name', 'Toyota Sports Performance Center')
    .single();

  console.log('Toyota venue:', toyota);

  // Get aliases for Toyota
  const { data: toyotaAliases } = await supabase
    .from('venue_aliases')
    .select('alias_text')
    .eq('venue_id', toyota?.id);

  console.log('Toyota aliases:', toyotaAliases?.map(a => a.alias_text).join(', '));

  // Get LA Kings venue
  const { data: lakings } = await supabase
    .from('venues')
    .select('id, canonical_name')
    .eq('canonical_name', 'LA Kings Iceland')
    .single();

  console.log('\nLA Kings venue:', lakings);

  // Get aliases for LA Kings
  const { data: lakingsAliases } = await supabase
    .from('venue_aliases')
    .select('alias_text')
    .eq('venue_id', lakings?.id);

  console.log('LA Kings aliases:', lakingsAliases?.map(a => a.alias_text).join(', '));
}

checkAliases();
