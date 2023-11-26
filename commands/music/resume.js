const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Plays and adds music to queue'),
    async execute(interaction) {
        if (!interaction.member.voice.channel) return interaction.reply("You need to be in a voice channel to resume music");

        const connection = getVoiceConnection(interaction.member.voice.channel.guild.id);
        if (!connection || connection.joinConfig.channelId != interaction.member.voice.channelId) {
            return interaction.reply('Chance is not in your channel.');
        }
        if(!interaction.client.musicPlaying.get(interaction.guildId)){
            interaction.client.timeouts.set(interaction.guildId, clearTimeout(interaction.client.timeouts.get(interaction.guildId)))
            interaction.client.musicPlaying.set(interaction.guildId, true)
            connection.state.subscription.player.unpause();
            return await interaction.reply(`Resumed`);
        }
        await interaction.reply(`Music is already playing`)
    },
};