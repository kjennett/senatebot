class SenateBotConfig {
  owner = process.env.OWNER;

  token = process.env.TOKEN;
  server = process.env.SERVER;
  client = process.env.CLIENT;

  db = process.env.DB;

  senateLogo = process.env.SENATELOGO;

  channels = {
    landingBay: '518436413344317450',
    recruitmentRoom: '518436714176577563',
    securityCouncil: '515882219525373955',
    allianceRecruitmentTeam: '907823084566892576',
  };

  roles = {
    potentialGuildMember: '543791694726823997',
    senateGuest: '518433712203890718',
    senateCitizen: '515880547415883797',
    greeter: '933051834115948615',
    recruitment: '518434369455783936',
    allianceRecruitmentTeam: '907820888244781076',
    guildOfficer: '515880606790582284',
  };

  galacticLegends = [
    'SITHPALPATINE',
    'GLREY',
    'SUPREMELEADERKYLOREN',
    'GRANDMASTERLUKE',
    'JEDIMASTERKENOBI',
    'LORDVADER',
    'JABBATHEHUTT',
  ];

  conquestCharacters = ['COMMANDERAHSOKA', 'MAULS7', 'BOBAFETTSCION', 'DARTHMALGUS', 'BENSOLO'];

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
    'CAPITALPROFUNDITY',
  ];

  conquestShips = ['TIEINTERCEPTOR', 'RAZORCREST'];

  omicronModes = {
    TB: 7,
    TW: 8,
    GAC: 9,
    GAC3v3: 14,
  };

  datacronSets = {
    1: 'Treatise Inquisitorius',
    2: 'Enduring Codex',
    3: 'Ardent Ideologies',
    4: 'Security Primer',
  };
}

module.exports = new SenateBotConfig();
