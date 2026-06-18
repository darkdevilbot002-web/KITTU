require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType
} = require('@discordjs/voice');

const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

require('opusscript');
require('libsodium-wrappers');

// Health check
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('10 Bots - Nuclear Stacked');
}).listen(PORT);

const tokens = [
  process.env.TOKEN1, process.env.TOKEN2, process.env.TOKEN3, process.env.TOKEN4, process.env.TOKEN5,
  process.env.TOKEN6, process.env.TOKEN7, process.env.TOKEN8, process.env.TOKEN9, process.env.TOKEN10
].filter(t => t);

console.log(`Starting ${tokens.length} bots - 10x Audio Fleet Mode...`);

tokens.forEach((token, index) => {
  const botNum = index + 1;
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  let connection;
  let player;
  let currentFileIndex = 1;
  let isPlaying = false;

  let audioTimeout = null;

  const playSequentialAudio = () => {
    if (currentFileIndex > 10) {
      console.log(`[Bot ${botNum}] ✅ Finished playing all 10 audio files!`);
      currentFileIndex = 1;
      isPlaying = false;
      if (audioTimeout) clearTimeout(audioTimeout);
      return;
    }

    if (!isPlaying) {
      if (audioTimeout) clearTimeout(audioTimeout);
      return;
    }

    const audioPath = path.join(__dirname, `non-stop-${currentFileIndex}.mp3`);
    console.log(`[Bot ${botNum}] 🎵 Playing audio file ${currentFileIndex}/10`);

    if (!fs.existsSync(audioPath)) {
      console.error(`[Bot ${botNum}] ❌ File not found: ${audioPath}`);
      currentFileIndex++;
      if (audioTimeout) clearTimeout(audioTimeout);
      audioTimeout = setTimeout(playSequentialAudio, 100);
      return;
    }

    try {
      const resource = createAudioResource(audioPath, {
        inlineVolume: true,
        inputType: 'arbitrary'
      });

      if (resource.volume) {
        resource.volume.setVolume(5.0);
      }

      if (player) {
        player.stop();
      }

      player = createAudioPlayer();
      
      let idleEventFired = false;

      player.on(AudioPlayerStatus.Idle, () => {
        if (!idleEventFired && isPlaying) {
          idleEventFired = true;
          console.log(`[Bot ${botNum}] ✅ File ${currentFileIndex} finished, moving to next`);
          currentFileIndex++;
          if (audioTimeout) clearTimeout(audioTimeout);
          audioTimeout = setTimeout(playSequentialAudio, 50);
        }
      });

      player.on('error', error => {
        console.error(`[Bot ${botNum}] ❌ Playback Error:`, error.message);
        currentFileIndex++;
        if (audioTimeout) clearTimeout(audioTimeout);
        audioTimeout = setTimeout(playSequentialAudio, 100);
      });

      // Reduced timeout to 30 seconds as fallback
      if (audioTimeout) clearTimeout(audioTimeout);
      audioTimeout = setTimeout(() => {
        if (isPlaying && !idleEventFired) {
          console.log(`[Bot ${botNum}] ⏱️ Timeout - forcing next file`);
          idleEventFired = true;
          currentFileIndex++;
          player.stop();
          audioTimeout = setTimeout(playSequentialAudio, 50);
        }
      }, 30000);

      player.play(resource);
      connection.subscribe(player);
    } catch (err) {
      console.error(`[Bot ${botNum}] ❌ Error playing audio:`, err.message);
      currentFileIndex++;
      if (audioTimeout) clearTimeout(audioTimeout);
      audioTimeout = setTimeout(playSequentialAudio, 100);
    }
  };

  client.on('ready', () => {
    console.log(`[Bot ${botNum}] ✅ ONLINE`);
  });

  client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!kvc') {
      const vc = message.member.voice.channel;
      if (!vc) return;
      
      try {
        if (!connection) {
          connection = joinVoiceChannel({
            channelId: vc.id,
            guildId: message.guild.id,
            adapterCreator: client.guilds.cache.get(message.guild.id).voiceAdapterCreator,
            selfDeaf: true,
            group: client.user.id
          });
          console.log(`[Bot ${botNum}] ✅ JOINED voice channel`);
        } else {
          console.log(`[Bot ${botNum}] ⚠️ Already in voice channel`);
        }
      } catch (err) {
        console.error(`[Bot ${botNum}] ❌ JOIN ERROR:`, err.message);
      }
    }

    if (message.content === '!kst') {
      if (!connection) return;

      if (!isPlaying) {
        isPlaying = true;
        currentFileIndex = 1;
        playSequentialAudio();
      } else {
        console.log(`[Bot ${botNum}] ⚠️ Audio is already playing!`);
      }
    }

    if (message.content === '!ksp') { 
      if (player) {
        player.stop();
        isPlaying = false;
        currentFileIndex = 1;
        console.log(`[Bot ${botNum}] ⏹️ Audio stopped`);
      }
    }
    if (message.content === '!klv') { 
      if (player) player.stop();
      isPlaying = false;
      currentFileIndex = 1;
      if (connection) {
        connection.destroy();
        connection = null;
        console.log(`[Bot ${botNum}] 👋 LEFT voice channel`);
      }
    }
  });

  client.login(token).catch(err => console.error(`[Bot ${botNum}] ❌ LOGIN FAILED`));
});
