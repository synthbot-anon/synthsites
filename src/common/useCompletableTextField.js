import React, { useState, useEffect } from 'react';
import { TextField } from '@material-ui/core';

const CompletableTextFieldComponent = ({ inputRef, onComplete, value, ...other }) => {
  const normalizedValue = value || '';
  const [displayValue, setDisplayValue] = useState(normalizedValue);

  useEffect(() => {
    inputRef.setDisplayValue = setDisplayValue;

    return () => {
      inputRef.setDisplayValue = null;
    };
  }, [inputRef]);

  useEffect(() => {
    setDisplayValue(normalizedValue);
  }, [normalizedValue]);

  const onSubmitted = (e) => {
    e.preventDefault();
    if (displayValue === '') {
      return;
    }

    onComplete(displayValue);
    setDisplayValue('');
  };

  return (
    <form onSubmit={onSubmitted}>
      <TextField
        inputRef={(input) => {
          inputRef.current = input;
        }}
        {...other}
        value={displayValue}
        onChange={(e) => setDisplayValue(e.target.value)}
      />
    </form>
  );
};

export default () => {
  const [inputRef] = useState({});

  const getValue = () => {
    return inputRef.current && inputRef.current.value;
  };

  const setValue = (value) => {
    inputRef.setDisplayValue(value);
  };

  return {
    CompletableTextField: (props) => (
      <CompletableTextFieldComponent inputRef={inputRef} {...props} />
    ),
    getValue,
    setValue,
  };
};
