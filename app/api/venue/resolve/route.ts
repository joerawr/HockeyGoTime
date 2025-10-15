/**
 * Venue Resolution API Endpoint
 *
 * POST /api/venue/resolve
 * Resolves venue names to canonical addresses from in-memory cache.
 *
 * Privacy: Does NOT log venue_name (FR-016 compliance)
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveVenue } from '@/lib/venue/resolver';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { venue_name } = body;

    // Validate required fields
    if (!venue_name) {
      return NextResponse.json(
        { error: 'Missing required field: venue_name' },
        { status: 400 }
      );
    }

    // Resolve venue
    const venue = await resolveVenue(venue_name);

    // Return result (venue or null)
    return NextResponse.json({ venue });
  } catch (error) {
    console.error('Error resolving venue:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to resolve venue',
      },
      { status: 500 }
    );
  }
}
