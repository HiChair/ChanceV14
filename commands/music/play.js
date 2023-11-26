const { SlashCommandBuilder, PermissionsBitField, Collection, EmbedBuilder } = require("discord.js");
const { VoiceConnectionStatus, getVoiceConnection, joinVoiceChannel, createAudioResource, StreamType, NoSubscriberBehavior, AudioPlayerStatus,} = require("@discordjs/voice");
const scdl = require("soundcloud-downloader").default;
const ytdl = require("ytdl-core");
const youtubedl = require("youtube-dl-exec");
const ytSearch = require("yt-search");
const { fs, createReadStream } = require('node:fs');
const search = require('youtube-search')
const sc_client_id = "2jUbjIyAnUDbvqQ6o48wziWm1AVVmSr4";
const stop = require('./stop.js')

function disconnectBot(interaction,connection){
  interaction.client.songQueue.set(interaction.guildId, []) ;
  interaction.client.musicPlaying.set(interaction.guildId, false);
  interaction.client.players.delete(interaction.guildId);
  interaction.client.connections.delete(interaction.guildId);
  interaction.client.timeouts.set(interaction.guildId, clearTimeout(interaction.client.timeouts.get(interaction.guildId)))
  connection.destroy();
}
async function connectVoice(interaction) {
  // CONNECT TO VOICE CHANNEL
  if (!interaction.client.connections.has(interaction.guildId)) {
    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    connection.on(VoiceConnectionStatus.Disconnected, () => {
      disconnectBot(interaction,connection)
    });
    interaction.client.connections.set(interaction.guildId, connection);
  }
}


