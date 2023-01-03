const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchGuildProfile, fetchAllAccounts } = require('../../api/swgohgg');
const { db } = require('../../database');
const { guildChoices } = require('../../configs/guildChoices');
const { glRequirements } = require('../../configs/glRequirements');
const { glNames } = require('../../configs/glNames');

// distinct array of base ids required for all GLs
const glRequiredUnits = [...new Set(Object.keys(Object.values(glRequirements)))];

// array of base ids for all GLs
const GLs = Object.keys(glRequirements);

let glRequirementKeys = {};
for (let i = 0; i < GLs.length; i++) {
  glRequirementKeys[GLs[i]] = Object.keys(glRequirements[GLs[i]]);
}

Object.freeze(glRequirementKeys);

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('guildUpcomingGLs')
    .setDescription('Checks who is close (~25% threshold) to each GL.')
    .addStringOption(o =>
      o
        .setName('guild')
        .setDescription('The guild to pull member information about.')
        .addChoices(...guildChoices)
        .setRequired(true)
    ),

  async execute(i) {
    await i.deferReply();
    console.timeEnd(`${i.id} Response`);

    const guildName = i.options.getString('guild');

    const dbGuild = await db.collection('guilds').findOne({ name: guildName });
    if (!dbGuild) return i.editReply(`Guild ${guildName} was not found in the database.`);
    if (!dbGuild.gg) return i.editReply(`Unable to find a SWGOH.GG guild ID for ${guildName}.`);

    const ggGuildData = await fetchGuildProfile(dbGuild.gg);
    if (!ggGuildData) return i.editReply(`Unable to retrieve SWGOH.GG guild profile data for ${guildName}.`);

    const allyCodes = ggGuildData.data.members.map(member => member.ally_code).filter(allyCode => allyCode !== null);
    let couldntCheck = ggGuildData.data.members.filter(member => member.ally_code === null).map(member => member.player_name);

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

    const threshold = 0.25;
    let close = {};
    for (let i = 0; i < GLs.length; i++) {
      close[GLs[i]] = {};
    }

    for (let i = 0; i < ggAccountsData.length; i++) {
      // filter account unit array to just units that are GLs or required for a GL
      const accountGLsAndGLRequiredUnits = ggAccountsData[i].units.filter(unit => GLs.includes(unit.data.base_id) || glRequiredUnits.includes(unit.data.base_id));

      // iterate over the GL base ids
      for (let j = 0; j < GLs.length; j++) {
        // If they have it, skip it
        if (accountGLsAndGLRequiredUnits.find(unit => unit.data.base_id === GLs[j])) continue;

        let glReqs = glRequirementKeys[GLs[j]]; // get array of requirement base ids for current GL

        // initialize requirement counters
        let pass = 0;
        let fail = 0;

        // iterate over list of current GL requirement base ids
        for (let k = 0; k < glReqs.length; k++) {
          // grab the specific requirement
          let unit = accountGLsAndGLRequiredUnits.find(unit => unit.data.base_id === glReqs[k]);

          // if it exists
          if (unit) {
            // if it's a ground unit, check relic tier of glRequirements[GLBaseID][RequirementBaseID]. increment pass on success
            if (unit.data.combat_type === 1 && unit.data.relic_tier - 2 >= glRequirements[GLs[j]][glReqs[k]]) pass++;
            // if it's a fleet unit, check rarity of ship. increment pass on success
            else if (unit.data.combat_type === 2 && unit.data.rarity >= glRequirements[GLs[j]][glReqs[k]]) pass++;
            else fail++; // else, increment fail counter
          } else fail++; // else, unit doesn't existincrement fail counter
        }

        // using the number of unit requirements / threshold rounded up
        const closeThreshold = Math.ceil(glReqs.length * threshold);
        if (fail <= closeThreshold) {
          close[GLs[j]][ggAccountsData[i].data.name] = pass;
        }
      }
    }

    const embed = new EmbedBuilder().setTitle(`Guild GL Breakdown - ${guildName}`);
    for (let i = 0; i < GLs.length; i++) {
      let GLName = glNames[GLs[i]]; // get GL name
      if (GLName === undefined) GLName = GLs[i]; // fallback to base ID if needed
      const totalReqs = glRequirementKeys[GLs[i]].length; // get number of unit requirements

      // create an array of entries where entry[0] == account name and entry[1] == passing requirements
      // sort the array of entries by # of passing requirements and alphabetical order
      let closePairs =
        Object
          .entries(close[GLs[i]])
          .sort((a, b) => {
            let c = b[1] - a[1];
            if (c !== 0) return c;
            else return a[0].localeCompare(b[0]);
          });

      // build strings of the format `Account Name: (11/14)`
      const closeStrings = closePairs.map(pair => `${pair[0]}: (${pair[1]}/${totalReqs})`)
      embed.addFields([
        {
          name: `${GLName} - Close: ${closePairs.length}`,
          value: `${closeStrings.length > 0 ? '-----' : closeStrings.join('\n')}`,
        }
      ]);
    }

    // add list of people we failed to check, just for completions sake
    if (couldntCheck > 0) {
      embed.addFields([
        {
          name: `Couldn't Check: ${couldntCheck.length}/${ggGuildData.data.members.length}.`,
          value: couldntCheck.join('\n'),
        }
      ])
    }

    return await i.editReply({ embeds: [embed] });
  },
};
