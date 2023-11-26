const { Events } = require('discord.js');
const { joinVoiceChannel, createAudioResource, getVoiceConnection, StreamType, NoSubscriberBehavior, AudioPlayerStatus,} = require("@discordjs/voice");
const play = require('../commands/music/play.js')

module.exports = {
    name: Events.PlayerStateChange,
    once: false,
    execute(interaction) {
        const player = interaction.client.players.get(interaction.guildId);

        player.on("error", (error) => {
            console.error(error);
        });
        player.on("stateChange", (oldOne, newOne) => {
            if (oldOne.status === "playing" && newOne.status === "idle") {
                console.log("playing transitioned to idle");
                interaction.client.musicPlaying.set(interaction.guildId, false);
                interaction.client.songQueue.get(interaction.guildId).shift()
                if (interaction.client.songQueue.get(interaction.guildId).length > 0){
                    play.getNextResource(interaction);
                }
                else{
                    const connection = getVoiceConnection(interaction.member.voice.channel.guild.id);
                    interaction.client.timeouts.set(interaction.guildId, setTimeout(play.disconnectBot, 300000, interaction, connection))
                }
            }
        });
        player.on(AudioPlayerStatus.Idle, () => {
            console.log("inside idle");
        });

    },
};