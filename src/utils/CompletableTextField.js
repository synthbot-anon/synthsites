import React, { useState } from 'react';
import { TextField } from '@material-ui/core';

export default ({ onComplete, ...other }) => {
  const [text, setText] = useState('');

  const onSubmitted = (e) => {
    e.preventDefault();
    onComplete(text);
    setText('');
  };

  return (
    <form onSubmit={onSubmitted}>
      <TextField {...other} value={text} onChange={(e) => setText(e.target.value)} />
    </form>
  );
};
