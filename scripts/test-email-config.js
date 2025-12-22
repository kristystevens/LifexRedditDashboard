// Note: This script needs to be run with tsx or compiled TypeScript
// For now, let's create a simple test that doesn't require the email module

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testEmailConfig() {
  console.log('📧 Testing email configuration...');
  
  // Check which environment variables are set
  const requiredVars = [
    'EMAIL_FROM',
    'EMAIL_TO', 
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'CRON_SECRET'
  ];
  
  console.log('\n🔍 Checking environment variables:');
  let allSet = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = value && value.trim() !== '';
    console.log(`${varName}: ${isSet ? '✅ Set' : '❌ Missing'}`);
    if (!isSet) allSet = false;
  });
  
  if (allSet) {
    console.log('\n✅ All required environment variables are set!');
    console.log('📧 Email configuration appears to be ready.');
    console.log(`📬 Notifications will be sent to: ${process.env.EMAIL_TO}`);
    console.log('\n💡 To test the actual email sending, use the web interface or API endpoint.');
  } else {
    console.log('\n❌ Some environment variables are missing.');
    console.log('Please check your .env.local file and ensure all required variables are set.');
  }
}

testEmailConfig();