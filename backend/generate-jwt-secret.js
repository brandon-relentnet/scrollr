#!/usr/bin/env node

import crypto from 'crypto';

/**
 * Generate a cryptographically secure JWT secret
 * Usage: node generate-jwt-secret.js
 */

console.log('🔐 Generating secure JWT secret...\n');

// Generate a 256-bit (32 bytes) cryptographically secure random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('✅ Generated secure JWT secret:');
console.log(secret);
console.log('\n📝 Add this to your .env file:');
console.log(`JWT_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret secure and never commit it to version control!');
console.log('🔄 Generate a new secret for each environment (development, staging, production)');