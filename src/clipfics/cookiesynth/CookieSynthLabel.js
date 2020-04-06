import React from 'react';
import { Typography } from '@material-ui/core';

import {
  isLabelValid,
  getTagsFromLabel,
  getMissingValues,
  getTypeFromLabel,
  getAllProperties,
  getAllValues,
} from './common.js';
import RangeUtils from 'common/RangeUtils.js';
import { TerminalType, TerminalButton, TerminalSpan } from 'common/Terminal.js';

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
        return null;
      }

      if (val.startsWith('{') && val.endsWith('}')) {
        // This value must be assigned, so it must be not a ? in the targetLabel
        if (targetDict[prop] === '?') {
          return null;
        }
        result = replacePattern(result, val, targetDict[prop]);
      } else {
        // All other values should match identically
        if (targetDict[prop] !== val) {
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
  new DefaultDescription(
    'dialogue speaker="{speaker}"',
    'Label speaker as {speaker}',
  ),
  new DefaultDescription('dialogue speaker="?"', 'Label the dialogue speaker'),
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
  new DefaultDescription(
    'meta character="?" emotion="?"',
    "Change a character's emotion",
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
    if (this.completedLabel) {
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

  injectLabel(terminal, requestNewLabel) {
    let completedLabel = this.getCompletedLabel();

    if (!isLabelValid(completedLabel)) {
      return false;
    }

    const utils = new RangeUtils(this.#range);

    // add the label
    let [tagStart, tagEnd] = getTagsFromLabel(completedLabel);
    const indicator = new LabelIndicator(utils, tagStart, tagEnd);
    indicator.inject();

    // add the highlight
    const highlightNodes = [];
    utils.apply((range) => {
      const newNode = highlightSimpleRange(range);
      highlightNodes.push(newNode);
    });

    const updateKey = {};

    const replaceLabel = () => {
      requestNewLabel(completedLabel, (newLabel) => {
        if (!isLabelValid(newLabel)) {
          console.log('invalid update');
        }

        [tagStart, tagEnd] = getTagsFromLabel(newLabel);
        indicator.updateTags(tagStart, tagEnd);

        updateKey.current = terminal.update(
          updateKey.current,
          <LabelLog
            label={newLabel}
            onReplace={replaceLabel}
            onRemove={removeLabel}
          />,
        );

        completedLabel = newLabel;
        return completedLabel;
      });

      return true;
    };

    const removeLabel = () => {
      for (let node of highlightNodes) {
        node.replaceWith(...node.childNodes);
      }

      indicator.remove();

      updateKey.current = terminal.update(
        updateKey.current,
        <TerminalSpan>
          <LabelLog label={completedLabel} removed="true" />
        </TerminalSpan>,
      );
    };

    updateKey.current = terminal.append(
      <LabelLog
        label={completedLabel}
        onReplace={replaceLabel}
        onRemove={removeLabel}
      />,
    );

    return true;
  }
}

const LabelLog = ({ label, onReplace, onRemove, removed }) => {
  const actionString = removed ? 'removed label' : 'added label';
  return (
    <TerminalSpan>
      <TerminalType>
        {actionString}: {label}
      </TerminalType>
      <TerminalButton disabled={removed} onClick={onReplace}>
        Update label
      </TerminalButton>
      <TerminalButton disabled={removed} onClick={onRemove}>
        Remove label
      </TerminalButton>
    </TerminalSpan>
  );
};

// Highlights a Range object. The Range object MUST NOT span over multiple DOM nodes.
const highlightSimpleRange = (range) => {
  const newNode = document.createElement('span');
  newNode.setAttribute('style', 'background-color: yellow;');
  newNode.setAttribute('data-cookiesynth-style', 'highlight');
  newNode.setAttribute('class', 'highlight');
  range.surroundContents(newNode);
  return newNode;
};

class LabelIndicator {
  #rangeUtils;
  #startIndicator = document.createElement('span');
  #endIndicator = document.createElement('span');

  constructor(rangeUtils, tagStart, tagEnd) {
    this.#rangeUtils = rangeUtils;
    this.updateTags(tagStart, tagEnd);
  }

  updateTags(tagStart, tagEnd) {
    this.#startIndicator.setAttribute('data-cookiesynth', tagStart || '');
    this.#endIndicator.setAttribute('data-cookiesynth', tagEnd || '');
  }

  inject() {
    this.#rangeUtils.prepend(this.#startIndicator);
    this.#rangeUtils.append(this.#endIndicator);
  }

  remove() {
    this.#startIndicator.replaceWith();
    this.#endIndicator.replaceWith();
  }
}
