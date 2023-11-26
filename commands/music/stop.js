const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops music and disconnects chance'),
    async execute(interaction) {
        if (!interaction.member.voice.channel) return await interaction.reply("Nice try bitch, you need to be in a voice channel to stop music");
        const connection = getVoiceConnection(interaction.member.voice.channel.guild.id);
        if (!connection || connection.joinConfig.channelId != interaction.member.voice.channelId) {
            return await interaction.reply('Chance is not in your channel.');
        }
        interaction.client.songQueue.set(interaction.guildId, []) ;
        interaction.client.musicPlaying.set(interaction.guildId, false);
        interaction.client.players.delete(interaction.guildId);
        interaction.client.connections.delete(interaction.guildId);
        connection.destroy();
        try{
            await interaction.reply(`:(`);
        }
        catch(error){
        }
    },
};