const { fetchCharacters, fetchShips, fetchAbilities } = require('./functions/gamedata/gameData');

class GameDataCache {
  constructor() {}

  update = async () => {
    [this.characters, this.abilities, this.ships] = await Promise.all([
      fetchCharacters() ?? [],
      fetchAbilities() ?? [],
      fetchShips() ?? [],
    ]);
    this.effects = [];

    for (const character of this.characters) {
      for (const status of character.ability_classes) {
        if (!this.effects.includes(status)) this.effects.push(status);
      }
    }
    for (const ship of this.ships) {
      for (const status of ship.ability_classes) {
        if (!this.effects.includes(status)) this.effects.push(status);
      }
    }
    this.effects.sort();
  };

  // Updates cached static game data automatically every 15 minutes
  startUpdater = () => {
    setInterval(() => {
      this.update();
    }, 900000);
  };
}

exports.cache = new GameDataCache();
