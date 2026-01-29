/**
 * HockeyGoTime Benchmarking Script
 * Run this in the browser console (on the home page) to test performance.
 */

async function runBenchmark(numWindows = 4) {
    const query = "When do we need to leave for our next game";
    console.log(`🚀 Starting benchmark with ${numWindows} concurrent requests...`);

    const results = [];

    const promises = Array.from({ length: numWindows }).map(async (_, i) => {
        const startTime = Date.now();
        console.log(`[Window ${i}] Sending query...`);

        const win = window.open(window.location.href, `_blank_${i}`);

        return new Promise((resolve) => {
            const checkLoad = setInterval(() => {
                try {
                    if (win.document && win.document.readyState === 'complete') {
                        clearInterval(checkLoad);

                        // Find the textarea and submit button
                        const textarea = win.document.querySelector('textarea');
                        const submitBtn = win.document.querySelector('button[type="submit"]');

                        if (textarea && submitBtn) {
                            textarea.value = query;
                            // Trigger input event for React
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));

                            setTimeout(() => {
                                submitBtn.click();
                                console.log(`[Window ${i}] Submitted!`);

                                // Monitor for response completion
                                const observer = new MutationObserver((mutations) => {
                                    // Check if streaming is done
                                    const isDone = !win.document.querySelector('[role="status"]')?.textContent.includes("Thinking") &&
                                        !win.document.querySelector('.SlidingPuck');

                                    const messages = win.document.querySelectorAll('.ConversationContent > div');

                                    if (isDone && messages.length > 2) {
                                        const endTime = Date.now();
                                        const duration = endTime - startTime;
                                        console.log(`[Window ${i}] Completed in ${duration}ms`);
                                        results.push({ id: i, duration });
                                        observer.disconnect();
                                        resolve();
                                    }
                                });

                                observer.observe(win.document.body, { childList: true, subtree: true });
                            }, 500);
                        } else {
                            console.error(`[Window ${i}] Elements not found`);
                            resolve();
                        }
                    }
                } catch (e) {
                    // console.log(`[Window ${i}] Waiting for load...`);
                }
            }, 500);
        });
    });

    await Promise.all(promises);

    console.log("\n📊 Benchmark Results:");
    console.table(results);
    const avg = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
    console.log(`Average Response Time: ${avg.toFixed(2)}ms`);
}

console.log("Benchmarking script loaded. Run `runBenchmark(4)` to start.");
