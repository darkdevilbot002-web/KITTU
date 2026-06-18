const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

const inputFile = path.join(__dirname, 'non-stop.mp3');
const outputFile = path.join(__dirname, 'non-stop-10x.mp3');
const concatFile = path.join(__dirname, 'concat.txt');

// Create concat file with 10 references to the input audio
const concatContent = Array(10).fill(`file '${inputFile}'`).join('\n');
fs.writeFileSync(concatFile, concatContent);

console.log('🔧 Creating 10x concatenated audio file...');

try {
  // Use FFmpeg to concatenate the audio 10 times
  const cmd = `"${ffmpegPath}" -f concat -safe 0 -i "${concatFile}" -c copy "${outputFile}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Success! Created: ${outputFile}`);
  console.log(`📊 This file contains audio played 10 times in sequence`);
  
  // Cleanup concat file
  fs.unlinkSync(concatFile);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
