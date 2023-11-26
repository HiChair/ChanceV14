// Require discord.js classes
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { Player } = require('discord-player'); 
require('dotenv').config(); 
// Create client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ], 
});


client.musicPlaying = new Collection();
client.songQueue = new Collection();

client.timeouts = new Collection();
client.connections = new Collection();
client.cooldowns = new Collection();
client.players = new Collection();
// Load commands on startup
client.commands = new Collection();

// Retrieve folders and files in commands folder
const foldersPath = path.join(__dirname, 'commands');     // provides path to commands
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {      // Loops through command files and maps them to Collection
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // array of command files ['play.js', 'pause.js']
    for (const file of commandFiles){
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Retrieve event files in events folder
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// log in to Discord 
client.login(process.env.TOKEN);