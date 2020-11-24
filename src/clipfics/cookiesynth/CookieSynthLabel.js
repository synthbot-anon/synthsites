import React, { useState, useEffect } from 'react';
import {
  isLabelValid,
  getTagsFromLabel,
  getMissingValues,
  getTypeFromLabel,
  getAllProperties,
  getAllValues,
  getCookieSynthOpenLabelType,
  getCookieSynthCloseLabelType,
} from './common.js';
import RangeUtils from 'common/RangeUtils.js';
import { TerminalType, TerminalButton, TerminalSpan } from 'common/Terminal.js';
import { Meta } from '../MetaReplay.js';
import RangeTreeMap from 'common/RangeTreeMap.js';

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
export class TemplateDescription {
  #description;
  type;
  properties;
  values;
  propDescriptions;

  constructor(partialLabel, description, propDescriptions) {
    this.#description = description;
    this.type = getTypeFromLabel(partialLabel);
    this.properties = matchesToString(getAllProperties(partialLabel));
    this.values = matchesToString(getAllValues(partialLabel));
    this.propDescriptions = propDescriptions || [];

    if (new Set(this.properties).size !== this.properties.length) {
      console.log(
        'WARNING: TemplateDescription does not work with duplicate properties',
      );
    }
  }

  getDescription(targetLabel) {
    if (!targetLabel) {
      return '';
    }

    let result = this.#description;

    const targetType = getTypeFromLabel(targetLabel);
    const targetProps = matchesToString(getAllProperties(targetLabel));
    const targetValues = matchesToString(getAllValues(targetLabel));

    if (new Set(targetProps).size !== targetProps.length) {
      console.log(
        'WARNING: TemplateDescription does not work with duplicate properties',
      );
      return null;
    }

    // Easy check by type and lengths. We'll assume these match later.
    if (
      targetType !== this.type ||
      targetProps.length !== this.properties.length ||
      targetValues.length !== this.values.length
    ) {
      return null;
    }

    // We'll need to look up label values by property
    const targetDict = {};
    for (let i = 0; i < targetProps.length; i++) {
      targetDict[targetProps[i]] = targetValues[i];
    }

    // Check all properties and values
    for (let i = 0; i < this.properties.length; i++) {
      const prop = this.properties[i];
      const val = this.values[i];

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

  getPropDescription(prop) {
    let descOffset = 0;

    for (let i = 0; i < this.properties.length; i++) {
      let descriptionAllowed = (this.values[i] == "?");
      if (!descriptionAllowed) {
        continue;
      }

      if (prop == this.properties[i]) {
        return this.propDescriptions[descOffset];
      }

      descOffset += 1;
    }
  }
}

export default class CookieSynthLabel {
  missingTemplateProperties = [];
  #templatePropertyOffsets = [];
  providedValues = [];
  template;
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
    this.template = template;
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

    let originalLabel = this.template;
    let result = '';
    let lastOffset = 0;
    for (let i = 0; i < this.providedValues.length; i++) {
      const [value, nextOffset] = this.providedValues[i];
      const appendPart = originalLabel.substring(lastOffset, nextOffset);
      result += appendPart + value;
      lastOffset = nextOffset + 1;
    }
    result += originalLabel.substring(lastOffset, originalLabel.length);

    const type = getTypeFromLabel(result);
    const properties = matchesToString(getAllProperties(result));
    const values = matchesToString(getAllValues(result));

    this.completedLabel = type;
    for (let i = 0; i < properties.length; i++) {
      if (values[i].length !== 0) {
        this.completedLabel += ` ${properties[i]}="${values[i]}"`;
      }
    }

    return this.completedLabel;
  }

  injectLabel(clipfics) {
    const { terminal, selection, metaReplay, onLabelClicked } = clipfics.api;
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

    terminal.append(({ terminalKey }) => (
      <LabelLog
        terminalKey={terminalKey}
        terminal={terminal}
        range={this.#range}
        onLabelClicked={onLabelClicked}
        indicator={indicator}
        metaTransition={metaTransition}
      />
    ));

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
      <TerminalButton disabled={disabled} onClick={onRemove}>
        Remove label
      </TerminalButton>
    </TerminalSpan>
  );
};

const LabelLog = ({
  terminalKey,
  terminal,
  range,
  indicator,
  metaTransition,
  onLabelClicked,
}) => {
  const [indicatorState, setIndicatorState] = useState(0);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const bump = () => {
      terminal.bump(terminalKey);
    };

    onLabelClicked.add(range, bump);
    return () => {
      onLabelClicked.remove(range, bump);
    };
  }, []);

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
        onRemove={removeLabel}
        disabled={disabled}
      />
    </TerminalSpan>
  );
};

class LabelIndicator {
  rangeUtils;
  selection;
  completedLabel;
  startIndicator;
  endIndicator;
  highlightNodes = [];

