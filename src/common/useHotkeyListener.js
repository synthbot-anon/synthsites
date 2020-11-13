import React, { useState, useEffect, useContext, useRef } from 'react';
import useCompletableTextField from 'common/useCompletableTextField.js';
import { ThemeContext } from 'theme.js';
import { Grid, Modal, Typography } from '@material-ui/core';
import { useClipficsContext } from 'tasks.js';
import synthComponent from 'common/synthComponent.js';

const IGNORE_KEYS = new Set(['Shift', 'Control', 'Alt', 'CapsLock']);

const executeActions = (actions, e) => {
  if (actions.length === 0) {
    return;
  }

  e.preventDefault();
  actions.forEach((f) => f(e.key));
};

const DEFAULT_HOTKEY_SET = 'default';

// React effect to use hotkeys on a page
export default () => {
  const { api, components, internal } = synthComponent();

  // internal.lastUpdate = 0;
  // internal.watchers = [];
  internal.hotkeySets = new Map();
  internal.hotkeySets.set(DEFAULT_HOTKEY_SET, {});
  api.activeHotkeySet = DEFAULT_HOTKEY_SET;

  internal.activeHotkeys = internal.hotkeySets.get(DEFAULT_HOTKEY_SET);

  const keyDownListener = (e) => {
    if (IGNORE_KEYS.has(e.key)) {
      return;
    }

    if (internal.activeHotkeys['all'] && internal.activeHotkeys['all'].length !== 0) {
      const actions = internal.activeHotkeys['all'];
      executeActions(actions, e);
      return;
    }

    if (e.key === 'Escape') {
      const actions = internal.activeHotkeys['Escape'] || [];
      executeActions(actions, e);
      return;
    }

    if (document.activeElement.tagName.toLowerCase() === 'input') {
      return;
    }

    const actions = internal.activeHotkeys[e.key] || [];
    executeActions(actions, e);
    return;
  };

  useEffect(() => {
    document.addEventListener('keydown', keyDownListener);
    return () => {
      document.removeEventListener('keydown', keyDownListener);
    };
  });

  api.registerHotkey = (hotkeySetName, shortcut, action) => {
    const hotkeySet = internal.hotkeySets.get(hotkeySetName);
    let previousActions = hotkeySet[shortcut];
    if (!previousActions) {
      previousActions = [];
      hotkeySet[shortcut] = previousActions;
    }

    previousActions.push(action);
  };

  api.unregisterHotkey = (hotkeySetName, shortcut, action) => {
    const hotkeySet = internal.hotkeySets.get(hotkeySetName);
    hotkeySet[shortcut] = hotkeySet[shortcut].filter((x) => x !== action);
  };

  api.useHotkeySet = (name) => {
    internal.activeHotkeys = internal.hotkeySets.get(name) || new Map();
    internal.hotkeySets.set(name, internal.activeHotkeys);
    api.activeHotkeySet = name;
  };

  api.deleteHotkeySet = (name) => {
    internal.hotkeySets.delete(name);
  };

  // const CaptureShortcut = ({ description, onCapture }) => {
  //   const { classes } = useContext(ThemeContext);

  //   useEffect(() => {
  //     const onCaptureHotkey = (key) => {
  //       onCapture(key, description);
  //     };

  //     api.registerHotkey('all', onCaptureHotkey);

  //     return () => {
  //       api.unregisterHotkey('all', onCaptureHotkey);
  //     };
  //   });

  //   return (
  //     <Grid
  //       container
  //       alignItems="center"
  //       justify="center"
  //       className={classes['c-request-hotkey__paper']}
  //       {...other}
  //     >
  //       <Typography display="inline" className={classes['c-request-hotkey__request']}>
  //         Select a hotkey
  //       </Typography>
  //       <Typography
  //         display="inline"
  //         className={classes['c-request-hotkey__description']}
  //       >
  //         {` ${description}`}
  //       </Typography>
  //     </Grid>
  //   );
  // };
  // components.CaptureShortcut = CaptureShortcut;

  return { api, components };
};

// const CreateNewHotkeyComponent = ({
//   CompletableTextField,
//   inputRef,
//   hotkeys,
//   onHotkeyAdded,
//   isHotkeyValid,
//   value,
//   ...other
// }) => {
//   const { classes } = useContext(ThemeContext);

//   const [pendingLabel, setPendingLabel] = useState();
//   const [captureShortcut, setCaptureShortcut] = useState(false);
//   const clipfics = useClipficsContext();

//   const requestHotkeyFor = (label) => {
//     if (!isHotkeyValid(label)) {
//       clipfics.api.terminal.log('invalid hotkey', label);
//       return;
//     }

//     setPendingLabel(label);
//     setCaptureShortcut(true);
//   };

//   useEffect(() => {
//     inputRef.requestHotkeyFor = requestHotkeyFor;
//   });

//   const onShortcutCaptured = (shortcut, label) => {
//     setCaptureShortcut(false);
//     onHotkeyAdded(shortcut, label);
//   };

//   return (
//     <div>
//       <CompletableTextField
//         value={value}
//         label="Add hotkey"
//         className={`${classes['c-controls--fill-width']} ${classes['c-controls__textfield']}`}
//         onComplete={requestHotkeyFor}
//       />
//       <Modal open={captureShortcut}>
//         <div>
//           <CaptureShortcut
//             hotkeys={hotkeys}
//             description={pendingLabel}
//             onCapture={onShortcutCaptured}
//           />
//           }
//         </div>
//       </Modal>
//     </div>
//   );
// };
// components.CreateNewHotkeyComponent = CreateNewHotkeyComponent;

// export const useCreateNewHotkey = (isHotkeyValid) => {
//   const { CompletableTextField, getValue, setValue } = useCompletableTextField();
//   const inputRef = useRef({});
//   const clipfics = useClipficsContext();

//   const requestHotkey = () => {
//     const action = getValue();
//     if (!isHotkeyValid(action)) {
//       clipfics.api.terminal.log('invalid hotkey:', action);
//       return;
//     }

//     inputRef.current.requestHotkeyFor(getValue());
//   };

//   return {
//     CreateNewHotkey: (props) => (
//       <CreateNewHotkeyComponent
//         CompletableTextField={CompletableTextField}
//         inputRef={inputRef.current}
//         {...props}
//       />
//     ),
//     getValue,
//     setValue,
//     requestHotkey,
//   };
// };
