const galacticLegends = {
  SITHPALPATINE: { name: 'Sith Eternal Emperor', abbr: 'SEE' },
  GLREY: { name: 'Rey', abbr: 'Rey' },
  SUPREMELEADERKYLOREN: { name: 'Supreme Leader Kylo Ren', abbr: 'SLKR' },
  GRANDMASTERLUKE: { name: 'Jedi Master Luke Skywalker', abbr: 'JML' },
  JEDIMASTERKENOBI: { name: 'Jedi Master Kenobi', abbr: 'JMK' },
  LORDVADER: { name: 'Lord Vader', abbr: 'LV' },
};

const capitalShips = {
  CAPITALEXECUTOR: { name: 'Executor', abbr: 'Exec' },
  CAPITALNEGOTIATOR: { name: 'Negotiator', abbr: 'Nego' },
  CAPITALMALEVOLENCE: { name: 'Malevolence', abbr: 'Mal' },
  CAPITALCHIMAERA: { name: 'Chimaera', abbr: 'Chi' },
  CAPITALRADDUS: { name: 'Raddus', abbr: 'Rad' },
  CAPITALFINALIZER: { name: 'Finalizer', abbr: 'Fin' },
};

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
  messages: {
    purged:
      'You have been automatically removed from ΞThe SenateΞ Alliance Discord Server, as you have not been granted a role within 14 days of joining the server.\n If you believe this to be in error, please rejoin the server using the following link:\n\nhttp://discord.thesenate.gg\n\nΞThe SenateΞ wishes you good fortune in your SWGOH adventures - may the Force be with you, always!',
  },
  galacticLegends: galacticLegends,
  capitalShips: capitalShips,
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
  messages: {
    purged:
      'You have been automatically removed from ΞThe SenateΞ Alliance Discord Server, as you have not been granted a role within 14 days of joining the server.\n If you believe this to be in error, please rejoin the server using the following link:\n\nhttp://discord.thesenate.gg\n\nΞThe SenateΞ wishes you good fortune in your SWGOH adventures - may the Force be with you, always!',
  },
  galacticLegends: galacticLegends,
  capitalShips: capitalShips,
  omicronModes: omicronModes,
};

exports.config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
