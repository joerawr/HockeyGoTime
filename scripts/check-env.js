require('dotenv').config({ path: '.env.local' });
console.log('Key length:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 'undefined');
console.log('Key prefix:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 7) : 'undefined');
