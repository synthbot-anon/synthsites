import React, { useContext, useState, useRef, useEffect } from 'react';
import { Modal } from '@material-ui/core';
import { ThemeContext } from 'theme.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { Button, Divider } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import useForceUpdate from 'common/useForceUpdate.js';

const filter = createFilterOptions();

export default () => {
  const { api, components, internal } = synthComponent();

  internal.options = [];
  internal.resolveModal = null;
  internal.rejectModal = null;
  internal.displaySubscription = synthSubscription();

  api.completionSubscription = synthSubscription();

  // capture hotkeys when this is shown
  // display list of options & hotkeys

  api.requestSelection = (description, autocompleteOptions) => {
    return new Promise((resolve, reject) => {
      if (!autocompleteOptions.options) {
        reject();
        return;
      }

      internal.description = description;
      internal.autocompleteOptions = autocompleteOptions;
      internal.options = autocompleteOptions.options;
      internal.resolveModal = resolve;
      internal.rejectModal = reject;

      internal.displaySubscription.broadcast(true);
    });
  };

  api.cancelSelection = () => {
    if (!internal.rejectModal) {
      return;
    }

    internal.rejectModal();
    internal.rejectModal = null;
    internal.resolveModal = null;

    api.completionSubscription.broadcast();
  };

  api.setSelection = (selection) => {
    if (!internal.resolveModal) {
      return;
    }

    internal.resolveModal(selection);
    internal.resolveModal = null;
    internal.rejectModal = null;

    // internal.displaySubscription.broadcast(false);
    api.completionSubscription.broadcast();
    internal.autocompleteOptions.bump(selection);
  };

  const Display = () => {
    const { classes } = useContext(ThemeContext);
    const { forceUpdate } = useForceUpdate();
    internal.displaySubscription.useSubscription(forceUpdate);

    useEffect(() => {
      const hotkeyListener = (e) => {
        if (e.key === 'Escape') {
          api.cancelSelection();
        }
      };

      document.addEventListener('keydown', hotkeyListener);
      return () => document.removeEventListener('keydown', hotkeyListener);
    });

    return (
      <React.Fragment>
        <p>{internal.description}</p>
        <Divider />
        <Autocomplete
          options={internal.options}
          autoHighlight
          openOnFocus
          autoComplete
          freeSolo
          getOptionLabel={(option) => {
            if (typeof option !== 'string') {
              option = option.inputValue;
            }
            return option;
          }}
          renderOption={(option) => {
            if (typeof option !== 'string') {
              return (
                <div>
                  <b>{`+Add ${option.inputValue}`}</b>
                </div>
              );
            }

            return <div>{option}</div>;
          }}
          renderInput={(params) => {
            console.log(params);
            params.inputProps.className = `${params.inputProps.className} ${classes['c-autocomplete__input']}`;
            return (
              <TextField
                autoFocus
                label="Search for a value"
                variant="outlined"
                {...params}
              />
            );
          }}
          onChange={(e, newValue) => {
            if (typeof newValue !== 'string') {
              newValue = newValue.inputValue;
            }
            api.setSelection(newValue);
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            if (params.inputValue !== '') {
              filtered.push({
                inputValue: params.inputValue,
              });
            }
            return filtered;
          }}
        />
      </React.Fragment>
    );
  };
  components.Display = Display;

  return { api, components };
};

export class AutocompleteOptions {
  options = [];

  addOption(option) {
    this.options.push(option);
    return this;
  }

  removeOption(option) {
    this.options = this.options.filter((x) => x !== option);
  }

  restrictOptions(allowedOptions) {
    const newOptions = [];

    for (let opt of this.options) {
      if (allowedOptions.has(opt)) {
        newOptions.push(opt);
      }
    }

    this.options = newOptions;
  }

  bump(option) {
    this.options = [option, ...this.options.filter((x) => x !== option)];
  }
}
