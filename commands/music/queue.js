const { SlashCommandBuilder, MessageEmbed } = require('discord.js');
const { QueryType }  = require('discord-player');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('displays the current song queue')
        .addNumberOption((option)  => option.setName("page").setDescription("Page number of the queue").setMinValue(1)
    ),
    
    async execute(interaction) {
        if (!interaction.member.voice.channel)
            return interaction.editReply("You need to be in a voice channel to use this command");
        
        const queue = interaction.client.player.getQueue(interaction.guildId)
        if (!queue || !queue.playin) {
            return await interaction.editReply("There are no songs in the queue")
        }

        const totalPages = Math.ceil(queue.tracks.length / 10) || 1
        const page = (interaction.options.getNumber("page") || 1) -1

        if (page > totalPages) 
            return await interaction.editReply(`Invalid Page. There are only a total of ${totalPages} pages of songs.`)

        const queueString = queue.tracks.slice(page * 10, page * 10 + 10).map((song, i) => {
            return `**${page * 10 + i + 1}. **\` [${song.duration}]\` ${song.title} -- <@${song.requestedBy.id}>`
        }).join("\n")

        const currentSong = queue.currentSong

        await interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setDescription(`**Currently Playing**\n` +
                    (currentSong ? `\` [${currentSong.duration}]\` ${currentSong.title} -- <@${currentSong.requestedBy.id}>` : "None") +
                    `\n\n**Queue**\n${queueString}`
                    )
                    .setFooter({
                        text: `Page ${page + 1} of ${totalPages}`
                    })
                    .setThumbnail(currentSong.thumbnail)
            ]
        })
    }
}