const { SlashCommandBuilder, Collection, EmbedBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioResource, StreamType, NoSubscriberBehavior, AudioPlayerStatus,} = require("@discordjs/voice");
const scdl = require("soundcloud-downloader").default;
const ytdl = require("ytdl-core");
const youtubedl = require("youtube-dl-exec");
const ytSearch = require("yt-search");
const { fs, createReadStream } = require('node:fs');

const skip = require('./skip.js')
const sc_client_id = "2jUbjIyAnUDbvqQ6o48wziWm1AVVmSr4";

async function connectVoice(interaction) {
  // Connect to Voice Channel
  if (!interaction.client.connections.has(interaction.guildId)) {
    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    interaction.client.connections.set(interaction.guildId, connection);
  }
}


module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("testing shit")
    .addStringOption((option) =>
      option
        .setName("song")
        .setDescription("song title or link")
        .setRequired(true)
    ),
    async getNextResource(interaction) {
        const text_channel_id = interaction.channel.id;
        console.log("getting resource")
        console.log(`music playing: ${interaction.client.musicPlaying}`)
        if (!interaction.client.musicPlaying) {
            console.log(interaction.client.songQueue);
            // download youtube video
            if (interaction.client.songQueue[0].type === "yt") {
            console.log("playing yt");
            const stream = ytdl(interaction.client.songQueue[0].url, {
                filter: "audioonly",
                quality: "highestaudio",
                highWaterMark: 1 << 25,
            });
            const resource = createAudioResource(stream);
            interaction.client.players.get(interaction.guildId).play(resource);
            interaction.client.musicPlaying = true;
            //interaction.client.channels.cache.get(text_channel_id).send(`Now playing **${interaction.client.songQueue[0].title}**`);
            const exampleEmbed = new EmbedBuilder()
	            .setColor(0x9300ff)
	            .setTitle(`Now playing **${interaction.client.songQueue[0].title}**`)
	            .setThumbnail(interaction.client.songQueue[0].thumbnail)
            interaction.client.channels.cache.get(text_channel_id).send({ embeds: [exampleEmbed] });

            // download soundcloud video
            } else if (interaction.client.songQueue[0].type === "sc") {
                console.log("playing sc");
                try {
                    const stream = await scdl.download(interaction.client.songQueue[0].url, sc_client_id);
                    const resource = createAudioResource(stream);
                    interaction.client.players.get(interaction.guildId).play(resource);
                    interaction.client.musicPlaying = true;
                    //interaction.client.channels.cache.get(text_channel_id).send(`Now playing **${interaction.client.songQueue[0].title}**`);
                    const exampleEmbed = new EmbedBuilder()
	                    .setColor(0x9300ff)
	                    .setTitle(`Now playing **${interaction.client.songQueue[0].title}**`)
	                    .setThumbnail(interaction.client.songQueue[0].thumbnail)
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
    if (!interaction.member.permissions.has("CONNECT"))
        return await interaction.reply("You don't have the correct permissions for this command");
    if (!interaction.member.permissions.has("SPEAK"))
        return await interaction.reply("You don't have the correct permissions for this command");
    if (!interaction.member.voice.channel)
        return await interaction.reply("Nice try bitch, you need to be in a voice channel to play music");

    var songRequest = interaction.options.getString("song");
    //console.log(songRequest.includes("youtube.com"));
    var url = "";

    if (songRequest.includes("soundcloud.com")) {
        console.log("adding sc link");
        url = songRequest;
        interaction.client.songQueue.push({
            url: url,
            type: "sc",
            title: "Insert SoundCloud song name here lol",
            thumbnail: null
        });
        await interaction.reply(`Adding ${"SOUNDCLOUD"} to queue`);
    } else if (songRequest.includes("youtube.com")) {
        console.log("adding yt link");
        //await interaction.reply("adding song...");
        try {
            const info = await ytdl.getBasicInfo(songRequest);
            //console.log(info.videoDetails);
            //console.log(info.videoDetails.thumbnails[0].url)
            url = songRequest;
            interaction.client.songQueue.push({
                url: url,
                type: "yt",
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[0].url
            });
          await interaction.reply(`Adding ${info.videoDetails.title} to queue`);
        } catch (error) {
            console.error("Error:", error);
            return await interaction.reply("Could not add that song (might be age restricted)");
        }
    } else {
        // search youtube for song
        const videoResult = await ytSearch(songRequest);
        try {
            const info = await ytdl.getBasicInfo(videoResult.videos[0].url);
            console.log(info);
            url = videoResult.videos[0].url;
            interaction.client.songQueue.push({
                url: url,
                type: "yt",
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[0].url
          });
        await interaction.reply(`Adding ${info.videoDetails.title} to queue`);
        } catch (error) {
        console.error("Error:", error);
        return await interaction.reply("Could not add that song");
        }
      }

    await connectVoice(interaction);
    // Player Life Cycle
    const player = interaction.client.players.get(interaction.guildId);
    const subscription = interaction.client.connections.get(interaction.guildId).subscribe(player);

    this.getNextResource(interaction);

    //console.log(player._state.status);

  
      //const resource = createAudioResource("D:\\Downloads V.2\\Bags.mp3");
  },
};
