import React, { useState, useContext } from 'react';
import { Grid } from '@material-ui/core';

import { ThemeContext } from '../theme.js';
import { ClipficsContext } from '../tasks.js';
import RangeUtils from '../common/RangeUtils.js';
import TextFieldModal from '../common/TextFieldModal.js';

/**
 * React effect to highlight text by hotkey.
 * @param navigator StateMachine with which to register this hotkey
 * @param containerRef React ref for where a selection is valid
 */
const ClipficsHotkey = ({ onLabel, shortcut, description }) => {
  const { hotkeys, selection } = useContext(ClipficsContext);

  // Highlight selection only if it falls within the container
  const highlightWithinElement = () => {
    const selectionRange = selection.getRange();
    if (selectionRange) {
      console.log('range:', selectionRange);
      console.log('description:', description);
      onLabel(selectionRange, description);
    }
  };

  return (
    <hotkeys.Hotkey
      shortcut={shortcut}
      action={highlightWithinElement}
      description={description}
    />
  );
};

// Highlights a Range object. The Range object MUST NOT span over multiple DOM nodes.
const highlightSimpleRange = (range) => {
  const newNode = document.createElement('div');
  newNode.setAttribute('style', 'background-color: yellow; display: inline;');
  newNode.setAttribute('class', 'highlight');
  range.surroundContents(newNode);
};

const addLabelToRange = (tagStart, tagEnd, range) => {
  const utils = new RangeUtils(range);

  const startIndicator = document.createElement('span');
  startIndicator.setAttribute('data-cookiesynth', tagStart);
  utils.prepend(startIndicator);

  const endIndicator = document.createElement('span');
  endIndicator.setAttribute('data-cookiesynth', tagEnd);
  utils.append(endIndicator);

  // Highlight the selection
  utils.apply((range) => highlightSimpleRange(range));
};


const KEYWORD = '[a-zA-Z][a-zA-Z0-9]*';
const VALUE = '"(?:[^"]*|\\?)"'
const SEGTYPE = `${KEYWORD}`;
const OPEN_REGEX = new RegExp(`^\\s*(${KEYWORD})(?:\\s*=\\s*${VALUE}|(?:\\s+${SEGTYPE}\\s*=\\s*${VALUE})*)\\s*$`);
const MISSING_VALUES_REGEX = new RegExp(`(${KEYWORD})\\s*=\\s*"(\\?)"`, 'g');

const isLabelValid = (label) => {
  const result = OPEN_REGEX.test(label);
  console.log(result, label);
  return result;
};

const getTagsFromLabel = (label) => {
  
  const match = OPEN_REGEX.exec(label);
  const [full, keyword] = match;

  const tagStart = `[${full}]`;
  const tagEnd = `[/${keyword}]`

  console.log('start:', tagStart);
  console.log('end:', tagEnd);

  return [tagStart, tagEnd];
};


class PendingLabel {
  #missingValues = [];
  #providedValues = [];
  #label;
  #range;

