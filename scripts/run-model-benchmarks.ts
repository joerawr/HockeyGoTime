import { spawn, execSync } from 'child_process';
import * as fs from 'fs';

const MODELS = [
  'google/gemini-3-flash-preview:nitro', // Baseline verification
  'anthropic/claude-3-haiku:nitro',
  'anthropic/claude-3.5-haiku:nitro',
  'openai/gpt-4o-mini:nitro',
  'meta-llama/llama-4-scout:nitro'
];

const BENCHMARK_SCRIPT = 'npx tsx scripts/benchmark-chat.ts';
const SERVER_CMD = 'pnpm dev';
const REPORT_FILE = 'Model_Benchmark_Report.md';

interface RunResult {
  scenario: string;
  duration: number;
  passed: boolean;
}

interface ModelResult {
  model: string;
  runs: RunResult[][];
}

async function main() {
  console.log('🚀 Starting Model Benchmarks...');
  const results: ModelResult[] = [];

  for (const model of MODELS) {
    console.log(`\n=========================================`);
    console.log(`🤖 Testing Model: ${model}`);
    console.log(`=========================================`);

    // Clean up any stray processes first
    try { execSync("pkill -f 'next-server' || true"); } catch(e) {}
    try { execSync("pkill -f 'next dev' || true"); } catch(e) {}
    
    const safeModelName = model.replace(/[^a-zA-Z0-9]/g, '_');
    const logFile = fs.openSync(`server_${safeModelName}.log`, 'w');

    // Start Server with specific model
    console.log('Starting server...');
    const serverProcess = spawn(SERVER_CMD, {
      shell: true,
      env: { ...process.env, OPENROUTER_MODEL: model },
      stdio: ['ignore', logFile, logFile], // Capture output to file
      detached: true // Allow killing the process group
    });

    // Wait for server to be ready
    console.log('Waiting for server to boot (20s)...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    const modelRuns: RunResult[][] = [];

    for (let i = 1; i <= 3; i++) {
      console.log(`\n🏃 Run ${i}/3...`);
      try {
        const output = execSync(BENCHMARK_SCRIPT, { encoding: 'utf-8' });
        
        // Robust JSON parsing: Find the last line that looks like a JSON array
        const lines = output.trim().split('\n');
        let runData: RunResult[] | null = null;
        
        for (let j = lines.length - 1; j >= 0; j--) {
            try {
                if (lines[j].trim().startsWith('[')) {
                    runData = JSON.parse(lines[j]);
                    break;
                }
            } catch (e) {}
        }
        
        if (runData) {
          modelRuns.push(runData);
          console.log(`   ✅ Run ${i} completed.`);
          runData.forEach(r => {
             console.log(`      - ${r.scenario}: ${r.duration.toFixed(0)}ms [${r.passed ? 'PASS' : 'FAIL'}]`);
          });
        } else {
          console.error(`   ❌ Failed to parse benchmark output for Run ${i}`);
          console.error(`   Last 5 lines:`, lines.slice(-5));
        }

      } catch (error) {
        console.error(`   ❌ Run ${i} failed execution:`, error);
      }
      
      // Small cooldown
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    results.push({ model, runs: modelRuns });

    // Kill server
    console.log('Stopping server...');
    try {
        if (serverProcess.pid) process.kill(-serverProcess.pid);
    } catch(e) {}
    
    // Ensure it's dead
    try { execSync("pkill -f 'next-server' || true"); } catch(e) {}
    
    fs.closeSync(logFile);
    // Cleanup
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  generateReport(results);
}

function generateReport(results: ModelResult[]) {
  let markdown = '# Model Benchmark Report\n\n';
  
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;

  // Aggregate Table
  markdown += '## Aggregate Performance (Avg Duration)\n\n';
  markdown += '| Model | Cold Start | Warm Cache | Context Retention | Reasoning | Recall | Overall Pass Rate |\n';
  markdown += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

  for (const res of results) {
    let totalPass = 0;
    let totalTests = 0;
    const avgs: Record<string, number> = {};

    // Get list of unique scenarios encountered
    const scenarios = Array.from(new Set(res.runs.flat().map(r => r.scenario)));
    
    for (const scenario of scenarios) {
      let sum = 0;
      let count = 0;
      for (const run of res.runs) {
        const item = run.find(r => r.scenario === scenario);
        if (item) {
            if (item.duration > 0) {
                sum += item.duration;
                count++;
            }
            if (item.passed) totalPass++;
            totalTests++;
        }
      }
      avgs[scenario] = count > 0 ? sum / count : 0;
    }

    const passRate = totalTests > 0 ? Math.round((totalPass / totalTests) * 100) : 0;

    // Map specific scenarios to columns (hardcoded for order)
    const fmt = (val: number) => val > 0 ? (val / 1000).toFixed(2) + 's' : 'N/A';
    
    const cold = fmt(avgs['Cold Start - Schedule & Travel'] || 0);
    const warm = fmt(avgs['Warm Cache - Schedule & Travel'] || 0);
    const context = fmt(avgs['Context Retention'] || 0);
    const reasoning = fmt(avgs['Reasoning - Stats'] || 0);
    const recall = fmt(avgs['Long Context Recall'] || 0);

    markdown += `| **${res.model}** | ${cold} | ${warm} | ${context} | ${reasoning} | ${recall} | ${passRate}% |\n`;
  }

  // Detailed Pass/Fail
  markdown += '\n## Pass/Fail Analysis\n\n';
  for (const res of results) {
      markdown += `### ${res.model}\n`;
      const runs = res.runs;
      if (runs.length === 0) {
          markdown += "No successful runs.\n";
          continue;
      }
      
      const scenarios = Array.from(new Set(runs.flat().map(r => r.scenario)));
      
      for (const scen of scenarios) {
          const passCount = runs.filter(r => r.find(i => i.scenario === scen)?.passed).length;
          const status = passCount === 3 ? '✅ PASS' : passCount === 0 ? '❌ FAIL' : '⚠️ UNSTABLE';
          markdown += `- **${scen}**: ${status} (${passCount}/3 runs passed)\n`;
      }
      markdown += '\n';
  }

  fs.writeFileSync(REPORT_FILE, markdown);
  console.log(`\n📄 Report generated: ${REPORT_FILE}`);
}

main().catch(console.error);