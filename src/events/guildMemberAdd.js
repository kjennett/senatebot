const handleNewMember = require('../welcome/handleNewMember');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    await handleNewMember(member);
  },
};
