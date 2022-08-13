const devConfig = {
  // Channel IDs
  channels: {
    landingBay: '895825647027490816',
    recruitmentRoom: '852286378075095071',
    securityCouncil: '895825820747190353',
    allianceRecruitmentTeam: '895825820747190353',
  },
  // Role IDs
  roles: {
    potentialGuildMember: '543791694726823997',
    senateGuest: '954525945438564402',
    senateCitizen: '954525945438564402',
    greeter: '954525945438564402',
    recruitment: '954525945438564402',
    allianceRecruitmentTeam: '954525945438564402',
    guildOfficer: '954525945438564402',
  },
};

const prodConfig = {
  // Channel IDs
  channels: {
    landingBay: '518436413344317450',
    recruitmentRoom: '518436714176577563',
    securityCouncil: '515882219525373955',
    allianceRecruitmentTeam: '907823084566892576',
  },
  // Role IDs
  roles: {
    potentialGuildMember: '543791694726823997',
    senateGuest: '518433712203890718',
    senateCitizen: '515880547415883797',
    greeter: '933051834115948615',
    recruitment: '518434369455783936',
    allianceRecruitmentTeam: '907820888244781076',
    guildOfficer: '515880606790582284',
  },
};

class SenateBotConfig {
  // Admin Discord ID
  owner = process.env.OWNER;

  // Discord Bot Token, Server ID, Client ID
  token = process.env.TOKEN;
  server = process.env.SERVER;
  client = process.env.CLIENT;

  // MongoDB Connection URI
  db = process.env.DB;

  // Senate Logo Image URL
  senateLogo = process.env.SENATELOGO;

  // Galactic Legend Base IDs
  galacticLegends = [
    'SITHPALPATINE',
    'GLREY',
    'SUPREMELEADERKYLOREN',
    'GRANDMASTERLUKE',
    'JEDIMASTERKENOBI',
    'LORDVADER',
  ];

  // Capital Ship Base IDs
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

  // Conquest Character Base IDs
  conquestCharacters = ['COMMANDERAHSOKA', 'MAULS7', 'BOBAFETTSCION', 'DARTHMALGUS'];

  // Conquest Ship Base IDs
  conquestShips = ['TIEINTERCEPTOR', 'RAZORCREST'];

  // Omicron Mode Values
  omicronModes = {
    TB: 7,
    TW: 8,
    GAC: 9,
    GAC3v3: 14,
  };

  // Set channel and role config values based on active environment
  channels = process.env.NODE_ENV === 'production' ? prodConfig.channels : devConfig.channels;
  roles = process.env.NODE_ENV === 'production' ? prodConfig.roles : devConfig.roles;
}

exports.config = new SenateBotConfig();
