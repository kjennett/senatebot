const ggBase = 'http://api.swgoh.gg/';
const comlinkBase = 'http://thesenate.gg:3000/';

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

  comlink: Object.freeze({
    player: `${comlinkBase}player/`,
  }),
});
