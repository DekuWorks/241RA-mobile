const fs = require('fs');
const path = require('path');

// This script writes the google-services.json file from the environment variable
// during the EAS build process

const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;

if (googleServicesJson) {
  try {
    // Parse the JSON to validate it
    const parsedJson = JSON.parse(googleServicesJson);
    
    // Write the file to the expected location
    const outputPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
    
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(outputPath, JSON.stringify(parsedJson, null, 2));
    
    console.log('✅ Successfully wrote google-services.json from environment variable');
  } catch (error) {
    console.error('❌ Error writing google-services.json:', error);
    process.exit(1);
  }
} else {
  console.log('ℹ️  No GOOGLE_SERVICES_JSON environment variable found, using existing file');
}
