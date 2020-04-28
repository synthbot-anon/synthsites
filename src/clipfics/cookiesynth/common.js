const KEYWORD = '[a-zA-Z][a-zA-Z0-9\\-]*';
const VALUE = '(?:[^"]*|\\?)';
const SEGTYPE = `${KEYWORD}`;
const OPEN_REGEX_STR = `(${KEYWORD})(?:\\s*=\\s*"${VALUE}"|(?:\\s+${SEGTYPE}\\s*=\\s*"${VALUE}")*)`;
const OPEN_REGEX = new RegExp(`^\\s*${OPEN_REGEX_STR}\\s*$`);
const MISSING_VALUES_REGEX = new RegExp(`(${KEYWORD})\\s*=\\s*"(\\?)"`, 'g');
const ALL_PROPERTIES_REGEX = new RegExp(`(${KEYWORD})\\s*=\\s*"${VALUE}"`, 'g');
const ALL_VALUES_REGEX = new RegExp(`(?:${KEYWORD})\\s*=\\s*"(${VALUE})"`, 'g');
const SPLIT_ASSIGNMENT = new RegExp(`^\\s*(${SEGTYPE})\\s*=\\s*"(${VALUE})"\\s*$`);

const CLOSE_REGEX_STR = `\\/(${KEYWORD})`;
const CLOSE_REGEX = new RegExp(`^\\s*${CLOSE_REGEX_STR}\\s*$`);
const TAG_SPLIT = new RegExp(
  `([^\\[]+|\\[${OPEN_REGEX_STR}\\]|\\[${CLOSE_REGEX_STR}\\]|\\[)`,
  'g',
);

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

export const getAllProperties = (label) => {
  return label.matchAll(ALL_PROPERTIES_REGEX);
};

export const getAllValues = (label) => {
  return label.matchAll(ALL_VALUES_REGEX);
};

export const splitAssignment = (label) => {
  const match = SPLIT_ASSIGNMENT.exec(label);
  const [, segtype, value] = match;
  return [segtype, value];
};

export const getCookieSynthOpenLabelType = (label) => {
  const openMatch = OPEN_REGEX.exec(label);
  if (openMatch) {
    const [, keyword] = openMatch;
    return keyword;
  }

  return null;
};

export const getCookieSynthCloseLabelType = (label) => {
  const closeMatch = CLOSE_REGEX.exec(label);
  if (closeMatch) {
    const [, keyword] = closeMatch;
    return keyword;
  }

  return null;
};

export const parseTags = (string) => {
  return Array.from(string.matchAll(TAG_SPLIT)).map((x) => x[0]);
};
