const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gacphase')
    .setDescription('If applicable, show information about the current GAC phase.'),

  async execute(i) {
    await i.deferReply();

    const allPhases = await db.collection('events').find({}).sort({ name: 1, season: 1 }).toArray();
    const filteredPhases = allPhases.filter(phase => {
      phase.start <= Date.now() && phase.end >= Date.now();
    });

    if (!filteredPhases.length === 1)
      return i.editReply(
        'No applicable GAC phase was found; there is either no GAC event active or the events calendar is out of date.'
      );
    const currentPhase = filteredPhases[0];

    const embed = new EmbedBuilder()
      .setTitle(currentPhase.name)
      .setDescription(currentPhase.season)
      .addFields([
        {
          name: 'Start',
          value: `<t:${Math.floor(currentPhase.start / 1000)}:f>\n<t:${Math.floor(currentPhase.start / 1000)}:R>`,
        },
        {
          name: 'End',
          value: `<t:${Math.floor(currentPhase.end / 1000)}:f>\n<t:${Math.floor(currentPhase.end / 1000)}:R>`,
        },
      ])
      .setThumbnail('https://cdn.discordapp.com/attachments/1034667391570940046/1073378286958284910/gac.jpg');
    return i.editReply({ embeds: [embed] });
  },
};
