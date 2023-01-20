const { db } = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(i) {
    if (i.isCommand()) {
      console.log(`User: ${i.member.displayName} | Command: ${i.toString()} | Channel: ${i.channel.name}`);

      const command = i.client.commands.get(i.commandName);

      // if (command.requiredRole && i.member.id !== process.env.OWNER)
      //   return i.reply({ content: 'You are missing the required role to use this command.', ephemeral: true });
      // if (command.adminOnly && i.member.id !== process.env.OWNER)
      //   return i.reply({ content: 'Only the bot administrator may use this command.', ephemeral: true });

      await command.execute(i);
    }

    if (i.isAutocomplete()) {
      console.time(`${i.id} Autocomplete`);
      const focused = await i.options.getFocused(true);

      function isIncluded(value) {
        if (
          focused.value === '' ||
          value.name?.includes(focused.value) ||
          value.name?.toLowerCase().includes(focused.value) ||
          value.abbr?.includes(focused.value) ||
          value.abbr?.toLowerCase().includes(focused.value)
        ) {
          return true;
        } else {
          return false;
        }
      }

      if (focused.name === 'guild') {
        const choices = await db.collection('guilds').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await i.respond(
            filtered.map(choice => ({
              name: `${choice.name} (${choice.abbr})`,
              value: choice.name,
            }))
          );
      }

      if (focused.name === 'tier') {
        const choices = await db.collection('tiers').find().sort({ number: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await i.respond(
            filtered.map(choice => ({
              name: `Tier ${choice.number}`,
              value: choice.number,
            }))
          );
      }

      if (focused.name === 'abilityname') {
        const choices = await db.collection('abilities').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25)
          await i.respond(
            filtered.map(choice => ({
              name: `${choice.name} (${choice.character_base_id ?? choice.ship_base_id})`,
              value: choice.base_id,
            }))
          );
      }

      if (focused.name === 'charactername') {
        const choices = await db.collection('characters').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25) await i.respond(filtered.map(choice => ({ name: choice.name, value: choice.base_id })));
      }

      if (focused.name === 'shipname') {
        const choices = await db.collection('ships').find().sort({ name: 1 }).toArray();
        const filtered = await choices.filter(isIncluded);
        if (filtered.length < 25) await i.respond(filtered.map(choice => ({ name: choice.name, value: choice.base_id })));
      }

      console.timeEnd(`${i.id} Autocomplete`);
    }
  },
};
