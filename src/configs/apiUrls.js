/** Base URL for the SWGOH.GG API */
const ggBase = 'http://api.swgoh.gg/';

exports.apiUrls = Object.freeze({
  /** SWGOH.GG API URLs */
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
