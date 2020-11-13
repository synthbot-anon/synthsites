import React, { useContext, useState, useRef, useEffect } from 'react';
import { Modal } from '@material-ui/core';
import { ThemeContext } from 'theme.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { Button, Divider } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';

export default () => {
  const { api, components, internal } = synthComponent();

  internal.options = [];
  internal.resolveModal = null;
  internal.rejectModal = null;
  internal.modalSubscriptions = synthSubscription();

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

      internal.modalSubscriptions.broadcast(true);
    });
  };

  api.cancelSelection = () => {
    if (!internal.options) {
      return;
    }

    internal.options = [];
    internal.rejectModal();

    internal.modalSubscriptions.broadcast(false);
  };

  api.setSelection = (selection) => {
    if (!internal.options) {
      return;
    }

    internal.autocompleteOptions.bump(selection);
    internal.options = [];
    internal.resolveModal(selection);

    internal.modalSubscriptions.broadcast(false);
  };

  const Display = () => {
    const [open, setOpen] = useState(false);
    const { classes } = useContext(ThemeContext);
    const ref = useRef();

    internal.modalSubscriptions.useSubscription(setOpen);

    useEffect(() => {
      if (!open) {
        return;
      }

      const hotkeyListener = (e) => {
        if (!open) {
          return;
        }

        console.log(ref.current);

        if (e.key === 'Enter' && e.shiftKey) {
          api.setSelection(ref.current.value);
        } else if (e.key === 'Escape') {
          api.cancelSelection();
        }
      };

      document.addEventListener('keydown', hotkeyListener);
      return () => document.removeEventListener('keydown', hotkeyListener);
    }, [open]);

    return (
      <Modal open={open} onClose={api.cancelSelection}>
        <div className={classes['c-labelmodal__container']}>
          <p>{internal.description}</p>
          <Divider />
          <Autocomplete
            options={internal.options}
            autoHighlight
            openOnFocus
            autoComplete
            getOptionLabel={(option) => option}
            renderOption={(option) => {
              return <div>{option}</div>;
            }}
            renderInput={(params) => (
              <TextField {...params} inputRef={ref} autoFocus />
            )}
            onChange={(e, newValue) => api.setSelection(newValue)}
            noOptionsText="Hit Shift+Enter to use a custom value"
          />
        </div>
      </Modal>
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
