const { EmbedBuilder, roleMention, userMention, hyperlink } = require('discord.js');
const config = require('../config');
const createWelcomeImage = require('../welcome/createWelcomeImage');
const welcomeMenu = require('../welcome/welcomeMenu');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    if (member.user.bot) return;
    await member.roles.add(await member.guild.roles.fetch(config.roles.potentialGuildMember));

    const welcomeImage = await createWelcomeImage(member.user.username);

    const landingBay = await member.client.channels.fetch(config.channels.landingBay);
    await landingBay.send({ files: [welcomeImage] });
    const menuMessage = await landingBay.send({
      content: `Greetings, ${member.user}, and welcome to THE SENATE!\nTo help us serve you, please select an option from the following menu.`,
      components: [welcomeMenu],
    });

    // welcomeMenu should only accept responses from the new user
    const menuFilter = i => {
      i.deferUpdate();
      return i.user.id === member.id;
    };

    menuMessage
      .awaitMessageComponent({
        filter: menuFilter,
        componentType: 'SELECT_MENU',
      })
      .then(async i => {
        const embed = new EmbedBuilder().setTitle(`New User: ${member.user.username}`).addFields([
          {
            name: 'Landing Bay Link:',
            value: `${hyperlink(`Welcome Menu Post: ${member.user.username}`, welcomeMenu.url)}`,
          },
        ]);
        const selected = i.values.join();

        const recruitment = await member.client.channels.fetch(config.channels.recruitmentRoom);
        const art = await member.client.channels.fetch(config.channels.allianceRecruitmentTeam);

        if (selected === 'kick') {
          await recruitment.send(
            `${userMention('223492830297849856')}: a user clicked your button and was kicked from the server!`
          );
          await member.kick('Selected the KICK ME menu option');
        }

        if (selected === 'newguild') {
          embed.setDescription('is looking for a __guild to join__!');
          await recruitment.send({
            content: `${roleMention(config.roles.greeter)}`,
            embeds: [embed],
          });
          return welcomeMenu.edit({
            content: `Thank you ${member.user}! Appropriate staff have been notified and will respond shortly.\nIn the meantime, *please share a SWGOH.gg link or ally code for our recruiters to review.*`,
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
            `${member.user.username} is here to discuss a merger. The Alliance Recruitment Team has been notified!`
          );
          return welcomeMenu.edit({
            content: `Thank you ${member.user}! Appropriate staff have been notified and will respond shortly.`,
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
            content: `Thank you ${member.user}! Appropriate staff have been notified and will respond shortly.`,
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
            content: `Thank you ${member.user}! Appropriate staff have been notified and will respond shortly.`,
            components: [],
          });
        }
      });
  },
};
