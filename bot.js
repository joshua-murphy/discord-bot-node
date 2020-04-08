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
      console.log(`Logged in!`);

      setInterval(() => {
        this.getStreams();
      }, 60 * 1000);

      this.getStreams();
    });
    
    bot.on('message', (message) => {
      message.content === '!ping' && message.channel.send("I'm alive");
    });
  };

  async getStreams() {
    const currentStreams = [];
    const streamChannel = bot.channels.cache.get('696765786542440540');

    const { data } = await client.helix.streams.getStreams({ game: Object.keys(games) });

    data.forEach((stream) => {
      const titleWords = stream.title.toLowerCase().match(/\b(\w|\%)+/g);

      if (titleWords && stream.type === 'live' && titleWords.filter(value => -1 !== whitelist.indexOf(value)).length) {
        // found a stream that looks like a speedrun
        currentStreams.push(stream);
      }
    });

    this.activeStreams = currentStreams.map((stream) => {
      if (!this.activeStreams.find((id) => stream.id === id )) {
        // new stream, post message in server
        const embed = new MessageEmbed();

        embed.setTitle('Cannibalx6 is live on Twitch: TLC Any% runs').setColor(0x6441A4).setDescription('https://twitch.tv/${}');
        streamChannel.send(embed);
      }

      stream.id;
    });

    currentStreams.length && console.log(`active: ${this.activeStreams} \ncurrent: ${currentStreams}\n`);
  }
}

const discordBot = new Bot;
discordBot.run();