  constructor(range, label) {
    console.log(label);
    const missingValueMatches = label.matchAll(MISSING_VALUES_REGEX);

    for (let item of missingValueMatches) {
      const context = item[1];
      const offset = item.index + item[0].search('"?"') + 1;
      this.#missingValues.push([context, offset]);
      console.log('seeking value for', context, 'at', offset);
    };

    this.#range = range;
    this.#label = label;
    console.log("missing values:", this.#missingValues);
  }

  missingValuesRemaining() {
    return this.#missingValues.length - this.#providedValues.length;
  }

  hasMissingValues() {
    return this.missingValuesRemaining() !== 0;
  }

  nextContext() {
    if (!this.hasMissingValues()) {
      return null;
    }

    const nextIndex = this.#providedValues.length;
    return this.#missingValues[nextIndex][0];
  }

  setNextValue(value) {
    const nextIndex = this.#providedValues.length;
    const [, offset] = this.#missingValues[nextIndex];
    this.#providedValues.push([value, offset]);
  }

  getCompletedLabel() {
    if (this.hasMissingValues()) {
      throw new Error('label not complete');
    }

    let originalLabel = this.#label;
    let result = '';
    let lastOffset = 0;
    for (let i = 0; i < this.#providedValues.length; i++) {
      const [value, nextOffset] = this.#providedValues[i];
      console.log('value:', value, 'offset:', nextOffset);
      const appendPart = originalLabel.substring(lastOffset, nextOffset);
      console.log('appending', appendPart, 'then', value);
      result += appendPart + value;
      lastOffset = nextOffset + 1;
    }
    result += originalLabel.substring(lastOffset, originalLabel.length);

    console.log('completed label:', result);
    return result;
  }

  getRange() {
    return this.#range;
  }

  injectLabel() {
    const completedLabel = this.getCompletedLabel();

    if (!isLabelValid(completedLabel)) {
      console.log('invalid label:', `|${completedLabel}|`);
      return;
    }

    const [tagStart, tagEnd] = getTagsFromLabel(completedLabel);
    addLabelToRange(tagStart, tagEnd, this.#range);

  }
}

export const ClipficsLabelsPanel = ({ ...props }) => {
  const { classes } = useContext(ThemeContext);
  const { hotkeys, selection } = useContext(ClipficsContext);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  let [savedRange, setSavedRange] = useState();
  const [displayKeys, setDisplayKeys] = useState([]);

  let [pendingLabel, setPendingLabel] = useState();
  let [missingCount, setMissingCount] = useState(0);

  const openLabelModal = () => {
    if (!saveCurrentRange()) {
      return;
    }

    setLabelModalOpen(true);
  };

  const saveCurrentRange = () => {
    savedRange = selection.getRange();
    if (!savedRange) {
      return false;
    }

    setSavedRange(savedRange);
    return true;
  }

  const restoreRange = () => {
    selection.setRange(savedRange);
  };

  const closeLabelModal = () => {
    setLabelModalOpen(false);
    restoreRange();
  };

  const completeLabelModal = (text) => {
    setLabelModalOpen(false);
    restoreRange();
    onLabelEntered(savedRange, text);
  };

  const onLabelEntered = (selection, text) => {
    if (!saveCurrentRange()) {
      return;
    }

    console.log('label entered:', text);
    pendingLabel = new PendingLabel(selection, text);

    if (pendingLabel.hasMissingValues()) {
      console.log('have missing values');
      setPendingLabel(pendingLabel);
      setMissingCount(pendingLabel.missingValuesRemaining());
    } else {
      console.log('no missing values');
      onLabelComplete();
    }
  }

  const onLabelUpdated = (text) => {
    console.log('label updated:', text);
    pendingLabel.setNextValue(text);

    const remainingValues = pendingLabel.missingValuesRemaining();
    setMissingCount(remainingValues);


    if (remainingValues === 0) {
      console.log('no more missing values');
      onLabelComplete();
    } else {
      console.log('still have missing values');
    }
  };

  const onLabelComplete = () => {
    console.log('label complete');
    pendingLabel.injectLabel();
    setPendingLabel(null);
  };

  const dropLabel = () => {
    console.log('label dropped');
    setPendingLabel(null);
  };

  const onHotkeyAdded = (shortcut, label) => {
    const newHotkey = (
      <ClipficsHotkey
        key={`${shortcut} -> ${label}`}
        onLabel={onLabelEntered}
        shortcut={shortcut}
        description={label}
      />
    );

    setDisplayKeys([newHotkey, ...displayKeys]);
  };

  return (
    <Grid container {...props}>
      <Grid item className={classes['c-controls--fill-width']}>
        <hotkeys.Hotkey
          shortcut="Enter"
          action={openLabelModal}
          description="create custom label"
        />
        <ClipficsHotkey
          shortcut="c"
          onLabel={onLabelEntered}
          description='character="?"'
        />
        <ClipficsHotkey
          shortcut="e"
          onLabel={onLabelEntered}
          description='emotion="?"'
        />
        <div children={displayKeys} />
        <TextFieldModal
          open={labelModalOpen}
          onComplete={completeLabelModal}
          onClose={closeLabelModal}
          label="Add label"
        />
        <TextFieldModal
          open={missingCount !== 0}
          onComplete={onLabelUpdated}
          onClose={dropLabel}
          label={pendingLabel && pendingLabel.nextContext()}
        />
        <hotkeys.CreateNewHotkey onHotkeyAdded={onHotkeyAdded} />
      </Grid>
    </Grid>
  );
};
