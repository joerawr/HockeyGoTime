# Google Maps MCP Server Integration Plan

## Objective
Migrate Google Maps tooling from direct API usage (in `lib/travel`) to a dedicated Google Maps MCP Server. This aims to standardize tool access and potentially offload processing/improve caching strategies managed by the MCP server.

## Branch
`feature/google-maps-mcp`

## Tasks

### 1. MCP Client Creation
- [ ] Create `lib/mcp/client/google-maps-client.ts`.
  - Follow the `StreamableHTTPClientTransport` pattern used in `scaha-client.ts`.
  - Implement connection logic (HTTP or local command fallback if needed).
  - Define configuration types in `lib/mcp/client/google-maps-types.ts`.
- [ ] Export client from `lib/mcp/index.ts`.

### 2. Tool Integration
- [ ] Update `app/api/hockey-chat/route.ts` to use the new MCP client.
- [ ] Replace `calculate_travel_times` implementation.
  - Instead of calling `resolveVenue` + `calculateTravelTimes` locally, call the MCP tool (e.g., `google_maps_calculate_route`).
  - *Note:* Ensure the MCP tool supports the complex preference logic (prep time, arrival buffer) OR keep that logic in the route and only use the MCP for the raw API call.
    - *Decision:* Likely use MCP for the raw "Route/Matrix" call (replacing `lib/travel/time-calculator.ts`), but keep business logic in the app unless the MCP is highly specialized for this app.
    - *Revision:* If the user says "Switch to using the Google Maps MCP server instead of the API", it implies the MCP provides the mapping capabilities.
- [ ] Replace `calculate_venue_distances` implementation.

### 3. Configuration
- [ ] Add `GOOGLE_MAPS_MCP_URL` to environment variables.
- [ ] Ensure proper error handling if the MCP server is unreachable (fallback to direct API? or fail gracefully).

### 4. Testing & Performance
- [ ] Verify that travel time calculations remain accurate.
- [ ] Compare performance (latency) between Direct API and MCP Server approach.
- [ ] Monitor for bottlenecks introduced by the extra hop.

## dependencies
- A running instance of the Google Maps MCP Server (URL provided via env var).
