import React, { useState, useEffect } from 'react';
import { TextField } from '@material-ui/core';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import useForceUpdateControl from 'common/useForceUpdateControl.js';

export default () => {
  const { api, components, internal } = synthComponent();
  internal.value = '';

  api.getValue = () => {
    return internal.value;
  };

  api.setValue = (value) => {
    internal.value = value;
  };

  const CompletableTextField = ({ onComplete, value, ...other }) => {
    const [displayValue, setDisplayValue] = useState(value || '');

    const onSubmitted = (e) => {
      e.preventDefault();
      internal.value = displayValue;
      onComplete(displayValue);
    };

    return (
      <form onSubmit={onSubmitted}>
        <TextField
          {...other}
          value={displayValue}
          onChange={(e) => {
            internal.value = e.target.value;
            setDisplayValue(e.target.value);
          }}
        />
      </form>
    );
  };
  components.CompletableTextField = CompletableTextField;

  return {
    api,
    components,
  };
};
