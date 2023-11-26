const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const play = require('./play.js')

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses music'),
    async execute(interaction) {
        if (!interaction.member.voice.channel) return interaction.reply("Nice try bitch, you need to be in a voice channel to pause music");

        const connection = getVoiceConnection(interaction.member.voice.channel.guild.id);
        if (!connection || connection.joinConfig.channelId != interaction.member.voice.channelId) {
            return interaction.reply('Chance is not in your channel.');
        }
        if(interaction.client.musicPlaying.get(interaction.guildId)){
            interaction.client.timeouts.set(interaction.guildId, setTimeout(play.disconnectBot, 300000, interaction, connection))
            interaction.client.musicPlaying.set(interaction.guildId, false)
            connection.state.subscription.player.pause();
            return await interaction.reply(`Paused`);
        }
        await interaction.reply(`No music is currently playing`);
    },
};