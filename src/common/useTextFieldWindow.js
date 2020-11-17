import React, { useContext, useState, useRef, useEffect } from 'react';
import { Modal } from '@material-ui/core';
import { ThemeContext } from 'theme.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { Button, Divider } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import useForceUpdate from 'common/useForceUpdate.js';
import useCompletableTextField from 'common/useCompletableTextField.js';

export default () => {
  const { api, components, internal } = synthComponent();

  internal.resolveModal = null;
  internal.rejectModal = null;
  internal.displaySubscription = synthSubscription();
  internal.textField = useCompletableTextField();

  api.completionSubscription = synthSubscription();

  api.requestSelection = (description) => {
    return new Promise((resolve, reject) => {
      internal.description = description;
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
  };

  const Display = () => {
    const { classes } = useContext(ThemeContext);
    const ref = useRef();
    
    const { forceUpdate } = useForceUpdate();
    internal.displaySubscription.useSubscription(forceUpdate);

    return (
      <React.Fragment>
        <p>{internal.description}</p>
        <internal.textField.components.CompletableTextField
          autoFocus
          className={classes['c-labelmodal__textfield']}
          onComplete={api.setSelection}
        />
      </React.Fragment>
    );
  };
  components.Display = Display;

  return { api, components };
};
