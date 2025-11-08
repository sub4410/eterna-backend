// Quick Redis connection test
require('dotenv').config();
const Redis = require('ioredis');

console.log('🔍 Testing Redis connection...\n');

// Check which method is being used
if (process.env.REDIS_URL) {
  console.log('📝 Using REDIS_URL:', process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@'));
} else {
  console.log('📝 Using separate credentials:');
  console.log('   Host:', process.env.REDIS_HOST || 'localhost');
  console.log('   Port:', process.env.REDIS_PORT || '6379');
  console.log('   Password:', process.env.REDIS_PASSWORD ? '****' : '(none)');
}

// Create Redis client
const client = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    });

client.on('error', (err) => {
  console.error('\n❌ Redis connection error:', err.message);
  process.exit(1);
});

client.on('connect', async () => {
  console.log('\n✅ Redis connected successfully!');
  
  try {
    // Test PING
    const pong = await client.ping();
    console.log('✅ PING test:', pong);
    
    // Test SET
    await client.set('test:key', 'Hello Eterna!', 'EX', 10);
    console.log('✅ SET test: Key created with 10s expiry');
    
    // Test GET
    const value = await client.get('test:key');
    console.log('✅ GET test:', value);
    
    // Test DELETE
    await client.del('test:key');
    console.log('✅ DEL test: Key deleted');
    
    console.log('\n🎉 All Redis tests passed! You\'re ready to go!\n');
  } catch (error) {
    console.error('\n❌ Redis operation failed:', error.message);
  } finally {
    await client.quit();
    process.exit(0);
  }
});
