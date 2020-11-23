import React, { useContext, useState, useEffect } from 'react';
import { Modal } from '@material-ui/core';
import { ThemeContext } from 'theme.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { Button, Divider } from '@material-ui/core';
import useForceUpdate from 'common/useForceUpdate.js';

export default (hotkeyListener) => {
  const { api, components, internal } = synthComponent();

  internal.fixedOptions = null;
  internal.options = [];
  internal.resolveModal = null;
  internal.rejectModal = null;
  internal.displaySubscription = synthSubscription();
  api.completionSubscription = synthSubscription();
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

      internal.hotkeyListener.registerHotkey(internal.hotkeySet, 'Enter', () => {
        if (internal.fixedOptions.lastSelection) {
          api.setSelection(internal.fixedOptions.lastSelection);
        }
      });

      internal.displaySubscription.broadcast();
    });
  };

  api.cancelSelection = () => {
    if (!internal.rejectModal) {
      return;
    }

    internal.hotkeyListener.deleteHotkeySet(internal.hotkeySet);
    internal.hotkeyListener.useHotkeySet(internal.previousHotkeySet);

    internal.rejectModal();
    internal.rejectModal = null;
    internal.resolveModal = null;

    api.completionSubscription.broadcast();
  };

  api.setSelection = (option) => {
    if (!internal.resolveModal) {
      return;
    }

    internal.hotkeyListener.deleteHotkeySet(internal.hotkeySet);
    internal.hotkeyListener.useHotkeySet(internal.previousHotkeySet);

    internal.fixedOptions.setLastSelection(option);
    internal.resolveModal(option.value);
    internal.rejectModal = null;
    internal.resolveModal = null;

    api.completionSubscription.broadcast();
  };

  const Display = () => {
    const { forceUpdate } = useForceUpdate();
    const { classes } = useContext(ThemeContext);

    internal.displaySubscription.useSubscription(forceUpdate);

    let key = 0;
    return (
      <React.Fragment>
        <p>{internal.description}</p>
        {Array.from(internal.options).map((option) => (
          <div key={key++}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              onClick={() => api.setSelection(option)}
            >
              {`${option.shortcut} | ${option.description}`}
            </Button>
          </div>
        ))}
      </React.Fragment>
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
