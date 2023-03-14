const { EmbedBuilder, roleMention, userMention, hyperlink, ComponentType } = require('discord.js');
const { welcomeImage, welcomeMenu } = require('../lib/welcome/welcome');
const { senateRoles } = require('../configs/senateRoles');
const { senateChannels } = require('../configs/senateChannels');

module.exports = {
  name: 'guildMemberAdd',

  async execute(m) {
    if (m.user.bot) return;
    await m.roles.add(await m.guild.roles.fetch(senateRoles.potentialGuildMember));

    const image = await welcomeImage(m.user.username);

    const landingBay = await m.client.channels.fetch(senateChannels.landingBay);
    await landingBay.send({ files: [image] });
    const menuMessage = await landingBay.send({
      content: `Greetings, ${m.user}, and welcome to THE SENATE!\nTo help us serve you, please select an option from the following menu.`,
      components: [welcomeMenu],
    });

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
            value: `${hyperlink(`Welcome Menu Post: ${m.user.username}`, menuMessage.url)}`,
          },
        ]);
        const selected = i.values.join();

        const recruitment = await m.client.channels.fetch(senateChannels.recruitmentRoom);
        const art = await m.client.channels.fetch(senateChannels.allianceRecruitmentTeam);

        if (selected === 'kick') {
          await recruitment.send(
            `${userMention('223492830297849856')}: a user clicked your button and was kicked from the server!`
          );
          await m.kick('Selected the KICK ME menu option');
        }

        if (selected === 'newguild') {
          embed.setDescription('is looking for a __guild to join__!');
          await recruitment.send({
            content: `${roleMention(senateRoles.greeter)}`,
            embeds: [embed],
          });
          return menuMessage.edit({
            content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.\nIn the meantime, *please share a SWGOH.gg link or ally code for our recruiters to review.*`,
            components: [],
          });
        }

        if (selected === 'merger') {
          embed.setDescription('is here to __discuss a merger__');
          await art.send({
            content: `${roleMention(senateRoles.allianceRecruitmentTeam)}`,
            embeds: [embed],
          });
          await recruitment.send(
            `${m.user.username} is here to discuss a merger. The Alliance Recruitment Team has been notified!`
          );
          return menuMessage.edit({
            content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.`,
            components: [],
          });
        }

        if (selected === 'omegabot') {
          embed.setDescription('is here to __learn about OmegaBot__!');
          await recruitment.send({
            content: `${roleMention(senateRoles.greeter)}`,
            embeds: [embed],
          });
          return menuMessage.edit({
            content:
              'Thank you for your interest! For more information on OmegaBot, please visit the OmegaBot Discord server: http://omegabot.thesenate.gg',
            components: [],
          });
        }

        if (selected === 'shard') {
          embed.setDescription('is here to __find someone from their arena shard__!');
          await recruitment.send({
            content: `${roleMention(senateRoles.greeter)}`,
            embeds: [embed],
          });
          return menuMessage.edit({
            content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.`,
            components: [],
          });
        }

        if (selected === 'other') {
          embed.setDescription('is here for __an unspecified reason__');
          await recruitment.send({
            content: `${roleMention(senateRoles.greeter)}`,
            embeds: [embed],
          });
          return menuMessage.edit({
            content: `Thank you ${m.user}! Appropriate staff have been notified and will respond shortly.`,
            components: [],
          });
        }
      });
  },
};
