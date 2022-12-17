const { extractAllyCode } = require('../../lib/account/extractAllyCode');
const { fetchAccount } = require('../../api/swgohgg');
const { config } = require('../../config');
const { accountSummary } = require('../../lib/account/accountSummary');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  enabled: true,

  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Open a player transfer thread in the Galactic Trade Federation.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Whether the transfer is temporary (i.e. mercing for TB), or permanent.')
        .setRequired(true)
        .addChoices({ name: 'Temporary (Merc/Backpack)', value: 'TEMP' }, { name: 'Permanent', value: 'TRANSFER' })
    )
    .addStringOption(option =>
      option.setName('allycode').setDescription('Ally code OR swgoh.gg profile for the account.').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('notes').setDescription('The reason for the transfer, as well as ').setRequired(true)
    ),

  async execute(i) {
    await i.deferReply({ ephemeral: true });

    if (!i.member.roles.cache.has(config.roles.guildOfficer))
      return i.editReply('You must have the Guild Officer role to list players for transfer.');

    const [type, allycode, notes] = await Promise.all([
      i.options.getString('type'),
      i.options.getString('allycode'),
      i.options.getString('notes'),
    ]);

    // Extract an ally code from the provided input
    const ally = extractAllyCode(allycode);
    if (!ally) return i.editReply('Unable to determine ally code using the provided input.');

    // Fetch SWGOH.GG game data for the account, return error if not available
    const ggData = await fetchAccount(ally);
    if (!ggData)
      return i.editReply(
        `Unable to find SWGOH.GG data for ally code ${ally}. Please scan this ally code to add the account to SWGOH.GG: https://swgoh.gg/scan-player/`
      );

    // Generate an account summary embed for the account.
    const summary = await accountSummary(ggData);

    // Create a thread for the recruit in the recruitment channel
    const tradeChannel = await i.client.channels.fetch(config.channels.tradeFederation);
    const thread = await tradeChannel.threads.create({
      name: `${type} - ${ggData.data.name}`,
      autoArchiveDuration: 10080,
    });
    await thread.join();
    await thread.send(summary);

    // Post the reason for transfer in the thread
    const notesEmbed = new EmbedBuilder().setTitle('Reason for Transfer').setDescription(notes);
    await thread.send({ embeds: [notesEmbed] });
    await thread.send(':no_entry: **DO NOT contact this player yet!** :no_entry:');

    return i.editReply(
      'Transfer thread created. Use `/informed` in the thread once the player has been informed of their transfer.'
    );
  },
};
