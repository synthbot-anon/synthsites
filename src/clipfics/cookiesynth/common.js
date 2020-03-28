const KEYWORD = '[a-zA-Z][a-zA-Z0-9]*';
const VALUE = '"(?:[^"]*|\\?)"';
const SEGTYPE = `${KEYWORD}`;
const OPEN_REGEX = new RegExp(
  `^\\s*(${KEYWORD})(?:\\s*=\\s*${VALUE}|(?:\\s+${SEGTYPE}\\s*=\\s*${VALUE})*)\\s*$`,
);
const MISSING_VALUES_REGEX = new RegExp(`(${KEYWORD})\\s*=\\s*"(\\?)"`, 'g');

export const isLabelValid = (label) => {
  const result = OPEN_REGEX.test(label);
  return result;
};

export const getTagsFromLabel = (label) => {
  const match = OPEN_REGEX.exec(label);
  const [full, keyword] = match;

  const tagStart = `[${full}]`;
  const tagEnd = keyword === 'meta' ? null : `[/${keyword}]`;

  return [tagStart, tagEnd];
};

export const getMissingValues = (label) => {
  return label.matchAll(MISSING_VALUES_REGEX);
};

export const getTypeFromLabel = (label) => {
  const match = OPEN_REGEX.exec(label);
  const [, keyword] = match;
  return keyword;
};
