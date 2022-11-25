// --------------------
// Ally Code Parsing
// --------------------

exports.extractAllyCode = input => {
  if (typeof input !== 'string') return null;
  if (input.length < 9) return null;

  const result = input.replaceAll(/\D/g, '');
  return result.length === 9 ? result : null;
};
