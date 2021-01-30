const { Client, MessageEmbed } = require('discord.js');
const { hiscores } = require('osrs-json-api');
const TwitchClient = require('twitch').default;
const ENV = require('dotenv').config().parsed;
const fs = require('fs');

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

//      setInterval(() => {
//        this.getStreams(true);
//      }, 60 * 1000);

//      this.getStreams();

      setInterval(() => {
	var d = new Date();

        d.getHours() == 12 && d.getMinutes() == 0 && this.getXp(); // run at noon
      }, 60 * 1000);

      this.getXp();
    });
    
    bot.on('message', (message) => {
      message.content === '!ping' && message.channel.send("I'm alive");
    });
  };

  getXp() {
    const raw = fs.readFileSync('data.json');
    const fileData = JSON.parse(raw);
    const streamChannel = bot.channels.cache.get('696765786542440540');

    fileData.players.forEach(p => {
      let { data } = p;

      hiscores.getPlayer(p.name, p.gamemode || 'main').then((res) => {
        const previous = p.data[p.data.length - 1]

        if (previous) {
          let message = '';

          for (const skill in res.skills) { 
            const difference = +res.skills[skill].xp - +previous.skills[skill].xp;

            difference && (message += `\n${skill.toTitleCase()}: ${difference}${skill === 'overall' ? '\n' : null}`);
          }

          message.length && streamChannel.send(p.name + ' gained XP:```' + message + '```');
        }

        p.data.push(res);
        fs.writeFileSync('data.json', JSON.stringify(fileData, null, 2));
      }); 
    }); 
  }

  async getStreams(postMessage = false) {
    const currentStreams = [];
    const streamChannel = bot.channels.cache.get('696765786542440540');

    const { data } = await client.helix.streams.getStreams({ game: Object.keys(games) });

    await data.forEach((stream) => {
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
        embed.setTitle(`${stream.userDisplayName} is streaming ${games[stream.gameId]}: ${stream.title}`).setColor(0x6441A4).setDescription(`https://twitch.tv/${stream.userDisplayName.toLowerCase()}`);

        //currentStreams.length && console.log(`active: ${JSON.stringify(this.activeStreams)} \ncurrent: ${JSON.stringify(currentStreams)}\n`);
        postMessage && streamChannel.send(embed);
      }

      return stream.id;
    });

    this.activeStreams.length && console.log(JSON.stringify(this.activeStreams));
  }
}

String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  })
};

const discordBot = new Bot;
discordBot.run();
