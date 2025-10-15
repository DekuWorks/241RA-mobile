import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script writes the google-services.json file from the environment variable
// during the EAS build process

console.log('🔧 Running google-services.json setup script...');

const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;

if (googleServicesJson) {
  try {
    console.log('📝 Found GOOGLE_SERVICES_JSON environment variable');

    // Parse the JSON to validate it
    const parsedJson = JSON.parse(googleServicesJson);
    console.log('✅ Successfully parsed JSON from environment variable');

    // Write the file to the expected location
    const outputPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
    console.log('📁 Output path:', outputPath);

    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    console.log('📁 Creating directory:', dir);
    fs.mkdirSync(dir, { recursive: true });

    // Write the file
    fs.writeFileSync(outputPath, JSON.stringify(parsedJson, null, 2));
    console.log('✅ Successfully wrote google-services.json from environment variable');

    // Verify the file was written
    if (fs.existsSync(outputPath)) {
      console.log('✅ File exists and is readable');
    } else {
      console.log('❌ File was not created successfully');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error writing google-services.json:', error);
    process.exit(1);
  }
} else {
  console.log('ℹ️  No GOOGLE_SERVICES_JSON environment variable found');

  // Check if the file already exists
  const existingPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
  if (fs.existsSync(existingPath)) {
    console.log('✅ Using existing google-services.json file');
  } else {
    console.log('❌ No google-services.json file found and no environment variable provided');
    process.exit(1);
  }
}

console.log('🎉 google-services.json setup complete');
