exports.parseAllyCode = input => {
  if (typeof input !== 'string') return new Error('Invalid input: string expected');
  if (input.length < 9) return new Error('Invalid input: must be at least 9 characters');
  if (input.includes('swgoh.gg/u/'))
    return new Error(
      'Invalid input: SWGOH.GG vanity links (https://swgoh.gg/u/) are not parseable. Please use a normal swgoh.gg link (https://swgoh.gg/p/'
    );

  const parseRegExp = /\D/g;
  const parsed = input.replaceAll(parseRegExp, '');
  if (parsed.length !== 9) return new Error('Unable to parse a valid ally code from the provided input.');

  return parsed;
};
