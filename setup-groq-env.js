#!/usr/bin/env node

// Your Groq API key
const GROQ_API_KEY = '[REDACTED]';

console.log('🔧 Setting up Groq API key...');
console.log('');
console.log('Please add the following line to your .env file:');
console.log('');
console.log(`VITE_GROQ_API_KEY=${GROQ_API_KEY}`);
console.log('');
console.log('Or run this command to append it automatically:');
console.log(`echo "VITE_GROQ_API_KEY=${GROQ_API_KEY}" >> .env`);
console.log('');
console.log('✅ After adding the API key, restart your development server:');
console.log('npm run dev');