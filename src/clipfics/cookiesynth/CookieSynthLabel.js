import React, { useState } from 'react';
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
import { Meta } from '../MetaReplay.js';

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
  missingTemplateProperties = [];
  #templatePropertyOffsets = [];
  providedValues = [];
  #template;
  #range;
  completedLabel;

  constructor(range, template) {
    const missingValueMatches = getMissingValues(template);

    for (let item of missingValueMatches) {
      const context = item[1];
      const offset = item.index + item[0].search('"?"') + 1;
      this.#templatePropertyOffsets.push([context, offset]);
      this.missingTemplateProperties.push(context);
    }

    this.#range = range;
    this.#template = template;
  }

  setNextValue(value) {
    const nextIndex = this.providedValues.length;
    const [, offset] = this.#templatePropertyOffsets[nextIndex];
    this.providedValues.push([value, offset]);
  }

  hasMissingValues() {
    return this.missingTemplateProperties.length !== this.providedValues.length;
  }

  getCompletedLabel() {
    if (this.completedLabel) {
      return this.completedLabel;
    }

    let originalLabel = this.#template;
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

  injectLabel(clipfics) {
    const { terminal, selection, requestNewLabel, metaReplay } = clipfics;
    let completedLabel = this.getCompletedLabel();

    if (!isLabelValid(completedLabel)) {
      return false;
    }

    const utils = new RangeUtils(this.#range);

    // add the label
    const indicator = new LabelIndicator(utils, selection, completedLabel);
    indicator.inject();

    const metaTransition = new MetaTransition(metaReplay, this.#range);
    metaTransition.apply(completedLabel);

    terminal.append(
      <LabelLog
        terminal={terminal}
        indicator={indicator}
        metaTransition={metaTransition}
        requestNewLabel={requestNewLabel}
      />,
    );

    return true;
  }
}

const LabelLink = ({ contents, label, onClick, removed }) => {
  const actionString = removed ? 'removed label:' : 'added label:';
  return (
    <TerminalType onClick={onClick}>
      {actionString} {contents} => {label}
    </TerminalType>
  );
};

const LabelControls = ({ onReplace, onRemove, disabled }) => {
  return (
    <TerminalSpan>
      <TerminalButton disabled={disabled} onClick={onReplace}>
        Update label
      </TerminalButton>
      <TerminalButton disabled={disabled} onClick={onRemove}>
        Remove label
      </TerminalButton>
    </TerminalSpan>
  );
};

const LabelLog = ({ terminal, indicator, metaTransition, requestNewLabel }) => {
  const [indicatorState, setIndicatorState] = useState(0);
  const [disabled, setDisabled] = useState(false);

  const replaceLabel = () => {
    requestNewLabel(indicator.completedLabel, (newLabel) => {
      if (!isLabelValid(newLabel)) {
        terminal.log('invalid update');
        return;
      }

      indicator.updateLabel(newLabel);
      metaTransition.apply(newLabel);
      setIndicatorState(indicatorState + 1);
    });

    return true;
  };

  const removeLabel = () => {
    indicator.remove();
    metaTransition.remove();
    setDisabled(true);
  };

  return (
    <TerminalSpan>
      <LabelLink
        contents={indicator.getContents()}
        label={indicator.completedLabel}
        onClick={() => indicator.select()}
        removed={disabled}
      />
      <LabelControls
        onReplace={replaceLabel}
        onRemove={removeLabel}
        disabled={disabled}
      />
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
  rangeUtils;
  selection;
  completedLabel;
  startIndicator = document.createElement('span');
  endIndicator = document.createElement('span');
  highlightNodes = [];

  constructor(rangeUtils, selection, completedLabel) {
    this.rangeUtils = rangeUtils;
    this.selection = selection;
    this.completedLabel = completedLabel;

    const [tagStart, tagEnd] = getTagsFromLabel(completedLabel);
    this.updateTags(tagStart, tagEnd);
  }

  updateTags(tagStart, tagEnd) {
    this.startIndicator.setAttribute('data-cookiesynth', tagStart || '');
    this.endIndicator.setAttribute('data-cookiesynth', tagEnd || '');
  }

  updateLabel(newLabel) {
    const [tagStart, tagEnd] = getTagsFromLabel(newLabel);
    this.updateTags(tagStart, tagEnd);
    this.completedLabel = newLabel;
  }

  inject() {
    this.rangeUtils.prepend(this.startIndicator);
    this.rangeUtils.append(this.endIndicator);

    // add the highlight
    this.rangeUtils.apply((range) => {
      if (new RangeUtils(range).getText().length === 0) {
        return;
      }

      const newNode = highlightSimpleRange(range);
      this.highlightNodes.push(newNode);
    });
  }

  remove() {
    this.startIndicator.replaceWith();
    this.endIndicator.replaceWith();

    for (let node of this.highlightNodes) {
      node.replaceWith(...node.childNodes);
    }
  }

  select() {
    this.rangeUtils.scrollIntoView();
    this.rangeUtils.setSelection(this.selection);
  }

  getContents() {
    return this.rangeUtils.getText(22, 5);
  }
}

const getMetaLabelMap = (label) => {
  const result = new Map();

  const properties = matchesToString(getAllProperties(label));
  const values = matchesToString(getAllValues(label));

  const targetKey = `${properties[0]}="${values[0]}"`;
  const targetMap = new Map();
  result.set(targetKey, targetMap);

  for (let i = 1; i < properties.length; i++) {
    const assignmentProp = properties[i];
    const assignmentValue = values[i];
    targetMap.set(assignmentProp, assignmentValue);
  }

  return result;
};

class MetaTransition {
  metaReplay;
  range;
  label;
  isMeta = false;
  meta;

  constructor(metaReplay, range) {
    this.metaReplay = metaReplay;
    this.range = range;
  }

  apply(newLabel) {
    if (this.isMeta) {
      this.metaReplay.remove(this.range, this.meta);
    }

    if (getTypeFromLabel(newLabel) === 'meta') {
      this.isMeta = true;

      const newMetaMap = getMetaLabelMap(newLabel);
      const newMeta = new Meta(newMetaMap);
      this.meta = newMeta;

      this.metaReplay.add(this.range, newMeta);
    }
  }

  remove() {
    if (this.meta) {
      this.metaReplay.remove(this.range, this.meta);
    }
  }
}
