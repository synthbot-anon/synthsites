import React, { useState, useContext } from 'react';

import { Box, Tab, Tabs, Toolbar, Typography } from '@material-ui/core';

import { ThemeContext } from '../theme.js';
import { ClipficsLabelsPanel } from './LabelsPanel.js';



/**
 * Stub class for displaying a tab panel. This is used for the Labels, Shortcuts,
 * and Search panels.
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <Typography component="div" hidden={value !== index} {...other}>
    <Box p={3}>{children}</Box>
  </Typography>
);

/**
 * Panel used to display control options. This panel contains three tabs:
 *   * Labels -
 *   * Shortcuts -
 *   * Search -
 */
export default () => {
  const { classes } = useContext(ThemeContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const onTabSelected = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <div>
      <Toolbar>
        <Tabs value={selectedTab} onChange={onTabSelected}>
          <Tab label="Labels" />
          <Tab label="Files" />
        </Tabs>
      </Toolbar>
      <TabPanel className={classes.controlTab} value={selectedTab} index={0}>
        <ClipficsLabelsPanel />
      </TabPanel>
      <TabPanel className={classes.controlTab} value={selectedTab} index={1}>
      </TabPanel>
    </div>
  );
};
