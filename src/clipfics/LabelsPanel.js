import React, { useState, useEffect, useContext } from 'react';
import { Grid, Modal, Paper, TextField, Typography } from '@material-ui/core';
import RangeUtils from '../utils/RangeUtils.js';
import { ThemeContext } from '../theme.js';
import { ClipficsContext } from '../tasks.js';

// Highlights a Range object. The Range object MUST NOT span over multiple DOM nodes.
const highlightSimpleRange = (range) => {
  const newNode = document.createElement('div');
  newNode.setAttribute('style', 'background-color: yellow; display: inline;');
  range.surroundContents(newNode);
};

const getWindowSelection = () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    return;
  }

  return selection.getRangeAt(0);
};

const setWindowSelection = (range) => {
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

const isSelectionWithin = (selectionRange, container) => {
  if (!selectionRange) {
    return false;
  }

  const startNode = selectionRange.startContainer;
  const endNode = selectionRange.endContainer;

  if (!container.contains(startNode)) {
    return false;
  }

  if (!container.contains(endNode)) {
    return false;
  }

  return true;
};

/**
 * React effect to highlight text by hotkey.
 * @param navigator StateMachine with which to register this hotkey
 * @param containerRef React ref for where a selection is valid
 */
const HotkeyHighlighter = ({ shortcut, description }) => {
  const { storyContainerRef } = useContext(ClipficsContext);

  // Highlight selection only if it falls within the container
  const highlightWithinElement = () => {
    const selectionRange = getWindowSelection();
    if (!isSelectionWithin(selectionRange, storyContainerRef.current)) {
      return;
    }

    // Highlight the selection
    const utils = new RangeUtils(selectionRange);
    utils.apply(highlightSimpleRange);
  };

  return (
    <Hotkey
      shortcut={shortcut}
      action={highlightWithinElement}
      description={description}
    />
  );
};

const registerHotkey = (hotkeys, shortcut, action) => {
  let previousActions = hotkeys[shortcut];
  if (!previousActions) {
    previousActions = [];
    hotkeys[shortcut] = previousActions;
  }

  previousActions.push(action);
};

const unregisterHotkey = (hotkeys, shortcut, action) => {
  hotkeys[shortcut] = hotkeys[shortcut].filter((x) => x !== action);
};

const Hotkey = ({ shortcut, action, description, ...other }) => {
  const { classes } = useContext(ThemeContext);
  const { hotkeys } = useContext(ClipficsContext);

  useEffect(() => {
    registerHotkey(hotkeys, shortcut, action);
    return () => {
      unregisterHotkey(hotkeys, shortcut, action);
    };
  });

  return (
    <Paper className={classes['c-hotkey__paper']} {...other}>
      {`${shortcut} 🠖 ${description}`}
    </Paper>
  );
};

const CompletableTextField = ({ onComplete, ...other }) => {
  const [text, setText] = useState('');

  const onSubmitted = (e) => {
    e.preventDefault();
    onComplete(text);
    setText('');
  };

  return (
    <form onSubmit={onSubmitted}>
      <TextField {...other} value={text} onChange={(e) => setText(e.target.value)} />
    </form>
  );
};

const CreateNewHotkey = ({ onComplete, ...other }) => {
  const { classes } = useContext(ThemeContext);

  return (
    <CompletableTextField
      label="Add hotkey"
      className={`${classes['c-controls--fill-width']} ${classes['c-controls__textfield']}`}
      onComplete={onComplete}
    />
  );
};

const CustomLabelHotkey = (props) => {
  const { storyContainerRef } = useContext(ClipficsContext);
  const { classes } = useContext(ThemeContext);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectionRange, setSelectionRange] = useState(null);

  const openLabelDialog = () => {
    const sel = getWindowSelection();
    if (!isSelectionWithin(sel, storyContainerRef.current)) {
      return;
    }

    setSelectionRange(getWindowSelection(sel));
    setShowLabelModal(true);
  };

  const escapeLabelDialog = () => {
    console.log(selectionRange);
    setShowLabelModal(false);
    setWindowSelection(selectionRange);
  };

  const finishLabelDialog = (text) => {
    setShowLabelModal(false);
    setWindowSelection(selectionRange);
  };

  return (
    <div>
      <Hotkey
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

const CaptureHotkey = ({ description, onCapture, ...other }) => {
  const { classes } = useContext(ThemeContext);
  const { hotkeys } = useContext(ClipficsContext);

  useEffect(() => {
    const onCaptureHotkey = (key) => {
      onCapture(key, description);
    };

    registerHotkey(hotkeys, 'all', onCaptureHotkey);

    return () => {
      unregisterHotkey(hotkeys, 'all', onCaptureHotkey);
    };
  });

  return (
    <Grid
      container
      alignItems="center"
      justify="center"
      className={classes['c-request-hotkey__paper']}
      {...other}
    >
      <Typography display="inline" className={classes['c-request-hotkey__request']}>
        Select a hotkey
      </Typography>
      <Typography
        display="inline"
        className={classes['c-request-hotkey__description']}
      >
        {` ${description}`}
      </Typography>
    </Grid>
  );
};

// Mock of what the Labels tab will look like.
export const ClipficsLabelsPanel = (props) => {
  const { classes } = useContext(ThemeContext);
  const [hotkeys, setHotkeys] = useState([]);
  const [pendingLabel, setPendingLabel] = useState();
  const [captureHotkey, setCaptureHotkey] = useState(false);

  const requestHotkeyFor = (label) => {
    setPendingLabel(label);
    setCaptureHotkey(true);
  };

  const onHotkeyCaptured = (hotkey, label) => {
    const key = `${hotkey} -> ${label}`;
    hotkeys.push(
      <HotkeyHighlighter key={key} shortcut={hotkey} description={label} />,
    );

    setHotkeys(hotkeys);
    setCaptureHotkey(false);
  };

  return (
    <Grid container {...props}>
      <Grid item className={classes['c-controls--fill-width']}>
        <Modal open={captureHotkey}>
          <div>
            <CaptureHotkey description={pendingLabel} onCapture={onHotkeyCaptured} />}
          </div>
        </Modal>
        <div children={hotkeys} />
        <HotkeyHighlighter shortcut="h" description="highlight selection" />
        <CustomLabelHotkey />
        <CreateNewHotkey onComplete={requestHotkeyFor} />
      </Grid>
    </Grid>
  );
};
