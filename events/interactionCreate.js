const { Collection, Events, getVoiceConnection} = require('discord.js');
const { createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const PlayerStateChange = require(`./playerStateChange.js`);

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Checks if command and executes
        if (!interaction.isChatInputCommand()) return;
        
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        
        // Set cooldowns
        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection())
        }
        
        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 1;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;
        
        if (timestamps.has(interaction.user.id)) {
            const expirationTime  = timestamps.get(interaction.user.id) + cooldownAmount;
        
            if (now < expirationTime) {
                const expiredTimeStamp = Math.round(expirationTime / 1000);
                return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimeStamp}:R>.`,ephemeral: true });
            }
        }
        
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        
        // Sets Players -> Creates songQueues -> musicPlaying
        //const { players } = interaction.client.players

        if (!interaction.client.players.has(interaction.guildId)){
            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
            interaction.client.players.set(interaction.guildId, player);
            interaction.client.songQueue.set(interaction.guildId, []);
            interaction.client.musicPlaying.set(interaction.guildId, false);

            // SET EVENT TO LISTEN TO SWITCH TO IDLE 
            PlayerStateChange.execute(interaction);
        }


        // Execute interaction
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
        // console.log(interaction);
    },
};