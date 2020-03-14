import React, { useState, useContext } from 'react';
import { Grid, Modal } from '@material-ui/core';
import { ThemeContext } from '../theme.js';
import { ClipficsContext } from '../tasks.js';
import CompletableTextField from '../utils/CompletableTextField.js';

/**
 * React effect to highlight text by hotkey.
 * @param navigator StateMachine with which to register this hotkey
 * @param containerRef React ref for where a selection is valid
 */
const HotkeyHighlighter = ({ onLabel, shortcut, description }) => {
  const { hotkeys, selection } = useContext(ClipficsContext);

  // Highlight selection only if it falls within the container
  const highlightWithinElement = () => {
    const selectionRange = selection.getRange();
    if (selectionRange) {
      onLabel(description, selectionRange);
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

const CustomLabelHotkey = ({ onLabel, ...other }) => {
  const { hotkeys, selection } = useContext(ClipficsContext);
  const { classes } = useContext(ThemeContext);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [savedRange, setSavedRange] = useState(null);

  const openLabelDialog = () => {
    const selectionRange = selection.getRange();

    if (!selectionRange) {
      return;
    }

    setSavedRange(selectionRange);
    setShowLabelModal(true);
  };

  const escapeLabelDialog = () => {
    setShowLabelModal(false);
    selection.setRange(savedRange);
  };

  const finishLabelDialog = (text) => {
    setShowLabelModal(false);
    selection.setRange(savedRange);
    onLabel(text, savedRange);
  };

  return (
    <div>
      <hotkeys.Hotkey
        shortcut="Enter"
        action={openLabelDialog}
        description="create custom label"
      />
      <Modal open={showLabelModal} onClose={escapeLabelDialog}>
        <div className={classes['c-labelmodal__container']}>
          <CompletableTextField
            label="Add label"
            className={classes['c-labelmodal__textfield']}
            autoFocus
            onComplete={finishLabelDialog}
          />
        </div>
      </Modal>
    </div>
  );
};

export const ClipficsLabelsPanel = ({ onLabel, ...other }) => {
  const { classes } = useContext(ThemeContext);
  const { hotkeys } = useContext(ClipficsContext);

  const [displayKeys, setDisplayKeys] = useState([
    <HotkeyHighlighter
      key="h -> highlight selection"
      onLabel={onLabel}
      shortcut="q"
      description="highlight selection"
    />,
  ]);

  const onHotkeyAdded = (shortcut, label) => {
    const newHotkey = (
      <HotkeyHighlighter
        key={`${shortcut} -> ${label}`}
        onLabel={onLabel}
        shortcut={shortcut}
        description={label}
      />
    );

    setDisplayKeys([newHotkey, ...displayKeys]);
  };

  return (
    <Grid container {...other}>
      <Grid item className={classes['c-controls--fill-width']}>
        <div children={displayKeys} />
        <CustomLabelHotkey onLabel={onLabel} />
        <hotkeys.CreateNewHotkey onHotkeyAdded={onHotkeyAdded} />
      </Grid>
    </Grid>
  );
};
