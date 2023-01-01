const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchGuildProfile, fetchAllAccounts } = require('../../api/swgohgg');
const { db } = require('../../database');

function KAMReadiness(ggAccountData) {
  const shaakTrooperIDs = ['SHAAKTI', 'CT7567', 'CT210408', 'CT5555', 'ARCTROOPER501ST'];
  const badBatchIDs = ['BADBATCHHUNTER', 'BADBATCHECHO', 'BADBATCHTECH', 'BADBATCHWRECKER', 'BADBATCHOMEGA'];

  let shaakTroopers = [];
  let badBatch = [];

  for (let i = 0; i < ggAccountData.units.length; i++) {
    if (shaakTrooperIDs.includes(ggAccountData.units[i].data.base_id)) {
      if (ggAccountData.units[i].data.power < 22000) shaakTroopers.push(2); // worst case, cant use, push 2
      else if (ggAccountData.units[i].data.relic_tier < 7) shaakTroopers.push(1); // maybe ready, push 1
      else shaakTroopers.push(0); // ready character

      if (shaakTroopers.length === shaakTrooperIDs.length && badBatch.length === badBatchIDs.length) break; // end loop if we've looked at all necessary characters
    }
    if (badBatchIDs.includes(ggAccountData.units[i].data.base_id)) {
      if (ggAccountData.units[i].data.power < 22000) badBatch.push(2); // worst case, cant use, push 2
      else if (ggAccountData.units[i].data.relic_tier < 7) badBatch.push(1); // maybe ready, push 1
      else badBatch.push(0);

      if (shaakTroopers.length === shaakTrooperIDs.length && badBatch.length === badBatchIDs.length) break; // end loop if we've looked at all necessary characters
    }
  }

  if (shaakTroopers.length < shaakTrooperIDs.length) shaakTroopers.push(2); // if we didn't find a character, push a 2 for not ready
  if (badBatch.length < badBatchIDs.length) badBatch.push(2); // if we didn't find a character, push a 2 for not ready

  // return best case of bad batch and shaak trooper options using worst case from each.
  return Math.min(Math.max(...shaakTroopers), Math.max(...badBatch));
}

function WatReadiness(ggAccountData) {
  const geoIDs = ['GEONOSIANBROODALPHA', 'SUNFAC', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'POGGLETHELESSER'];
  let geos = [];

  for (let i = 0; i < ggAccountData.units.length; i++) {
    if (geoIDs.includes(ggAccountData.units[i].data.base_id)) {
      if (ggAccountData.units[i].data.power < 16500) geos.push(2); // worst case, can't use (doesn't meet power threshold), push 2
      else if (ggAccountData.units[i].data.gear_level < 12) geos.push(1); // maybe ready, push 1 (meets power level, but not >= G12)
      else geos.push(0); // above power level of 16,500 and >= G12

      if (geos.length === geoIDs.length) break; // end loop if we've looked at all necessary characters
    }
  }

  if (geos.length < geoIDs.length) geos.push(2); // couldn't find at least one character, add 2 for not ready

  return Math.max(...geos); // returns worst case geo for readiness indicator
}

function RevaReadiness(ggAccountData) {
  const GI = 'GRANDINQUISITOR';
  const inquisitors = ['EIGHTHBROTHER', 'FIFTHBROTHER', 'NINTHSISTER', 'SECONDSISTER', 'SEVENTHSISTER', 'THIRDSISTER'];

  let GIPass = false;
  let inquisitorsSeen = 0;
  let inquisitorsPass = 0;

  for (let i = 0; i < ggAccountData.units.length; i++) {
    if (!GIPass && ggAccountData.units[i].data.base_id === GI) { // Grand Inquisitor Check
      if (ggAccountData.units[i].data.relic_tier < 9) return 2; // return failure if not R7
      GIPass = true;
      if (inquisitorsSeen === inquisitors.length || inquisitorsPass >= 4) break; // if we've seen GI and all inquisitors we need to check (or 4 have passed), we can break out of the loop.
    }
    if (inquisitors.includes(ggAccountData.units[i].data.base_id)) { // general inquisitor check
      inquisitorsSeen++; // increase number seen
      if (ggAccountData.units[i].data.relic_tier >= 9) inquisitorsPass++; // if above R7, increase passing counter
      if (GIPass && (inquisitorsSeen === inquisitors.length || inquisitorsPass >= 4)) break; // if GI has passed, and we've seen all inquisitors (or 4 inquisitors have passed), we're done
    }
  }
  return GIPass && inquisitorsPass >= 4 ? 0 : 2; // if we have GI and at least 4 inquisitors, technically ready, otherwise not.
}

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('guildreadiness')
    .setDescription('Displays guild readiness for TB Character Special Missions.')
    .addStringOption(o =>
      o
        .setName('guild')
        .setDescription('The guild to pull member information about.')
        .setAutocomplete(true)
        .setRequired(true)
    ).addStringOption(o =>
      o
        .setName('character')
        .setDescription('Check guild readiness for the specified character.')
        .setRequired(true)
        .setAutocomplete(true)
        .addChoices(
          { name: 'Wat Tambor', value: 'Wat Tambor' },
          { name: 'Ki-Adi-Mundi', value: 'Ki-Adi-Mundi' },
          { name: 'Third Sister', value: 'Third Sister' }
        )
    ).addBooleanOption(o =>
      o
        .setName("detailed")
        .setDescription("List users at each step in the readiness check.")
        .setRequired(false)
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
    if (!ggGuildData)
      return i.editReply(`Unable to retrieve SWGOH.GG guild profile data for ${guildName}.`);

    const allyCodes = ggGuildData.data.members.map((member) => member.ally_code);
    const ggAccountsData = fetchAllAccounts(allyCodes);

    if (!ggAccountsData || ggAccountsData.length === 0) return i.editReply(`Unable to retrieve SWGOH.GG account profile data.`);

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
      if (accountReadiness === 0) ready.push(ggAccountsData[i].data.name);
      else if (accountReadiness === 1) maybeReady.push(ggAccountsData[i].data.name);
      else notReady.push(ggAccountsData[i].data.name);
    }

    const embed = new EmbedBuilder()
      .setTitle(`${character} Readiness Accounts - ${guildName}`);

    if (detailed) {
      if (ready.length > 0) {
        embed.addFields([{
          name: `Ready: ${ready.length}/${ggAccountsData.length}`,
          value: ready.join('\n'),
        }]);
      }
      if (maybeReady.length > 0) {
        embed.addFields([{
          name: `Maybe Ready: ${maybeReady.length}/${ggAccountsData.length}`,
          value: maybeReady.join('\n'),
        }]);
      }
      if (notReady.length > 0) {
        embed.addFields([{
          name: `Not Ready: ${notReady.length}/${ggAccountsData.length}`,
          value: notReady.join('\n'),
        }]);
      }
    } else {
      let descriptionStrings = [];
      if (ready.length > 0) descriptionStrings.push(`Ready: ${ready.length}/${ggAccountsData.length}`);
      if (maybeReady.length > 0) descriptionStrings.push(`Maybe Ready: ${maybeReady.length}/${ggAccountsData.length}`);
      if (notReady.length > 0) descriptionStrings.push(`Not Ready: ${notReady.length}/${ggAccountsData.length}`);
      embed.setDescription(descriptionStrings.join('\n'));
    }

    return await i.editReply({ embeds: [embed] });
  },
};
