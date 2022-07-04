exports.parseAllyCode = input => {
  // Input must be a string to be parseable
  if (typeof input !== 'string') return new Error('Invalid input: string expected');

  // Input should be at least 9 characters, since ally codes are 9 digits
  if (input.length < 9) return new Error('Invalid input: must be at least 9 characters');

  // Input should NOT be a swgoh.gg/u/ vanity link, because these URLs don't contain ally codes
  if (input.includes('swgoh.gg/u/'))
    return new Error(
      'Invalid input: SWGOH.GG vanity links (https://swgoh.gg/u/) are not parseable. Please use a normal swgoh.gg link (https://swgoh.gg/p/'
    );

  const parseRegExp = /\D/g;
  const parsed = input.replaceAll(parseRegExp, '');
  if (parsed.length !== 9) return new Error('Unable to parse a valid ally code from the provided input.');

  return parsed;
};
