const { EmbedBuilder, roleMention, userMention, hyperlink, ComponentType } = require('discord.js');
const config = require('../config');
const createWelcomeImage = require('./createWelcomeImage');
const welcomeMenu = require('./welcomeMenu');

module.exports = async m => {
  if (m.user.bot) return;
  await m.roles.add(await m.guild.roles.fetch(config.roles.potentialGuildMember));

  const welcomeImage = await createWelcomeImage(m.user.username);

  const landingBay = await m.client.channels.fetch(config.channels.landingBay);
  await landingBay.send({ files: [welcomeImage] });
  const menuMessage = await landingBay.send({
    content: `Greetings, ${m.user}, and welcome to THE SENATE!\nTo help us serve you, please select an option from the following menu.`,
    components: [welcomeMenu],
  });

  // welcomeMenu should only accept responses from the new user
  const menuFilter = i => {
    i.deferUpdate();
    return i.user.id === m.id;
  };

  menuMessage
    .awaitMessageComponent({
      filter: menuFilter,
      componentType: ComponentType.SelectMenu,
    })
    .then(async i => {
      const embed = new EmbedBuilder().setTitle(`New User: ${m.user.username}`).addFields([
        {
          name: 'Landing Bay Link:',
          value: `${hyperlink(`Welcome Menu Post: ${m.user.username}`, welcomeMenu.url)}`,
        },
      ]);
      const selected = i.values.join();

      const recruitment = await m.client.channels.fetch(config.channels.recruitmentRoom);
      const art = await m.client.channels.fetch(config.channels.allianceRecruitmentTeam);

      if (selected === 'kick') {
        await recruitment.send(
          `${userMention('223492830297849856')}: a user clicked your button and was kicked from the server!`
        );
        await m.kick('Selected the KICK ME menu option');
      }

      if (selected === 'newguild') {
        embed.setDescription('is looking for a __guild to join__!');
        await recruitment.send({
          content: `${roleMention(config.roles.greeter)}`,
          embeds: [embed],
        });
        return welcomeMenu.edit({
          content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.\nIn the meantime, *please share a SWGOH.gg link or ally code for our recruiters to review.*`,
          components: [],
        });
      }

      if (selected === 'merger') {
        embed.setDescription('is here to __discuss a merger__');
        await art.send({
          content: `${roleMention(config.roles.allianceRecruitmentTeam)}`,
          embeds: [embed],
        });
        await recruitment.send(
          `${m.user.username} is here to discuss a merger. The Alliance Recruitment Team has been notified!`
        );
        return welcomeMenu.edit({
          content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.`,
          components: [],
        });
      }

      if (selected === 'omegabot') {
        embed.setDescription('is here to __learn about OmegaBot__!');
        await recruitment.send({
          content: `${roleMention(config.roles.greeter)}`,
          embeds: [embed],
        });
        return welcomeMenu.edit({
          content:
            'Thank you for your interest! For more information on OmegaBot, please visit the OmegaBot Discord server: http://omegabot.thesenate.gg',
          components: [],
        });
      }

      if (selected === 'shard') {
        embed.setDescription('is here to __find someone from their arena shard__!');
        await recruitment.send({
          content: `${roleMention(config.roles.greeter)}`,
          embeds: [embed],
        });
        return welcomeMenu.edit({
          content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.`,
          components: [],
        });
      }

      if (selected === 'other') {
        embed.setDescription('is here for __an unspecified reason__');
        await recruitment.send({
          content: `${roleMention(config.roles.greeter)}`,
          embeds: [embed],
        });
        return welcomeMenu.edit({
          content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.`,
          components: [],
        });
      }
    });
};
