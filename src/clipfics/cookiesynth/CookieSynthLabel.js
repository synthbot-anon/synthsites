import { isLabelValid, getTagsFromLabel, getMissingValues } from './common.js';
import RangeUtils from '../../common/RangeUtils.js';

export default class CookieSynthLabel {
  missingProperties = [];
  #propertyOffsets = [];
  providedValues = [];
  #label;
  #range;

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

    return result;
  }

  injectLabel() {
    const completedLabel = this.getCompletedLabel();

    if (!isLabelValid(completedLabel)) {
      console.log('invalid label:', completedLabel);
      return;
    }

    const [tagStart, tagEnd] = getTagsFromLabel(completedLabel);
    console.log('tags:', tagStart, tagEnd);
    addLabelToRange(tagStart, tagEnd, this.#range);
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
