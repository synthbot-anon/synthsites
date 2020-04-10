import React, { useContext, useEffect, useState, createRef } from 'react';
import { Button, Link, Paper, Typography } from '@material-ui/core';

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
      <TerminalLine key={this.nextId++}>>{text}</TerminalLine>,
    ];
    this.#onUpdateCallbacks.forEach((updateDisplay) => updateDisplay(this.history));
  }

  append(element) {
    const key = (this.nextId++).toString();
    this.history = [...this.history, <div key={key}>>{element}</div>];
    this.#onUpdateCallbacks.forEach((updateDisplay) => updateDisplay(this.history));
    return key;
  }

  update(key, newElement) {
    const newKey = (this.nextId++).toString();
    this.history = this.history.map((x) => {
      if (x['key'] === key) {
        return <div key={newKey}>>{newElement}</div>;
      } else {
        return x;
      }
    });

    this.#onUpdateCallbacks.forEach((updateDisplay) => updateDisplay(this.history));
    return newKey;
  }

  registerOnUpdate(callback) {
    this.#onUpdateCallbacks.push(callback);
  }

  unregisterOnUpdate(callback) {
    this.#onUpdateCallbacks = this.#onUpdateCallbacks.filter((x) => x !== callback);
  }
}

export const TerminalType = ({ onClick, children, ...other }) => {
  const { classes } = useContext(ThemeContext);
  let Child;

  if (onClick) {
    Child = () => (
      <Link color="inherit" href="#" onClick={onClick}>
        {children}
      </Link>
    );
  } else {
    Child = () => <TerminalSpan>{children}</TerminalSpan>;
  }

  return (
    <Typography
      display="inline"
      className={classes['c-terminal__history']}
      {...other}
    >
      <Child />
    </Typography>
  );
};

const TerminalLine = (props) => {
  const { classes } = useContext(ThemeContext);
  return <Typography className={classes['c-terminal__history']} {...props} />;
};

export const TerminalButton = (props) => {
  const { classes } = useContext(ThemeContext);
  return (
    <Button
      variant="outlined"
      size="small"
      color="primary"
      className={classes['c-terminal__button']}
      {...props}
    />
  );
};

export const TerminalSpan = (props) => {
  const { classes } = useContext(ThemeContext);
  return <span className={classes['c-terminal__history']} {...props} />;
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
    <Paper ref={historyRef} component="div" className={classes['c-terminal']}>
      <div children={history} />
    </Paper>
  );
};
