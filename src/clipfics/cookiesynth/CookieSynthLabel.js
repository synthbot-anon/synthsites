import {
  isLabelValid,
  getTagsFromLabel,
  getMissingValues,
  getTypeFromLabel,
  getAllProperties,
  getAllValues,
} from './common.js';
import RangeUtils from 'common/RangeUtils.js';

const plural = (str) => {
  if (str.endsWith('s')) {
    return `${str}'`;
  } else {
    return `${str}'s`;
  }
};

const replacePattern = (str, pattern, value) => {
  let result = str;
  result = result.split(`${pattern}'s`).join(plural(value));
  result = result.split(pattern).join(value);
  return result;
};

const matchesToString = (matches) => {
  const result = [];
  for (let match of matches) {
    result.push(match[1]);
  }

  return result;
};

/**
 *
 * WARNING: This assumes that no key is repeated.
 */
class DefaultDescription {
  #description;
  #type;
  #properties;
  #values;

  constructor(partialLabel, description) {
    this.#description = description;
    this.#type = getTypeFromLabel(partialLabel);
    this.#properties = matchesToString(getAllProperties(partialLabel));
    this.#values = matchesToString(getAllValues(partialLabel));

    if (new Set(this.#properties).size !== this.#properties.length) {
      console.log(
        'WARNING: DefaultDescription does not work with duplicate properties',
      );
    }
  }

  getDescription(targetLabel) {
    let result = this.#description;

    const targetType = getTypeFromLabel(targetLabel);
    const targetProps = matchesToString(getAllProperties(targetLabel));
    const targetValues = matchesToString(getAllValues(targetLabel));

    if (new Set(targetProps).size !== targetProps.length) {
      console.log(
        'WARNING: DefaultDescription does not work with duplicate properties',
      );
      return null;
    }

    // Easy check by type and lengths. We'll assume these match later.
    if (
      targetType !== this.#type ||
      targetProps.length !== this.#properties.length ||
      targetValues.length !== this.#values.length
    ) {
      console.log('easy miss');
      console.log(targetType, 'vs', this.#type);
      console.log(targetProps.length, 'vs', this.#properties.length);
      console.log(targetValues.length, 'vs', this.#values.length);
      return null;
    }

    // We'll need to look up label values by property
    const targetDict = {};
    for (let i = 0; i < targetProps.length; i++) {
      targetDict[targetProps[i]] = targetValues[i];
    }

    // Check all properties and values
    for (let i = 0; i < this.#properties.length; i++) {
      const prop = this.#properties[i];
      const val = this.#values[i];

      if (!(prop in targetDict)) {
        // We're missing a property. It can't be a match.
        console.log('missing property', prop);
        return null;
      }

      if (val.startsWith('{') && val.endsWith('}')) {
        // This value must be assigned, so it must be not a ? in the targetLabel
        if (targetDict[prop] === '?') {
          console.log('shouldnt have a value here', prop);
          return null;
        }
        result = replacePattern(result, val, targetDict[prop]);
      } else {
        // All other values should match identically
        if (targetDict[prop] !== val) {
          console.log('should have a match here', val);
          return null;
        }

        if (!targetValues.includes(val)) {
          return null;
        }
      }
    }

    // Everything checks out.
    return result;
  }
}

const KNOWN_DESCRIPTIONS = [
  new DefaultDescription('dialogue speaker="{speaker}"', 'Label speaker as {speaker}'),
  new DefaultDescription(
    'meta character="{character}" emotion="{emotion}"',
    "Change {character}'s emotion to {emotion}",
  ),
  new DefaultDescription(
    'meta character="{character}" emotion="?"',
    "Change {character}'s emotion",
  ),
  new DefaultDescription(
    'meta character="?" emotion="{emotion}"',
    "Change a character's emotion to {emotion}",
  ),
];

export const getLabelDescription = (partialLabel) => {
  for (let knownDesc of KNOWN_DESCRIPTIONS) {
    const result = knownDesc.getDescription(partialLabel);
    if (result) {
      return result;
    }
  }

  return null;
};

export default class CookieSynthLabel {
  missingProperties = [];
  #propertyOffsets = [];
  providedValues = [];
  #label;
  #range;
  completedLabel;

  constructor(range, label) {
    const missingValueMatches = getMissingValues(label);

    for (let item of missingValueMatches) {
      const context = item[1];
      const offset = item.index + item[0].search('"?"') + 1;
      this.#propertyOffsets.push([context, offset]);
      this.missingProperties.push(context);
    }

    this.#range = range;
    this.#label = label;
  }

  setNextValue(value) {
    const nextIndex = this.providedValues.length;
    const [, offset] = this.#propertyOffsets[nextIndex];
    this.providedValues.push([value, offset]);
  }

  getCompletedLabel() {
    if (!this.completedLabel) {
      return this.completedLabel;
    }

    let originalLabel = this.#label;
    let result = '';
    let lastOffset = 0;
    for (let i = 0; i < this.providedValues.length; i++) {
      const [value, nextOffset] = this.providedValues[i];
      const appendPart = originalLabel.substring(lastOffset, nextOffset);
      result += appendPart + value;
      lastOffset = nextOffset + 1;
    }
    result += originalLabel.substring(lastOffset, originalLabel.length);

    this.completedLabel = result;
    return result;
  }

  injectLabel() {
    const completedLabel = this.getCompletedLabel();

    if (!isLabelValid(completedLabel)) {
      return false;
    }

    const [tagStart, tagEnd] = getTagsFromLabel(completedLabel);
    addLabelToRange(tagStart, tagEnd, this.#range);
    return true;
  }
}

// Highlights a Range object. The Range object MUST NOT span over multiple DOM nodes.
const highlightSimpleRange = (range) => {
  const newNode = document.createElement('span');
  newNode.setAttribute('style', 'background-color: yellow;');
  newNode.setAttribute('data-cookiesynth-style', 'highlight');
  newNode.setAttribute('class', 'highlight');
  range.surroundContents(newNode);
};

const addLabelToRange = (tagStart, tagEnd, range) => {
  const utils = new RangeUtils(range);

  const startIndicator = document.createElement('span');
  startIndicator.setAttribute('data-cookiesynth', tagStart);
  utils.prepend(startIndicator);

  if (tagEnd) {
    const endIndicator = document.createElement('span');
    endIndicator.setAttribute('data-cookiesynth', tagEnd);
    utils.append(endIndicator);
  }

  // Highlight the selection
  utils.apply((range) => highlightSimpleRange(range));
};
