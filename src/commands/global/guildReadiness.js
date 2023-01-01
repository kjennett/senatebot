const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchGuildProfile, fetchAllAccounts } = require('../../api/swgohgg');
const { db } = require('../../database');

function KAMReadiness(ggAccountData) {
  let shaakTroopersReadiness = 0;
  let badBatchReadiness= 0;

  let shaakTrooperCount = 0;
  let badBatchCount = 0;

  const shaakTrooperIDs = ['SHAAKTI', 'CT7567', 'CT210408', 'CT5555', 'ARCTROOPER501ST'];
  const badBatchIDs = ['BADBATCHHUNTER', 'BADBATCHECHO', 'BADBATCHTECH', 'BADBATCHWRECKER', 'BADBATCHOMEGA'];

  for (let i = 0; i < ggAccountData.units.length; i++) {
    if (shaakTrooperIDs.includes(ggAccountData.units[i].data.base_id)) {
      shaakTrooperCount++; // update number of shaak troopers seen
      if (ggAccountData.units[i].data.power < 22000) shaakTroopersReadiness = 2; // worst case
      if (ggAccountData.units[i].data.relic_tier < 7 && shaakTroopersReadiness < 2) shaakTroopersReadiness = 1; // only set to 1 if already < 2
      if (shaakTrooperCount === shaakTrooperIDs.length && badBatchCount === badBatchIDs.length) break; // end loop if we've looked at all necessary characters
    }
    if (badBatchIDs.includes(ggAccountData.units[i].data.base_id)) {
      badBatchCount++; // update number of bad batch seen
      if (ggAccountData.units[i].data.power < 22000) badBatchReadiness = 2; // worst case
      if (ggAccountData.units[i].data.relic_tier < 7 && badBatchReadiness < 2) badBatchReadiness = 1; // only set to 1 if already < 2
      if (shaakTrooperCount === shaakTrooperIDs.length && badBatchCount === badBatchIDs.length) break; // end loop if we've looked at all necessary characters
    }
  }
  return Math.min(shaakTroopersReadiness, badBatchReadiness); // return best case
}

function WatReadiness(ggAccountData) {
  let readiness = 0;
  let count = 0;

  const geos = ['GEONOSIANBROODALPHA', 'SUNFAC', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'POGGLETHELESSER'];

  for (let i = 0; i < ggAccountData.units.length; i++) {
    if (geos.includes(ggAccountData.units[i].data.base_id)) {
      count++; // update number of geos seen
      if (ggAccountData.units[i].data.power < 16500) readiness = 2; // worst case
      if (ggAccountData.units[i].data.gear_level < 12 && readiness < 2) readiness = 1; // only set to 1 if already < 2
      if (count === geos.length) break; // end loop if we've looked at all necessary characters
    }
  }
  return readiness;
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
        .setName('Guild')
        .setDescription('The guild to pull member information about.')
        .setAutocomplete(true)
        .setRequired(true)
    ).addStringOption(o =>
      o
        .setName('Character')
        .setDescription('Check guild readiness for the specified character mission.')
        .setRequired(true)
        .setAutocomplete(true)
        .addChoices(
          { name: 'Wat Tambor', value: 'Wat Tambor' },
          { name: 'Ki-Adi-Mundi', value: 'Ki-Adi-Mundi' },
          { name: 'Third Sister', value: 'Third Sister' }
        )
    ).addBooleanOption(o =>
      o
        .setName("Detailed")
        .setDescription("List users at each step in the readiness check.")
        .setRequired(false)
    ),

  async execute(i) {
    await i.deferReply();
    console.timeEnd(`${i.id} Response`);

    const guildName = i.options.getString('Guild');
    const character = i.options.getString('Character');
    const detailed = i.options.getBoolean('Detailed');

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
