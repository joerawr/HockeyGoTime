const { convertToCoreMessages } = require('ai');

const content = 'When do we need to leave for our next game?';
const messages = [
    {
        id: '1',
        role: 'user',
        content,
        parts: [{ type: 'text', text: content }]
    }
];

console.log('Testing convertToCoreMessages with constructed parts:', JSON.stringify(messages, null, 2));

try {
    const result = convertToCoreMessages(messages);
    console.log('Success:', JSON.stringify(result, null, 2));
} catch (error) {
    console.error('Error:', error);
}
