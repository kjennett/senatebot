const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gacphase')
    .setDescription('If applicable, show information about the current GAC phase.'),

  async execute(i) {
    await i.deferReply();

    const allPhases = await db.collection('events').find({}).toArray();
    const currentPhase = allPhases.filter(phase => {
      phase.start <= Date.now() && phase.end >= Date.now();
    });
    if (!currentPhase.length === 1)
      return i.editReply(
        'No applicable GAC phase was found; there is either no GAC event active or the events calendar is out of date.'
      );

    const embed = new EmbedBuilder().setTitle(currentPhase.name).setDescription(currentPhase.season);
    return i.editReply({ embeds: [embed] });
  },
};
