import React, { useContext } from 'react';
import { Grid } from '@material-ui/core';
import useClipkeys from './useClipkeys.js';
import { ThemeContext } from 'theme.js';
import { SortedTreeMap } from './useMetaDisplay.js';

export const ClipficsLabelsPanel = (props) => {
  const { classes } = useContext(ThemeContext);
  const { HotkeyDisplay, HotkeyModals, CreateHotkey } = useClipkeys();

  return (
    <Grid container {...props}>
      <Grid item className={classes['c-controls--fill-width']}>
        <HotkeyDisplay />
        <HotkeyModals />
        <CreateHotkey />
      </Grid>
    </Grid>
  );
};
