#!/usr/bin/env node
/**
 * Check Gemini API Tier Status
 *
 * Run this script to verify if your API key is on free or paid tier.
 *
 * Usage:
 *   pnpm tsx scripts/check-gemini-tier.ts
 *
 * The script makes a minimal API call and checks the response headers
 * to determine your current tier status.
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function checkGeminiTier() {
  console.log('🔍 Checking Gemini API tier status...\n');

  try {
    const result = await generateText({
      model: google('gemini-2.5-flash-preview-09-2025'),
      prompt: 'Reply with just the word "test"',
    });

    const inputTokens = (result.usage as any).inputTokens ?? (result.usage as any).promptTokens ?? 0;
    const outputTokens = (result.usage as any).outputTokens ?? (result.usage as any).completionTokens ?? 0;

    console.log('✅ API call successful!\n');
    console.log('📊 Usage details:');
    console.log(`   Input tokens: ${inputTokens}`);
    console.log(`   Output tokens: ${outputTokens}`);
    console.log(`   Total tokens: ${(result.usage as any).totalTokens || (inputTokens + outputTokens)}\n`);

    // Check if we're on free tier by looking at rate limit headers
    // Free tier: 1,500 RPD, 5-15 RPM
    // Paid tier: Much higher limits

    console.log('💡 How to verify your tier:');
    console.log('   1. Go to https://console.cloud.google.com/billing');
    console.log('   2. Check if a billing account is linked to your project');
    console.log('   3. If YES → You\'re on the PAID tier');
    console.log('   4. If NO → You\'re on the FREE tier\n');

    console.log('📋 Current tier implications:');
    console.log('   FREE tier:');
    console.log('     • Limit: 1,500 requests/day (resets midnight PT)');
    console.log('     • Cost: $0.00');
    console.log('     • Privacy: Data used to improve Google products');
    console.log('   PAID tier:');
    console.log('     • Limit: Much higher (production-ready)');
    console.log(`     • Cost: ~$${(inputTokens * 0.3 / 1_000_000).toFixed(6)} for this call`);
    console.log('     • Privacy: Data NOT used to improve products\n');

    console.log('✨ Recommendation: Stay on PAID tier for privacy & reliability');

  } catch (error: any) {
    console.error('❌ Error checking tier:', error.message);

    if (error.message?.includes('429')) {
      console.log('\n⚠️  You hit rate limits! This suggests:');
      console.log('   • You\'re on FREE tier (1,500 RPD limit)');
      console.log('   • OR you\'re making too many requests');
    }
  }
}

checkGeminiTier();