function searchVideos(query, options) {
  return new Promise((resolve, reject) => {
    search(query, options, function(err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function getSearchResults(query,opts) {
  try {
    const results = await searchVideos(query, opts);
    console.dir(results);
    return results
  } catch (err) {
    console.log(err);
    // Handle the error
  }
}

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("searches youtube or plays soundcloud link")
    .addStringOption((option) =>
      option
        .setName("song")
        .setDescription("song title or link")
        .setRequired(true)
    ),
    disconnectBot(interaction,connection){
      interaction.client.songQueue.set(interaction.guildId, []) ;
      interaction.client.musicPlaying.set(interaction.guildId, false);
      interaction.client.players.delete(interaction.guildId);
      interaction.client.connections.delete(interaction.guildId);
      connection.destroy();
    }, 

    async getNextResource(interaction) {
        const text_channel_id = interaction.channel.id;
        const player = interaction.client.players.get(interaction.guildId);
        console.log("getting resource")
        console.log(`music playing: ${interaction.client.musicPlaying.get(interaction.guildId)}`)
        if (!interaction.client.musicPlaying.get(interaction.guildId) && player.state.status != 'paused') {
            interaction.client.timeouts.set(interaction.guildId, clearTimeout(interaction.client.timeouts.get(interaction.guildId)))
            console.log(interaction.client.songQueue.get(interaction.guildId));
            // DOWNLOAD YOUTUBE VIDEO
            if (interaction.client.songQueue.get(interaction.guildId)[0].type === "yt") {
            console.log("playing yt");
            const stream = ytdl(interaction.client.songQueue.get(interaction.guildId)[0].url, {
                filter: "audioonly",
                quality: "highestaudio",
                highWaterMark: 1 << 25,
            });
            const resource = createAudioResource(stream);
            interaction.client.players.get(interaction.guildId).play(resource);
            interaction.client.musicPlaying.set(interaction.guildId, true);
            //interaction.client.channels.cache.get(text_channel_id).send(`Now playing **${interaction.client.songQueue[0].title}**`);
            let person = await interaction.client.users.fetch('882820027533914203')
            //console.log(person)
            const exampleEmbed = new EmbedBuilder()
	            .setColor(0x9300ff)
	            .setTitle(`**${interaction.client.songQueue.get(interaction.guildId)[0].title}**`)
              .setAuthor({ name:'Now playing', iconURL: person.displayAvatarURL() })
	            .setThumbnail(interaction.client.songQueue.get(interaction.guildId)[0].thumbnail)
            interaction.client.channels.cache.get(text_channel_id).send({ embeds: [exampleEmbed] });

            // DOWNLOAD SOUNDCLOUD VIDEO
            } else if (interaction.client.songQueue.get(interaction.guildId)[0].type === "sc") {
                console.log("playing sc");
                try {
                    const stream = await scdl.download(interaction.client.songQueue.get(interaction.guildId)[0].url, sc_client_id);
                    const resource = createAudioResource(stream);
                    interaction.client.players.get(interaction.guildId).play(resource);
                    interaction.client.musicPlaying.set(interaction.guildId, true);
                    //interaction.client.channels.cache.get(text_channel_id).send(`Now playing **${interaction.client.songQueue[0].title}**`);
                    let person = await interaction.client.users.fetch('882820027533914203')
                    const exampleEmbed = new EmbedBuilder()
	                    .setColor(0x9300ff)
                      .setAuthor({ name:'Now playing', iconURL: person.displayAvatarURL() })
	                    .setTitle(`**${interaction.client.songQueue.get(interaction.guildId)[0].title}**`)
	                    .setThumbnail(interaction.client.songQueue.get(interaction.guildId)[0].thumbnail)
                    interaction.client.channels.cache.get(text_channel_id).send({ embeds: [exampleEmbed] });
                } catch (error) {
                    console.error("Error:", error);
                    interaction.client.channels.cache.get(text_channel_id).send(`Error playing link from SoundCloud`);
                    await interaction.client.commands.get('skip').execute(interaction);
                    //return interaction.reply("Could not play track from soundcloud"); // need to remove
                }
            }
    
        }
    },
    
  async execute(interaction) {
    await interaction.deferReply();
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Connect))
        return await interaction.editReply("You don't have the correct permissions for this command");
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Speak))
        return await interaction.editReply("You don't have the correct permissions for this command");
    if (!interaction.member.voice.channel)
        return await interaction.editReply("Nice try bitch, you need to be in a voice channel to play music");
    const connection = getVoiceConnection(interaction.member.voice.channel.guild.id);
    if (interaction.client.musicPlaying.get(interaction.guildId) == true){
      if (!connection || connection.joinConfig.channelId != interaction.member.voice.channelId) 
        return await interaction.editReply('Chance is not in your channel.');
    }
  
    var songRequest = interaction.options.getString("song");
    //console.log(songRequest.includes("youtube.com"));

    if (songRequest.includes("soundcloud.com")) {
        console.log("adding sc link");
        try {
          var scInfo = await scdl.getInfo(songRequest, sc_client_id)
        } catch (error) {
            console.error("Error:", error);
            return await interaction.editReply("Could not add song from SoundCloud (maybe bad link)");
        }
        //console.log(scInfo)
        var url = songRequest;
        interaction.client.songQueue.get(interaction.guildId).push({
            url: url,
            type: "sc",
            title: scInfo.title,
            thumbnail: scInfo.artwork_url
        });
        await interaction.editReply(`Adding **${scInfo.title}** to queue`);
    } else if (songRequest.includes("youtube.com")) {
        console.log("adding yt link");
        try {
            const info = await ytdl.getBasicInfo(songRequest);
            var videoDetails = info.videoDetails
            interaction.client.songQueue.get(interaction.guildId).push({
                url: songRequest,
                type: "yt",
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnails[0].url
            });
          await interaction.editReply(`Adding **${videoDetails.title}** to queue`);
        } catch (error) {
            console.error("Error:", error);
            return await interaction.editReply("Could not add that song (might be age restricted)");
        }
    } else {
        // SEARCH YOUTUBE FOR A SONG
        var opts = {
          maxResults: 10,
          key: 'AIzaSyB1sc2uB7kKVb-NZc-Tk5euRlIA5DvwZgw'
        };
        // await search(songRequest, opts, function(err, results)  {
        //   if(err) console.error("Error:", err);

        //   console.dir(results);
        //   return results[0].link
        // })

        const videoResult = await getSearchResults(songRequest,opts);

        try {
            const info = await ytdl.getBasicInfo(videoResult[0].link);
            var videoDetails = info.videoDetails
            interaction.client.songQueue.get(interaction.guildId).push({
                url: videoResult[0].link,
                type: "yt",
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnails[0].url
                
          });
        await interaction.editReply(`Adding **${videoDetails.title}** to queue`);
        } catch (error) {
            console.error("Error:", error);
            return await interaction.editReply("Could not add that song");
        }
      }

    await connectVoice(interaction);
    // PLAYER LIFE CYCLE
    const player = interaction.client.players.get(interaction.guildId);
    const subscription = interaction.client.connections.get(interaction.guildId).subscribe(player);

    this.getNextResource(interaction);

    //console.log(player._state.status);

  
      //const resource = createAudioResource("D:\\Downloads V.2\\Bags.mp3");
  },
};
