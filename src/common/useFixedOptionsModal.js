import React, { useContext, useState, useEffect } from 'react';
import { Modal } from '@material-ui/core';
import { ThemeContext } from 'theme.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { Button, Divider } from '@material-ui/core';

export default (hotkeyListener) => {
  const { api, components, internal } = synthComponent();

  internal.fixedOptions = null;
  internal.options = [];
  internal.resolveModal = null;
  internal.rejectModal = null;
  internal.modalSubscriptions = synthSubscription();
  internal.hotkeyListener = hotkeyListener;

  // capture hotkeys when this is shown
  // display list of options & hotkeys

  api.requestSelection = (description, fixedOptions) => {
    return new Promise((resolve, reject) => {
      if (!fixedOptions.options) {
        reject();
        return;
      }

      internal.description = description;
      internal.fixedOptions = fixedOptions;
      internal.options = fixedOptions.options;
      internal.resolveModal = resolve;
      internal.rejectModal = reject;

      internal.hotkeySet = new Object();
      internal.previousHotkeySet = internal.hotkeyListener.activeHotkeySet;
      internal.hotkeyListener.useHotkeySet(internal.hotkeySet);

      for (let option of fixedOptions.options) {
        internal.hotkeyListener.registerHotkey(
          internal.hotkeySet,
          option.shortcut,
          () => api.setSelection(option),
        );
      }

      internal.hotkeyListener.registerHotkey(
        internal.hotkeySet,
        'Enter',
        () => {
          if (internal.fixedOptions.lastSelection) {
            api.setSelection(internal.fixedOptions.lastSelection);
          }
        });

      internal.modalSubscriptions.broadcast(true);
    });
  };

  api.cancelSelection = () => {
    if (!internal.options) {
      return;
    }

    internal.options = [];
    internal.rejectModal();
    internal.hotkeyListener.deleteHotkeySet(internal.hotkeySet);
    internal.hotkeyListener.useHotkeySet(internal.previousHotkeySet);

    internal.modalSubscriptions.broadcast(false);
  };

  api.setSelection = (option) => {
    if (!internal.options) {
      return;
    }

    internal.fixedOptions.setLastSelection(option);
    internal.options = [];
    internal.resolveModal(option.value);
    internal.hotkeyListener.deleteHotkeySet(internal.hotkeySet);
    internal.hotkeyListener.useHotkeySet(internal.previousHotkeySet);

    internal.modalSubscriptions.broadcast(false);
  };

  const Display = () => {
    const [open, setOpen] = useState(false);
    const { classes } = useContext(ThemeContext);
    internal.modalSubscriptions.useSubscription(setOpen);

    let key = 0;

    return (
      <Modal open={open} onClose={api.cancelSelection}>
        <div className={classes['c-labelmodal__container']}>
          <p>{internal.description}</p>
          {Array.from(internal.options).map((option) => (
            <Button
              key={key++}
              variant="outlined"
              size="small"
              color="primary"
              onClick={() => api.setSelection(option)}
            >
              {`${option.shortcut} | ${option.description}`}
            </Button>
          ))}
        </div>
      </Modal>
    );
  };
  components.Display = Display;

  return { api, components };
};

export class FixedOptions {
  options = [];
  lastSelection;

  addOption(shortcut, value, description) {
    value = value || description;
    this.options.push({
      shortcut: shortcut,
      value: value,
      description: description || value,
    });

    return this;
  }

  setLastSelection(selection) {
    console.log('setting last value to', selection);
    this.lastSelection = selection;
  }
}
