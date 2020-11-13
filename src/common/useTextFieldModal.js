import React, { useContext } from 'react';
import { Modal } from '@material-ui/core';
import useCompletableTextField from './useCompletableTextField.js';
import { ThemeContext } from 'theme.js';
import synthComponent from 'common/synthComponent.js';

export default () => {
  const { api, components } = synthComponent();
  const { classes } = useContext(ThemeContext);
  const textField = useCompletableTextField();

  api.setValue = textField.api.setValue;
  api.getValue = textField.api.getValue;

  const Display = ({ open, onClose, ...other }) => (
    <Modal open={open} onClose={onClose}>
      <div className={classes['c-labelmodal__container']}>
        <textField.components.CompletableTextField
          autoFocus
          className={classes['c-labelmodal__textfield']}
          {...other}
        />
      </div>
    </Modal>
  );
  components.Display = Display;

  return { api, components };
};
