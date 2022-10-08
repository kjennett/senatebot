module.exports = input => {
  // Verify that input is a string (this should be handled by slash command input)
  if (typeof input !== 'string') return null;

  // Verify that the input contains at least 9 characters (since ally codes are 9 characters long)
  if (input.length < 9) return null;

  // Verify that the input is not a SWGOH.GG vanity url (because these don't contain the ally code number in the URL)
  if (input.includes('swgoh.gg/u/')) return null;

  const parseRegExp = /\D/g;
  const parsed = input.replaceAll(parseRegExp, '');

  // Verify that the parsed output contains exactly 9 characters
  if (parsed.length !== 9) return null;

  return parsed;
};
