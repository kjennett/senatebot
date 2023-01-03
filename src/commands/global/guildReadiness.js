const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchGuildProfile, fetchAllAccounts } = require('../../api/swgohgg');
const { db } = require('../../database');
const { guildChoices } = require('../../configs/guildChoices');
const { Readiness, KAMReadiness, WatReadiness, RevaReadiness } = require('../../lib/guild/guildReadinessChecks');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('guildreadiness')
    .setDescription('Displays guild readiness for TB Character Special Missions.')
    .addStringOption(o =>
      o
        .setName('guild')
        .setDescription('The guild to pull member information about.')
        .addChoices(...guildChoices)
        .setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName('character')
        .setDescription('Check guild readiness for the specified character.')
        .setRequired(true)
        /**
         * I removed the autocomplete flag here. The choices flag means the option input must be one of the provided choice options -
         * since autocomplete responses could be anything, a command option can't use choices and autocomplete together. The actual API error
         * return says "autocomplete and choices are mutually exclusive".
         */
        .addChoices(
          { name: 'Wat Tambor', value: 'Wat Tambor' },
          { name: 'Ki-Adi-Mundi', value: 'Ki-Adi-Mundi' },
          { name: 'Third Sister', value: 'Third Sister' }
        )
    )
    .addBooleanOption(o =>
      o.setName('detailed').setDescription('List users at each step in the readiness check.').setRequired(false)
    ),

  async execute(i) {
    await i.deferReply();
    console.timeEnd(`${i.id} Response`);

    const guildName = i.options.getString('guild');
    const character = i.options.getString('character');
    const detailed = i.options.getBoolean('detailed');

    const dbGuild = await db.collection('guilds').findOne({ name: guildName });
    if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);
    if (!dbGuild.gg) return i.editReply(`Unable to find a SWGOH.GG guild ID for ${guildName}.`);

    const ggGuildData = await fetchGuildProfile(dbGuild.gg);
    if (!ggGuildData) return i.editReply(`Unable to retrieve SWGOH.GG guild profile data for ${guildName}.`);

    // get an array of valid ally codes from the .GG guild data member list
    const allyCodes = ggGuildData.data.members.map(member => member.ally_code).filter(allyCode => allyCode !== null);
    // get a list of player names where ally code for the member was null and add it to the couldn't check list
    let couldntCheck = ggGuildData.data.members.filter(member => member.ally_code === null).map(member => member.player_name);

    /** Added an "await" here - couldn't figure out why all the embeds were coming back empty! lol. */
    const ggAccountsData = await fetchAllAccounts(allyCodes);
    if (!ggAccountsData || ggAccountsData.length === 0)
      return i.editReply(`Unable to retrieve SWGOH.GG account profile data.`);

    // if we pass this conditional, we failed at least one request from .GG
    if (ggAccountsData.length < allyCodes.length) {
      // grab ally codes for the fulfilled .GG requests
      const successfullyFetchedAllyCodes = ggAccountsData.map(account => account.data.ally_code);
      // use the array we attempted to fetch and the array we did fetch to determine which ones failed.
      const failedToFetchAllyCodes = allyCodes.filter(allyCode => !successfullyFetchedAllyCodes.includes((allyCode)));
      // use the array of failed ally codes to grab player names from the .GG guild data
      const failedToFetchMembers = ggGuildData.data.members.filter(member => failedToFetchAllyCodes.includes(member.ally_code)).map(member => member.player_name);
      // add list of names that we couldn't check to the couldn't check array
      couldntCheck = couldntCheck.concat(failedToFetchMembers);
    }

    let notReady = [];
    let maybeReady = [];
    let ready = [];

    let readinessFunction;
    switch (character) {
      case 'Wat Tambor':
        readinessFunction = WatReadiness;
        break;
      case 'Ki-Adi-Mundi':
        readinessFunction = KAMReadiness;
        break;
      case 'Third Sister':
        readinessFunction = RevaReadiness;
        break;
      default:
        return i.editReply(`Unable to determine character readiness decision.`);
    }

    for (let i = 0; i < ggAccountsData.length; i++) {
      const accountReadiness = readinessFunction(ggAccountsData[i]);
      switch (accountReadiness) {
        case Readiness.READY:
          ready.push(ggAccountsData[i].data.name);
          break;
        case Readiness.MAYBE_READY:
          maybeReady.push(ggAccountsData[i].data.name);
          break;
        case Readiness.NOT_READY:
          notReady.push(ggAccountsData[i].data.name);
          break;
        default:
          couldntCheck.push(ggAccountsData[i].data.name);
          break;
      }
    }

    const embed = new EmbedBuilder().setTitle(`${character} Readiness Accounts - ${guildName}`);

    if (detailed) {
      if (ready.length > 0) {
        embed.addFields([
          {
            name: `Ready: ${ready.length}/${ggGuildData.data.members.length}`,
            value: ready.join('\n'),
          },
        ]);
      }
      if (maybeReady.length > 0) {
        embed.addFields([
          {
            name: `Maybe Ready: ${maybeReady.length}/${ggGuildData.data.members.length}`,
            value: maybeReady.join('\n'),
          },
        ]);
      }
      if (notReady.length > 0) {
        embed.addFields([
          {
            name: `Not Ready: ${notReady.length}/${ggGuildData.data.members.length}`,
            value: notReady.join('\n'),
          },
        ]);
      }
      if (couldntCheck.length > 0) {
        embed.addFields([
          {
            name: `Couldn't Check: ${couldntCheck.length}/${ggGuildData.data.members.length}`,
            value: couldntCheck.join('\n'),
          }
        ])
      }
    } else {
      let descriptionStrings = [];
      if (ready.length > 0) descriptionStrings.push(`Ready: ${ready.length}/${ggGuildData.data.members.length}`);
      if (maybeReady.length > 0) descriptionStrings.push(`Maybe Ready: ${maybeReady.length}/${ggGuildData.data.members.length}`);
      if (notReady.length > 0) descriptionStrings.push(`Not Ready: ${notReady.length}/${ggGuildData.data.members.length}`);
      if (couldntCheck.length > 0) descriptionStrings.push(`Couldn't Check: ${couldntCheck.length}/${ggGuildData.data.members.length}`);
      embed.setDescription(descriptionStrings.join('\n'));
    }

    return await i.editReply({ embeds: [embed] });
  },
};
