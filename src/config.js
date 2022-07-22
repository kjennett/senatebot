const galacticLegends = [
  'SITHPALPATINE',
  'GLREY',
  'SUPREMELEADERKYLOREN',
  'GRANDMASTERLUKE',
  'JEDIMASTERKENOBI',
  'LORDVADER',
];

const capitalShips = [
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

const conquestCharacters = ['COMMANDERAHSOKA', 'MAULS7', 'BOBAFETTSCION', 'DARTHMALGUS'];

const conquestShips = ['TIEINTERCEPTOR', 'RAZORCREST'];

const omicronModes = {
  TB: 7,
  TW: 8,
  GAC: 9,
  GAC3v3: 14,
};

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
  galacticLegends: galacticLegends,
  capitalShips: capitalShips,
  conquestCharacters: conquestCharacters,
  conquestShips: conquestShips,
  omicronModes: omicronModes,
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
  galacticLegends: galacticLegends,
  capitalShips: capitalShips,
  conquestCharacters: conquestCharacters,
  conquestShips: conquestShips,
  omicronModes: omicronModes,
};

exports.config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
