const {
  ActionRowBuilder,
  SelectMenuBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  roleMention,
  userMention,
  hyperlink,
} = require('discord.js');
const { config } = require('../config');
const Jimp = require('jimp');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    // Don't do anything when bots join the server
    if (member.user.bot) return;

    // Add the PGM role to the user
    await member.roles.add(await member.guild.roles.fetch(config.roles.potentialGuildMember));

    // Generate an attachment containing the welcome image for the user
    const [background, font] = await Promise.all([
      Jimp.read('src/img/welcometothesenate.png'),
      Jimp.loadFont('src/img/pathway.ttf.fnt'),
    ]);
    const image = background.print(font, 350 - Jimp.measureText(font, member.user.username) / 2, 150, member.user.username);
    const welcomeImage = await image.getBufferAsync(Jimp.MIME_PNG);
    const attachment = new AttachmentBuilder(welcomeImage, 'welcome.png');

    // Build the server join menu
    const serverJoinMenu = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId('serverJoinMenu')
        .setPlaceholder("I'm here to...")
        .addOptions([
          { label: 'Look for a guild to join.', value: 'newguild' },
          { label: 'Talk about bringing a guild into the alliance.', value: 'merger' },
          { label: 'Find someone from my arena shard.', value: 'shard' },
          { label: 'Learn about OmegaBot', value: 'omegabot' },
          { label: 'Other', value: 'other' },
          { label: 'Leave immediately without saying anything', value: 'kick' },
        ])
    );

    // Send the welcome image and server join menu in the landing bay
    const landingBay = await member.client.channels.fetch(config.channels.landingBay);
    await landingBay.send({ files: [attachment] });
    const welcomeMenu = await landingBay.send({
      content: `Greetings, ${member.user}, and welcome to THE SENATE!\nTo help us serve you, please select an option from the following menu.`,
      components: [serverJoinMenu],
    });

    // Generate a new embed announcing the user in the recruitment room
    const embed = new EmbedBuilder().setTitle(`New User: ${member.user.username}`).addFields([
      {
        name: 'Landing Bay Link:',
        value: `${hyperlink(`Welcome Menu Post: ${member.user.username}`, welcomeMenu.url)}`,
      },
    ]);

    // Filter responses to the welcome menu to those from the new user
    const menuFilter = interaction => {
      interaction.deferUpdate();
      return interaction.user.id === member.id;
    };

    // Await the user's response to the menu and modify the announcement embed based on their menu response. Then,
    // send the announcement embed in the recruitment channel
    welcomeMenu
      .awaitMessageComponent({
        filter: menuFilter,
        componentType: 'SELECT_MENU',
      })
      .then(async interaction => {
        const selected = interaction.values.join();

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
