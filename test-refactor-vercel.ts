import { performance } from 'perf_hooks';

const REFACTOR_URL = "https://scaha-mcp-git-refactor-to-playwright-joe-rogers-projects.vercel.app/api/mcp";

async function run() {
  console.log(`🚀 Testing Refactor Vercel Deployment: ${REFACTOR_URL}`);
  
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "get_schedule",
      arguments: {
        season: "2025/26",
        schedule: "14U B",
        team: "Jr. Kings (1)"
      }
    }
  };

  const start = performance.now();
  
  try {
    const response = await fetch(REFACTOR_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    const duration = (performance.now() - start) / 1000;

    const lines = text.split('\n');
    const dataLine = lines.find(line => line.startsWith('data: '));
    
    if (!dataLine) {
      console.error("❌ Invalid response:", text.substring(0, 100));
      return;
    }

    const data = JSON.parse(dataLine.substring(6));

    if (data.error) {
      console.error("❌ MCP Error:", data.error);
    } else {
      const content = JSON.parse(data.result.content[0].text);
      console.log(`✅ Success! Received ${content.length} games`);
      console.log(`⏱️ Refactor Duration: ${duration.toFixed(2)}s`);
    }
  } catch (error) {
    console.error("❌ Network Error:", error);
  }
}

run();
