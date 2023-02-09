const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gacphase')
    .setDescription('If applicable, show information about the current GAC phase.'),

  async execute(i) {
    await i.deferReply();

    const allPhases = await db.collection('events').find({}).toArray();
    const currentPhaseIndex = allPhases.findIndex(phase => phase.start <= Date.now() && phase.end >= Date.now());
    if (currentPhaseIndex === -1) return i.editReply('No currently running GAC phase was found in the events database.');

    console.log(allPhases[currentPhaseIndex]);

    const embed = new EmbedBuilder()
      .setTitle(allPhases[currentPhaseIndex].name)
      .setDescription(allPhases[currentPhaseIndex].season)
      .addFields([
        {
          name: 'Start',
          value: `<t:${Math.floor(allPhases[currentPhaseIndex].start / 1000)}:f>\n<t:${Math.floor(
            allPhases[currentPhaseIndex].start / 1000
          )}:R>`,
        },
        {
          name: 'End',
          value: `<t:${Math.floor(allPhases[currentPhaseIndex].end / 1000)}:f>\n<t:${Math.floor(
            allPhases[currentPhaseIndex].end / 1000
          )}:R>`,
        },
      ])
      .setThumbnail('https://cdn.discordapp.com/attachments/1034667391570940046/1073378286958284910/gac.jpg');
    return i.editReply({ embeds: [embed] });
  },
};
