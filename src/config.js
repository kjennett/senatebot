class SenateBotConfig {
  // ---------- Bot Admin ID ---------- //
  owner = process.env.OWNER;

  // ---------- Bot Configuration ---------- //
  token = process.env.TOKEN;
  server = process.env.SERVER;
  client = process.env.CLIENT;

  // ---------- MongoDB Connection URI ---------- //
  db = process.env.DB;

  // ---------- Bot Logo ---------- //
  senateLogo = process.env.SENATELOGO;

  // ---------- Discord Channel IDs ---------- //
  channels = {
    landingBay: '518436413344317450',
    recruitmentRoom: '518436714176577563',
    securityCouncil: '515882219525373955',
    allianceRecruitmentTeam: '907823084566892576',
  };

  // ---------- Discord Role IDs ---------- //
  roles = {
    potentialGuildMember: '543791694726823997',
    senateGuest: '518433712203890718',
    senateCitizen: '515880547415883797',
    greeter: '933051834115948615',
    recruitment: '518434369455783936',
    allianceRecruitmentTeam: '907820888244781076',
    guildOfficer: '515880606790582284',
  };

  // ---------- Galactic Legend Base IDs ---------- //
  galacticLegends = [
    'SITHPALPATINE',
    'GLREY',
    'SUPREMELEADERKYLOREN',
    'GRANDMASTERLUKE',
    'JEDIMASTERKENOBI',
    'LORDVADER',
    'JABBATHEHUTT',
  ];

  // ---------- Conquest Character Base IDs ---------- //
  conquestCharacters = ['COMMANDERAHSOKA', 'MAULS7', 'BOBAFETTSCION', 'DARTHMALGUS', 'BENSOLO'];

  // ---------- Capital Ship Base IDs ---------- //
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

  // ---------- Conquest Ship Base IDs ---------- //
  conquestShips = ['TIEINTERCEPTOR', 'RAZORCREST'];

  // ---------- Omicron Modes ---------- //
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