  constructor(rangeUtils, selection, completedLabel) {
    this.rangeUtils = rangeUtils;
    this.selection = selection;
    this.completedLabel = completedLabel;

    const [tagStart, tagEnd] = getTagsFromLabel(completedLabel);
    this.updateTags(tagStart, tagEnd);
  }

  updateTags(tagStart, tagEnd) {
    if (this.startIndicator && !tagStart) {
      this.startIndicator.remove();
      this.startIndicator = null;
    } else if (tagStart && !this.startIndicator) {
      this.startIndicator = document.createElement('span');
      this.startIndicator.setAttribute('data-cookiesynth', tagStart);
      this.rangeUtils.prepend(this.startIndicator);
    } else if (this.startIndicator && tagStart) {
      this.startIndicator.setAttribute('data-cookiesynth', tagStart);
    }

    if (this.endIndicator && !tagEnd) {
      this.endIndicator.remove();
      this.endIndicator = null;
    } else if (tagEnd && !this.endIndicator) {
      this.endIndicator = document.createElement('span');
      this.endIndicator.setAttribute('data-cookiesynth', tagEnd);
      this.rangeUtils.append(this.endIndicator);
    } else if (this.endIndicator && tagEnd) {
      this.endIndicator.setAttribute('data-cookiesynth', tagEnd);
    }
  }

  updateLabel(newLabel) {
    this.completedLabel = newLabel;
    const [tagStart, tagEnd] = getTagsFromLabel(newLabel);
    this.updateTags(tagStart, tagEnd);
    this.updateHighlight();
  }

  highlightMeta(range) {
    const newNode = document.createElement('span');
    newNode.setAttribute('class', 'o-label--meta-highlight');
    range.surroundContents(newNode);
    this.highlightNodes.push(newNode);
  }

  highlightLabel(range) {
    const highlightClass = 'o-label--blcat-highlight-full';

    const newNode = document.createElement('span');
    newNode.setAttribute('class', highlightClass);
    range.surroundContents(newNode);
    this.highlightNodes.push(newNode);
  }

  inject() {
    this.updateHighlight();
  }

  updateHighlight() {
    this.highlightNodes.forEach((n) => n.replaceWith(...n.childNodes));
    this.highlightNodes = [];

    let highlightRange = this.rangeUtils;

    const isMeta = getTypeFromLabel(this.completedLabel) === 'meta';
    if (isMeta) {
      highlightRange = highlightRange.limitChars(10);
    }

    // add the highlight
    highlightRange.apply((range) => {
      // if (new RangeUtils(range).getText().length === 0) {
      //   return;
      // }
      if (isMeta) {
        this.highlightMeta(range);
      } else {
        this.highlightLabel(range);
      }
    });
  }

  remove() {
    this.startIndicator.replaceWith();
    if (this.endIndicator) {
      this.endIndicator.replaceWith();
    }

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

export const reloadLabels = (clipfics) => {
  const { terminal } = clipfics.api;
  const div = clipfics.api.storyContainerRef.current;
  const pendingLabels = new Map();

  div.querySelectorAll('[data-cookiesynth]').forEach((e) => {
    let label = e.dataset.cookiesynth;
    if (label.length === 0) {
      return;
    }

    if (label[0] !== '[' || label[label.length - 1] !== ']') {
      terminal.log('invalid label:', label);
      return;
    }

    label = label.substring(1, label.length - 1);

    const openLabelType = getCookieSynthOpenLabelType(label);
    if (openLabelType) {
      if (openLabelType === 'meta') {
        const range = new Range();
        range.setStartAfter(e);
        range.setEndBefore(e);

        const metaRange = new RangeUtils(range).fillToCharCount(10).range;
        e.parentNode.removeChild(e);
        new CookieSynthLabel(metaRange, label).injectLabel(clipfics);
        return;
      }
      const typeStack = pendingLabels.get(openLabelType) || [];
      pendingLabels.set(openLabelType, typeStack);
      typeStack.push([label, e]);
      return;
    }

    const closeLabelType = getCookieSynthCloseLabelType(label);
    if (closeLabelType) {
      const typeStack = pendingLabels.get(closeLabelType);
      const [label, start] = typeStack.pop();
      const range = new Range();

      const startContainer = start.nextSibling;
      const startOffset = 0;
      start.parentNode.removeChild(start);

      console.log(e.previousSibling);
      let endContainer = e.previousSibling;
      let endOffset;

      if (endContainer) {
        endOffset = endContainer.length;
      } else {
        endContainer = e.parentNode;
        endOffset = Array.prototype.indexOf.call(endContainer.children, e);
        console.log('using custom end container/offset for', closeLabelType);
      }

      e.parentNode.removeChild(e);

      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);

      new CookieSynthLabel(range, label).injectLabel(clipfics);
      return;
    }

    terminal.log('invalid label:', label);
  });
};
