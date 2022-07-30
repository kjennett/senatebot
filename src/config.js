const { MessageEmbed } = require('discord.js');

const devConfig = {
  channels: {
    landingBay: '895825647027490816',
    recruitmentRoom: '852286378075095071',
    securityCouncil: '895825820747190353',
    allianceRecruitmentTeam: '895825820747190353',
  },
  roles: {
    potentialGuildMember: '543791694726823997',
    senateGuest: '954525945438564402',
    senateCitizen: '954525945438564402',
    greeter: '954525945438564402',
    recruitment: '954525945438564402',
    allianceRecruitmentTeam: '954525945438564402',
  },
};

const prodConfig = {
  channels: {
    landingBay: '518436413344317450',
    recruitmentRoom: '518436714176577563',
    securityCouncil: '515882219525373955',
    allianceRecruitmentTeam: '907823084566892576',
  },
  roles: {
    potentialGuildMember: '543791694726823997',
    senateGuest: '518433712203890718',
    senateCitizen: '515880547415883797',
    greeter: '933051834115948615',
    recruitment: '518434369455783936',
    allianceRecruitmentTeam: '907820888244781076',
  },
};

class SenateBotConfig {
  owner = process.env.OWNER;
  token = process.env.TOKEN;
  server = process.env.SERVER;
  client = process.env.CLIENT;
  db = process.env.DB;
  senateLogo = process.env.SENATELOGO;

  galacticLegends = ['SITHPALPATINE', 'GLREY', 'SUPREMELEADERKYLOREN', 'GRANDMASTERLUKE', 'JEDIMASTERKENOBI', 'LORDVADER'];

  capitalShips = [
    'CAPITALSTARDESTROYER',
    'CAPITALMONCALAMARICRUISER',
    'CAPITALJEDICRUISER',
    'CAPITALEXECUTOR',
    'CAPITALNEGOTIATOR',
    'CAPITALMALEVOLENCE',
    'CAPITALCHIMAERA',
    'CAPITALRADDUS',
    'CAPITALFINALIZER',
  ];

  conquestCharacters = ['COMMANDERAHSOKA', 'MAULS7', 'BOBAFETTSCION', 'DARTHMALGUS'];

  conquestShips = ['TIEINTERCEPTOR', 'RAZORCREST'];

  omicronModes = {
    TB: 7,
    TW: 8,
    GAC: 9,
    GAC3v3: 14,
  };

  channels = process.env.NODE_ENV === 'production' ? prodConfig.channels : devConfig.channels;
  roles = process.env.NODE_ENV === 'production' ? prodConfig.roles : devConfig.roles;

  errorEmbeds = {
    adminOnly: new MessageEmbed({
      title: 'This command is usable by the bot administrator only.',
      color: 'RED',
    }),
    allyCodeParseFailure: new MessageEmbed({
      title: 'Unable to parse ally code from the provided input. Please try again.',
      color: 'RED',
    }),
    recruitThreadAlreadyExists: new MessageEmbed({
      title: 'A recruitment thread for this ally code already exists.',
      color: 'RED',
    }),
  };

  successEmbeds = {
    restart: new MessageEmbed({
      title: 'Restarting...',
      color: 'GREEN',
    }),
  };
}

exports.config = new SenateBotConfig();
