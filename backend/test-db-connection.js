const { Client } = require('pg');
const dns = require('dns');
const { promisify } = require('util');
require('dotenv').config();

const lookup = promisify(dns.lookup);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  // First test DNS resolution
  console.log('🌐 Testing DNS resolution...');
  try {
    const address = await lookup(process.env.DB_HOST);
    console.log('✅ DNS resolution successful:', address);
  } catch (dnsError) {
    console.error('❌ DNS resolution failed:', dnsError.message);
    console.log('\n🔧 DNS Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the Supabase hostname is correct');
    console.log('3. Try accessing your Supabase dashboard to confirm the project is active');
    return;
  }
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to Supabase!');
    
    console.log('\n📊 Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('\n🎉 Database Information:');
    console.log('- PostgreSQL Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    console.log('- Database Name:', result.rows[0].current_database);
    console.log('- Connected User:', result.rows[0].current_user);
    
    console.log('\n✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env file exists in the backend directory');
    console.log('2. Verify your Supabase password is correct');
    console.log('3. Ensure your Supabase project is active');
    console.log('4. Check if your IP is allowed (Supabase should allow all by default)');
    
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

testDatabaseConnection();