import React, { useContext, useEffect, useState, createRef } from 'react';
import { Box, Typography } from '@material-ui/core';

import { ThemeContext } from 'theme.js';

export default class Console {
  history = [];
  nextId = 0;
  Component;
  #onUpdateCallbacks = [];

  constructor() {
    this.Component = () => <TerminalDisplay terminal={this} />;
  }

  log(text, ...rest) {
    if (rest !== undefined) {
      text = `${text} ${rest.join(' ')}`;
    }

    this.history = [
      ...this.history,
      <HistoryItem key={this.nextId++}>>{text}</HistoryItem>,
    ];
    this.#onUpdateCallbacks.forEach((updateDisplay) => updateDisplay(this.history));
  }

  append(element) {
    this.history = [...this.history, <div key={this.nextId++}>{element}</div>];
    this.#onUpdateCallbacks.forEach((updateDisplay) => updateDisplay(this.history));
  }

  registerOnUpdate(callback) {
    this.#onUpdateCallbacks.push(callback);
  }

  unregisterOnUpdate(callback) {
    this.#onUpdateCallbacks = this.#onUpdateCallbacks.filter((x) => x !== callback);
  }
}

const HistoryItem = ({ children, ...other }) => {
  const { classes } = useContext(ThemeContext);
  return (
    <Typography className={classes['c-terminal__history']} {...other}>
      {children}
    </Typography>
  );
};

const TerminalDisplay = ({ terminal }) => {
  const { classes } = useContext(ThemeContext);
  const [history, setHistory] = useState([terminal.history]);
  const historyRef = createRef();

  useEffect(() => {
    const onUpdate = (history) => {
      setHistory(history);
    };

    terminal.registerOnUpdate(onUpdate);
    historyRef.current.scrollTop = historyRef.current.scrollHeight;

    return () => {
      terminal.unregisterOnUpdate(onUpdate);
    };
  });

  return (
    <Box ref={historyRef} component="div" className={classes['c-terminal']}>
      <div children={history} />
    </Box>
  );
};
