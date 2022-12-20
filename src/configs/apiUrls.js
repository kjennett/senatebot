const ggBase = 'http://api.swgoh.gg/';

exports.apiUrls = Object.freeze({
  gg: Object.freeze({
    characters: `${ggBase}characters/`,
    ships: `${ggBase}ships/`,
    abilities: `${ggBase}abilities/`,
    player: `${ggBase}player/`,
    guildProfile: `${ggBase}guild-profile/`,
  }),

  events: 'https://swgohevents.com/ical',

  omega: `https://omegaapi.azurewebsites.net/OmegaApi/Modscore/`,
});
