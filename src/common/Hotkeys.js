import React, { useState, useEffect, useContext } from 'react';
import CompletableTextField from '../common/CompletableTextField.js';
import { ThemeContext } from '../theme.js';
import { Paper, Grid, Modal, Typography } from '@material-ui/core';

const IGNORE_KEYS = new Set(['Shift', 'Control', 'Alt', 'CapsLock']);

const executeActions = (actions, e) => {
  if (actions.length === 0) {
    return;
  }

  e.preventDefault();
  actions.forEach((f) => f(e.key));
}

export default class Hotkeys {
  #hotkeys = {};
  CaptureShortcut;
  Hotkey;
  CreateNewHotkey;

  constructor() {
    this.CaptureShortcut = (props) => <CaptureShortcut hotkeys={this} {...props} />;
    this.Hotkey = (props) => <Hotkey hotkeys={this} {...props} />;
    this.CreateNewHotkey = (props) => <CreateNewHotkey hotkeys={this} {...props} />;
  }

  // React effect to use hotkeys on a page
  useHotkeys() {
    const keyDownListener = (e) => {
      if (IGNORE_KEYS.has(e.key)) {
        return;
      }

      if (this.#hotkeys['all'] && this.#hotkeys['all'].length !== 0) {
        const actions = this.#hotkeys['all'];
        executeActions(actions, e);
        return;
      }

      if (e.key === 'Escape') {
        const actions = this.#hotkeys['Escape'] || [];
        executeActions(actions, e);
        return;
      }

      if (document.activeElement.tagName.toLowerCase() === 'input') {
        return;
      }

      const actions = this.#hotkeys[e.key] || [];
      executeActions(actions, e);
      return;
    };

    useEffect(() => {
      document.addEventListener('keydown', keyDownListener);
      return () => {
        document.removeEventListener('keydown', keyDownListener);
      };
    });
  }

  registerHotkey(shortcut, action) {
    let previousActions = this.#hotkeys[shortcut];
    if (!previousActions) {
      previousActions = [];
      this.#hotkeys[shortcut] = previousActions;
    }

    previousActions.push(action);
  }

  unregisterHotkey(shortcut, action) {
    this.#hotkeys[shortcut] = this.#hotkeys[shortcut].filter((x) => x !== action);
  }
}

const Hotkey = ({ hotkeys, shortcut, action, description, ...other }) => {
  const { classes } = useContext(ThemeContext);

  useEffect(() => {
    hotkeys.registerHotkey(shortcut, action);
    return () => {
      hotkeys.unregisterHotkey(shortcut, action);
    };
  });

  return (
    <Paper className={classes['c-hotkey__paper']} {...other}>
      {`${shortcut} 🠖 ${description}`}
    </Paper>
  );
};

const CaptureShortcut = ({ hotkeys, description, onCapture, ...other }) => {
  const { classes } = useContext(ThemeContext);

  useEffect(() => {
    const onCaptureHotkey = (key) => {
      onCapture(key, description);
    };

    hotkeys.registerHotkey('all', onCaptureHotkey);

    return () => {
      hotkeys.unregisterHotkey('all', onCaptureHotkey);
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

const CreateNewHotkey = ({ hotkeys, onHotkeyAdded, ...other }) => {
  const { classes } = useContext(ThemeContext);

  const [pendingLabel, setPendingLabel] = useState();
  const [captureShortcut, setCaptureShortcut] = useState(false);

  const requestHotkeyFor = (label) => {
    setPendingLabel(label);
    setCaptureShortcut(true);
  };

  const onShortcutCaptured = (shortcut, label) => {
    setCaptureShortcut(false);
    onHotkeyAdded(shortcut, label);
  };

  return (
    <div>
      <CompletableTextField
        label="Add hotkey"
        className={`${classes['c-controls--fill-width']} ${classes['c-controls__textfield']}`}
        onComplete={requestHotkeyFor}
      />
      <Modal open={captureShortcut}>
        <div>
          <CaptureShortcut
            hotkeys={hotkeys}
            description={pendingLabel}
            onCapture={onShortcutCaptured}
          />
          }
        </div>
      </Modal>
    </div>
  );
};
