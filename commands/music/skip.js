const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const play = require('./play.js')

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song'),
    async execute(interaction) {
        if (!interaction.member.voice.channel) return await interaction.reply("Nice try bitch, you need to be in a voice channel to skip music");
        const connection = getVoiceConnection(interaction.member.voice.channel.guild.id);
        if (!connection || connection.joinConfig.channelId != interaction.member.voice.channelId) {
            return await interaction.reply('Chance is not in your channel.');
        }
        
        await interaction.reply(`Skipping **${interaction.client.songQueue.get(interaction.guildId)[0].title}**`);
        interaction.client.musicPlaying.set(interaction.guildId, false);
        interaction.client.songQueue.get(interaction.guildId).shift()
        if (interaction.client.songQueue.get(interaction.guildId).length > 0){
            connection.state.subscription.player.unpause();
            play.getNextResource(interaction);
        }
        else{
            interaction.client.players.delete(interaction.guildId);
            interaction.client.connections.delete(interaction.guildId);
            connection.destroy();
        }
        // **DO SOMETHING WHEN ITS THE LAST SONG IN QUEUE
    },
};