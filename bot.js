const { Client, MessageEmbed } = require('discord.js');
const TwitchClient = require('twitch').default;
const ENV = require('dotenv').config().parsed;

const { games, whitelist } = require('./exports.js');

const client = TwitchClient.withCredentials(ENV.CLIENT_ID, ENV.SECRET_KEY);
const bot = new Client();

class Bot {
  constructor() {
    this.activeStreams = [];
  }

  run() {
    bot.login(ENV.LOGIN_TOKEN);

    bot.on('ready', () => {
      console.log(`Logged in`);

      setInterval(() => {
        this.getStreams(true);
      }, 60 * 1000);

      this.getStreams();
    });
    
    bot.on('message', (message) => {
      message.content === '!ping' && message.channel.send("I'm alive");
    });
  };

  async getStreams(postMessage = false) {
    const currentStreams = [];
    const streamChannel = bot.channels.cache.get('696765786542440540');

    const { data } = await client.helix.streams.getStreams({ game: Object.keys(games) });

    data.forEach((stream) => {
      const title = stream.title.toLowerCase();
      const validStream = whitelist.filter((term) => title.includes(term)).length > 0;

      if (validStream && stream.type === 'live') {
        // found a stream that looks like a speedrun
        currentStreams.push(stream);
      }
    });

    this.activeStreams = currentStreams.map((stream) => {
      if (!this.activeStreams.find((id) => stream.id === id)) {
        // new stream, post message in server
        const embed = new MessageEmbed();
        embed.setTitle(`${stream.userDisplayName} is streaming ${games[stream.game_id]} on Twitch: ${stream.title}`).setColor(0x6441A4).setDescription(`https://twitch.tv/${stream.userDisplayName.toLowerCase()}`);

        currentStreams.length && console.log(`active: ${JSON.stringify(this.activeStreams)} \ncurrent: ${JSON.stringify(currentStreams)}\n`);
        postMessage && streamChannel.send(embed);
      }

      return stream.id;
    });
  }
}

const discordBot = new Bot;
discordBot.run();
