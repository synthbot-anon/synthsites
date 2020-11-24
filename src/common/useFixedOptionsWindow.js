import React, { useContext, useState, useEffect } from 'react';
import { Modal } from '@material-ui/core';
import { ThemeContext } from 'theme.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { Button, Divider, Typography } from '@material-ui/core';
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

  api.requestSelection = (description, context, fixedOptions) => {
    return new Promise((resolve, reject) => {
      if (!fixedOptions.options) {
        reject();
        return;
      }

      internal.context = context;
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

    const titleClassName = classes['c-label-modal__title'];

    let key = 0;
    return (
      <React.Fragment>
        {internal.context && (
          <React.Fragment>
            <Typography variable="h3" className={titleClassName} >
              {internal.context}
            </Typography>
            <Divider />
          </React.Fragment>
        )}
        <p>{internal.description || internal.fixedOptions.description}</p>
        {Array.from(internal.options).map((option) => {
          let isPreviousSelection = false;
          if (internal.fixedOptions.lastSelection) {
            isPreviousSelection =
              internal.fixedOptions.lastSelection.value === option.value;
          }

          return (
            <div key={key++} >
              <Button
                variant={isPreviousSelection ? 'contained' : 'outlined'}
                size="small"
                onClick={() => api.setSelection(option)}
              >
                {`${option.shortcut} | ${option.description}`}
              </Button>
            </div>
          );
        })}
      </React.Fragment>
    );
  };
  components.Display = Display;

  return { api, components };
};

export class FixedOptions {
  options = [];
  lastSelection;
  description;

  constructor(description) {
    this.description = description;
  }

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
