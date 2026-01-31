import { performance } from 'perf_hooks';

const BASE_URL = 'http://127.0.0.1:3000/api/hockey-chat';

const DEFAULT_PREFERENCES = {
  team: "Jr. Kings (1)",
  division: "14U B",
  season: "2025-26",
  homeAddress: "5555 Main St, Anaheim, CA",
  mcpServer: "scaha"
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  preferences: typeof DEFAULT_PREFERENCES;
}

const FACTS = {
  schedule: {
    required: [/Empire/i],
    optional: [/(Ontario|Plum)/i, /10:30/]
  },
  travel: {
    required: [/(8:30|08:30|8:00|08:00)/], // Leave or Wake up time
    optional: [/59 min|1 hour/i]
  },
  opponent: {
    required: [/Empire/i]
  },
  stats: {
    required: [/(Jesse|Sackaroff)/i, /(Neomi|Rogers)/i, /(Peter|Carr)/i]
  },
  recall: {
    required: [/(next game|leave)/i]
  }
};

async function runBenchmark() {
  // console.log('🚀 Starting HockeyGoTime Benchmark...');
  const history: Message[] = [];
  const results: any[] = [];

  const scenarios = [
    {
      id: 'cold_start',
      name: 'Cold Start - Schedule & Travel',
      question: 'When do we need to leave for our next game?',
      validate: (text: string) => checkFacts(text, [...FACTS.schedule.required, ...FACTS.travel.required])
    },
    {
      id: 'warm_cache',
      name: 'Warm Cache - Schedule & Travel',
      question: 'When do we need to leave for our next game?',
      validate: (text: string) => checkFacts(text, [...FACTS.schedule.required, ...FACTS.travel.required])
    },
    {
      id: 'context_retention',
      name: 'Context Retention',
      question: 'Who do we play?',
      validate: (text: string) => checkFacts(text, FACTS.opponent.required)
    },
    {
      id: 'reasoning_stats',
      name: 'Reasoning - Stats',
      question: 'Top 5 in points on our team?',
      validate: (text: string) => checkFacts(text, FACTS.stats.required)
    },
    {
      id: 'long_recall',
      name: 'Long Context Recall',
      question: 'What was the first thing I asked you?',
      validate: (text: string) => checkFacts(text, FACTS.recall.required)
    }
  ];

  for (const scenario of scenarios) {
    const userMsg: Message = { role: 'user', content: scenario.question };
    history.push(userMsg);

    const payload: ChatRequest = {
      messages: history,
      preferences: DEFAULT_PREFERENCES
    };

    const start = performance.now();
    let duration = 0;
    let passed = false;
    let responseText = "";

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      responseText = await response.text();
      duration = performance.now() - start;
      passed = scenario.validate(responseText);

      // Append assistant response to history (approximated for next turn)
      // We clean the response a bit to avoid polluting context with raw stream data if it's messy
      // But usually text() gets the full thing.
      history.push({ role: 'assistant', content: responseText });

    } catch (error) {
      console.error(`❌ Error in ${scenario.name}:`, error);
      duration = -1;
    }
    
    results.push({
      scenario: scenario.name,
      duration: Number(duration.toFixed(2)),
      passed,
      // responseSample: responseText.substring(0, 50)
    });

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Output JSON for the master script to parse
  console.log(JSON.stringify(results));
}

function checkFacts(text: string, patterns: RegExp[]): boolean {
  // Check if ALL required patterns are present
  return patterns.every(pattern => pattern.test(text));
}

runBenchmark();