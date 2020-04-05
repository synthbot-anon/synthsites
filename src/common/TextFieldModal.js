import React, { useContext } from 'react';
import { Modal } from '@material-ui/core';
import useCompletableTextField from './useCompletableTextField.js';
import { ThemeContext } from 'theme.js';

export default ({ open, onClose, ...other }) => {
  const { classes } = useContext(ThemeContext);
  const { CompletableTextField } = useCompletableTextField();

  return (
    <div>
      <Modal open={open} onClose={onClose}>
        <div className={classes['c-labelmodal__container']}>
          <CompletableTextField
            autoFocus
            className={classes['c-labelmodal__textfield']}
            {...other}
          />
        </div>
      </Modal>
    </div>
  );
};
