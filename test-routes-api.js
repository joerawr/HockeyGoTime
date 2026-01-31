#!/usr/bin/env node

const API_KEY = "AIzaSyAcaXHKjxkU5doLWBr8eF8zlXH4F8RKj7A";
const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const HOME_ADDRESS = "17516 Patronella Ave Torrance, CA 90504";

// Test venues from 14A schedule (varied locations across SoCal)
const TEST_VENUES = [
    { name: "Paramount Ice Land", address: "8041 Jackson St, Paramount, CA 90723" },
    { name: "Carlsbad Ice Center", address: "2940 Roosevelt St, Carlsbad, CA 92008" }, // Far south
    { name: "Anaheim ICE", address: "300 W Lincoln Ave, Anaheim, CA 92805" },
    { name: "Lake Forest IP", address: "23740 El Toro Rd, Lake Forest, CA 92630" },
    { name: "Poway Ice Arena", address: "13445 Community Rd, Poway, CA 92064" }, // Far south
    { name: "Toyota Sports Center", address: "555 N Nash St, El Segundo, CA 90245" }, // Close
];

async function testRoute(destination, departureTime, trafficModel = 'BEST_GUESS') {
    const requestBody = {
        origin: { address: HOME_ADDRESS },
        destination: { address: destination.address },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        trafficModel,
        computeAlternativeRoutes: false,
        departureTime: departureTime.toISOString(),
        languageCode: 'en-US',
        units: 'IMPERIAL',
    };

    const startTime = Date.now();

    const response = await fetch(ROUTES_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
            'X-Goog-Api-Key': API_KEY,
        },
        body: JSON.stringify(requestBody),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    const route = data.routes[0];
    const durationSeconds = parseInt(route.duration.replace('s', ''));
    const durationMinutes = Math.round(durationSeconds / 60);
    const distanceMiles = Math.round(route.distanceMeters / 1609.344 * 10) / 10;

    return {
        apiLatency: elapsed,
        durationMinutes,
        distanceMiles,
    };
}

async function runTests() {
    console.log('Testing Google Routes API Performance\n');
    console.log(`Origin: ${HOME_ADDRESS}\n`);

    // Test afternoon departure (3 PM) for varied traffic
    const afternoonDeparture = new Date();
    afternoonDeparture.setHours(15, 0, 0, 0);

    console.log(`Departure Time: ${afternoonDeparture.toLocaleString()}\n`);
    console.log('='.repeat(80));

    for (const venue of TEST_VENUES) {
        console.log(`\n${venue.name}`);
        console.log('-'.repeat(80));

        try {
            // Test all three traffic models
            const [optimistic, bestGuess, pessimistic] = await Promise.all([
                testRoute(venue, afternoonDeparture, 'OPTIMISTIC'),
                testRoute(venue, afternoonDeparture, 'BEST_GUESS'),
                testRoute(venue, afternoonDeparture, 'PESSIMISTIC'),
            ]);

            const avgLatency = Math.round((optimistic.apiLatency + bestGuess.apiLatency + pessimistic.apiLatency) / 3);
            const timeRange = `${optimistic.durationMinutes}-${pessimistic.durationMinutes} min`;
            const variation = pessimistic.durationMinutes - optimistic.durationMinutes;

            console.log(`  Distance:        ${bestGuess.distanceMiles} miles`);
            console.log(`  Time Range:      ${timeRange} (${variation} min variation)`);
            console.log(`  Best Guess:      ${bestGuess.durationMinutes} min`);
            console.log(`  API Latency:     ${avgLatency}ms (avg of 3 calls)`);
            console.log(`  Total Time:      ${optimistic.apiLatency + bestGuess.apiLatency + pessimistic.apiLatency}ms (3 parallel calls)`);

        } catch (error) {
            console.log(`  ERROR: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nSummary:');
    console.log('- Each venue requires 3 API calls (OPTIMISTIC, BEST_GUESS, PESSIMISTIC)');
    console.log('- Current implementation makes 4 calls total (2x BEST_GUESS + 1x OPTIMISTIC + 1x PESSIMISTIC)');
    console.log('- API latency varies by distance/complexity but averages 1-3 seconds per call');
    console.log('- Traffic variation is significant in LA (can be 10-20+ min difference)');
}

runTests().catch(console.error);
