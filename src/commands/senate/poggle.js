const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poggle')
    .setDescription('STOP PUTTING POTENCY ON POGGLE.'),

  async execute(i) {
    await i.reply(
      `\nSTOP PUTTING POTENCY ON POGGLE.\n\nMost ability block skills say something like "Do damage to the target and inflict Ability Block for one turn". When this happens, your unit's Potency and the enemy unit's Tenacity are used to determine the chance that the Ability Block will be applied.\n\nPoggle's basic ability reads "Deal physical damage to target enemy with an 80% chance to inflict Ability Block for one turn." This 80% number **cannot be changed**, so Poggle's Potency is *irrelevant*. There will always be an 80% chance for the AB to be applied.\n\nPoggle is on a team with Geonosian Soldier, who applies Tenacity Down on basic. Tenacity Down reduces the enemy unit's Tenacity to the minimum possible value, which is 15%. This means there is **always** a 15% chance that Poggle's Ability Block will be resisted by an enemy with Tenacity Down.\n\nBecause the 15% chance to resist and the 80% chance to apply are independent events, we multiply 0.80 * 0.85 to determine that...\n\n**THERE IS ALWAYS, EXACTLY, A 68% CHANCE THAT POGGLE WILL LAND ABILITY BLOCK ON AN ENEMY WITH TENACITY DOWN.**\n\nSince Poggle's only debuff is this Ability Block, and Potency does not change the chance it will land, Potency is *literally worthless* on Poggle and anyone who tells you to put a Potency mod set or Potency cross on Poggle is a goober.`
    );
  },
};
