const { db } = require('../database');

module.exports = {
  name: 'interactionCreate',

  async execute(i) {
    if (i.isCommand()) {
      /**
       * Trying to track down a pesky expired token bug that crops up every so often.
       * Logging: time from interaction creation to start of this function (to identify gaps between Discord gateway and bot)
       * and time from interaction processing start to initial response (needs to be <3 seconds)
       */
      console.log(`User: ${i.member.displayName} | Command: ${i.toString()} | Channel: ${i.channel.name}`);
      console.log(`${i.id} Execution Time: ${Date.now() - i.createdTimestamp} ms`);
      console.time(`${i.id} Response`);

      const command = i.client.commands.get(i.commandName);

      if (command.requiredRole && i.member.id !== process.env.OWNER)
        return i.reply({ content: 'You are missing the required role to use this command.', ephemeral: true });
      if (command.adminOnly && i.member.id !== process.env.OWNER)
        return i.reply({ content: 'Only the bot administrator may use this command.', ephemeral: true });

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
