/**
 * Cache Refresh API Endpoint
 *
 * POST /api/venue/refresh-cache
 * Forces immediate refresh of in-memory venue cache from Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshCache } from '@/lib/venue/cache';

export async function POST(request: NextRequest) {
  try {
    // Force cache refresh
    await refreshCache();

    // Get cache statistics
    // Note: We can't directly access the cache Map here, but refreshCache logs the count
    // For now, return success status
    return NextResponse.json({
      success: true,
      refreshed_at: new Date().toISOString(),
      message: 'Cache refreshed successfully. Check console logs for venue/alias counts.',
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh cache',
      },
      { status: 500 }
    );
  }
}
