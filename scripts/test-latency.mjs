import { performance } from 'perf_hooks';

const API_URL = 'http://localhost:3000/api/hockey-chat';

async function testLatency() {
    console.log('🚀 Starting latency test against:', API_URL);

    const payload = {
        messages: [
            { role: 'user', content: 'When do we need to leave for our next game?' }
        ],
        preferences: { mcpServer: 'scaha' }
    };

    try {
        const start = performance.now();
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let firstTokenTime = 0;
        let hasReceivedToken = false;
        let chunks = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks++;
            if (!hasReceivedToken) {
                const text = decoder.decode(value, { stream: true });
                if (text.trim().length > 0) {
                    firstTokenTime = performance.now() - start;
                    hasReceivedToken = true;
                    console.log(`⏱️ TTFT: ${firstTokenTime.toFixed(2)}ms`);
                }
            }
        }
        const totalTime = performance.now() - start;
        console.log(`⏱️ Total Latency: ${totalTime.toFixed(2)}ms`);
        console.log(`📦 Total Chunks: ${chunks}`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.log('💡 Hint: Is the dev server running? (npm run dev)');
        }
    }
}

testLatency();
