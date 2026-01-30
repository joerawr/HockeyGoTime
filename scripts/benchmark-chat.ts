import { performance } from 'perf_hooks';

const BASE_URL = 'http://127.0.0.1:3000/api/hockey-chat';

const DEFAULT_PREFERENCES = {
  team: "Jr. Kings (1)",
  division: "14U B",
  season: "2025-26",
  homeAddress: "5555 Main St, Anaheim, CA", // Dummy address for travel calcs
  mcpServer: "scaha"
};

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  preferences: typeof DEFAULT_PREFERENCES;
}

async function runBenchmark() {
  console.log('🚀 Starting HockeyGoTime Benchmark...');
  console.log(`Target: ${BASE_URL}\n`);

  const history: Message[] = [];

  const scenarios = [
    {
      name: 'Cold Start - Schedule & Travel',
      question: 'When do we need to leave for our next game?',
      expectedType: 'tool_call' // Just for info
    },
    {
      name: 'Warm Cache - Schedule & Travel',
      question: 'When do we need to leave for our next game?',
      expectedType: 'cache_hit'
    },
    {
      name: 'Context Retention',
      question: 'Who do we play?',
      expectedType: 'llm_only'
    },
    {
      name: 'Reasoning - Stats',
      question: 'Top 5 in points on our team?',
      expectedType: 'tool_call'
    },
    {
      name: 'Long Context Recall',
      question: 'What was the first thing I asked you?',
      expectedType: 'llm_only'
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`);
    console.log(`❓ Question: "${scenario.question}"`);

    // Add user message to history
    const userMsg: Message = { 
      role: 'user', 
      content: scenario.question,
      id: Math.random().toString(36).substring(7)
    };
    history.push(userMsg);

    const payload: ChatRequest = {
      messages: history,
      preferences: DEFAULT_PREFERENCES
    };

    const start = performance.now();
    
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      // The response is a stream. We need to read it to measure full duration.
      // For simple benchmarking, we'll read the text.
      const text = await response.text();
      const duration = performance.now() - start;

      console.log(`⏱️ Duration: ${duration.toFixed(2)}ms`);
      // console.log(`📝 Response length: ${text.length} chars`); 
      // console.log(`Response Preview: ${text.substring(0, 100)}...`);

      // Extract assistant response to add to history for next turn
      // Note: The actual API returns a stream format (AI SDK).
      // Parsing it accurately is complex without the client SDK.
      // For context retention, we'll mock the assistant response or try to extract simple text.
      // The AI SDK stream format usually contains parts. 
      // For this benchmark, we heavily rely on the SERVER side logs for internal breakdown.
      // We will just append a placeholder assistant message to keep history length growing,
      // or try to extract the text content if possible.
      
      // Simple extraction attempt (very naive for Vercel AI SDK streams)
      // In a real app, the client SDK reconstructs the message.
      // We'll just append a generic response to the history so the LLM knows it answered.
      const assistantMsg: Message = {
        role: 'assistant',
        content: "I've answered your question.", // Placeholder to simulate turn-taking
        id: Math.random().toString(36).substring(7)
      };
      history.push(assistantMsg);

    } catch (error) {
      console.error(`❌ Error in scenario "${scenario.name}":`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Benchmark Complete.');
}

runBenchmark();
