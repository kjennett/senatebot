exports.config = Object.freeze({
  invite:
    'https://discord.com/api/oauth2/authorize?client_id=898606121512755201&permissions=8&scope=bot%20applications.commands',

  channels: Object.freeze({
    landingBay: '518436413344317450',
    recruitmentRoom: '518436714176577563',
    securityCouncil: '515882219525373955',
    allianceRecruitmentTeam: '907823084566892576',
    tradeFederation: '788851085666156545',
  }),

  roles: {
    potentialGuildMember: '543791694726823997',
    senateGuest: '518433712203890718',
    senateCitizen: '515880547415883797',
    greeter: '933051834115948615',
    recruitment: '518434369455783936',
    allianceRecruitmentTeam: '907820888244781076',
    guildOfficer: '515880606790582284',
  },

  omicronModes: {
    TB: 7,
    TW: 8,
    GAC: 9,
    GAC3v3: 14,
  },
});
