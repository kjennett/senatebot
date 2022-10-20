module.exports = input => {
  if (typeof input !== 'string') return null;

  if (input.length < 9) return null;

  if (input.includes('swgoh.gg/u/')) return null;

  const parseRegExp = /\D/g;
  const parsed = input.replaceAll(parseRegExp, '');

  if (parsed.length !== 9) return null;

  return parsed;
};
