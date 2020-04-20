import React, { useState, useEffect, useContext } from 'react';
import useCompletableTextField from 'common/useCompletableTextField.js';
import { ThemeContext } from 'theme.js';
import { Grid, Modal, Typography } from '@material-ui/core';
import { useClipfics } from 'tasks.js';

const IGNORE_KEYS = new Set(['Shift', 'Control', 'Alt', 'CapsLock']);

const executeActions = (actions, e) => {
  if (actions.length === 0) {
    return;
  }

  e.preventDefault();
  actions.forEach((f) => f(e.key));
};

export default class Hotkeys {
  lastUpdate = 0;
  watchers = [];
  #hotkeys = {};

  // React effect to use hotkeys on a page
  useHotkeyListener() {
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
    this.lastUpdate += 1;
  }

  unregisterHotkey(shortcut, action) {
    this.#hotkeys[shortcut] = this.#hotkeys[shortcut].filter((x) => x !== action);
    this.lastUpdate += 1;
  }

  useHotkeys() {
    const [, setLastUpdate] = useState(this.lastUpdate);

    useEffect(() => {
      this.watchers.push(setLastUpdate);
      return () => {
        this.watchers = this.watchers.filter((x) => x !== setLastUpdate);
      };
    }, []);

    return this.#hotkeys;
  }
}

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

const CreateNewHotkeyComponent = ({
  CompletableTextField,
  inputRef,
  hotkeys,
  onHotkeyAdded,
  isHotkeyValid,
  value,
  ...other
}) => {
  const { classes } = useContext(ThemeContext);

  const [pendingLabel, setPendingLabel] = useState();
  const [captureShortcut, setCaptureShortcut] = useState(false);
  const clipfics = useClipfics();

  const requestHotkeyFor = (label) => {
    if (!isHotkeyValid(label)) {
      clipfics.terminal.log('invalid hotkey', label);
      return;
    }

    setPendingLabel(label);
    setCaptureShortcut(true);
  };

  useEffect(() => {
    inputRef.requestHotkeyFor = requestHotkeyFor;
  }, [inputRef]);

  const onShortcutCaptured = (shortcut, label) => {
    setCaptureShortcut(false);
    onHotkeyAdded(shortcut, label);
  };

  return (
    <div>
      <CompletableTextField
        value={value}
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

export const useCreateNewHotkey = (isHotkeyValid) => {
  const { CompletableTextField, getValue, setValue } = useCompletableTextField();
  const [inputRef] = useState({});
  const clipfics = useClipfics();

  const requestHotkey = () => {
    const action = getValue();
    if (!isHotkeyValid(action)) {
      clipfics.terminal.log('invalid hotkey:', action);
      return;
    }

    inputRef.requestHotkeyFor(getValue());
  };

  return {
    CreateNewHotkey: (props) => (
      <CreateNewHotkeyComponent
        CompletableTextField={CompletableTextField}
        inputRef={inputRef}
        {...props}
      />
    ),
    getValue,
    setValue,
    requestHotkey,
  };
};
