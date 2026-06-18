const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, 'non-stop.mp3');
const outputDir = __dirname;

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: ${inputFile} not found!`);
  process.exit(1);
}

console.log('🔧 Creating 10 audio file copies...');

const fileContent = fs.readFileSync(inputFile);

for (let i = 1; i <= 10; i++) {
  const outputFile = path.join(outputDir, `non-stop-${i}.mp3`);
  fs.writeFileSync(outputFile, fileContent);
  console.log(`✅ Created: non-stop-${i}.mp3`);
}

console.log(`\n✨ Success! Created 10 audio files (non-stop-1.mp3 to non-stop-10.mp3)`);
