import React from 'react';
import { TextField } from '@material-ui/core';

const InputComponent = ({ inputRef, children }) => <div children={children} />;

export default ({ title, children, className }) => {
  return (
    <TextField
      className={className}
      variant="outlined"
      multiline
      label={title}
      InputLabelProps={{ shrink: true }}
      InputProps={{ inputComponent: InputComponent }}
      inputProps={{ children: children }}
    />
  );
};
