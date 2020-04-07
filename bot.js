const Discord = require('discord.js');
const TwitchClient = require('twitch').default;
const ENV = require('dotenv').config().parsed;

const client = TwitchClient.withCredentials(ENV.CLIENT_ID, ENV.SECRET_KEY);
const bot = new Discord.Client();

class Bot {
  constructor() {
    this.activeStreams = [];
    this.whitelist = ['any%', '100%', 'hundo', 'asq', 'aq', 'runs', 'speedrun', 'pb'];
    this.games = {
      '1915': 'TLC',
      '3007': 'OG',
      '18756': 'Fable 2',
      '25145': 'Fable 3',
      '369509': 'Anniversary'
    }

    this.run();
  }

  run() {
    bot.login(ENV.LOGIN_TOKEN);

    bot.on('ready', () => {
      console.log(`Logged in as ${bot.user.tag}!`);

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

    const { data } = await client.helix.streams.getStreams({ game: Object.keys(this.games) });

    data.forEach((stream) => {
      const titleWords = stream.title.toLowerCase().match(/\b(\w+)\b/g);

      if (titleWords && stream.type === 'live' && titleWords.filter(value => -1 !== this.whitelist.indexOf(value)).length) {
        // found a stream that looks like a speedrun
        currentStreams.push(stream);
      }
    });

    this.activeStreams = currentStreams.map((stream) => {
      if (!this.activeStreams.find((id) => stream.id === id )) {
        // new stream, post message in server
        streamChannel.send(`${stream.userDisplayName} is streaming ${this.games[stream.gameId]}: \`${stream.title}\`\nhttps://twitch.tv/${stream.userDisplayName.toLowerCase()}`);
      }

      stream.id;
    });

    currentStreams.length && console.log(`active: ${this.activeStreams} \ncurrent: ${currentStreams}\n`);
  }
}

const discordBot = new Bot;
