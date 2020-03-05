import React from 'react';
import { Typography, AppBar, IconButton, Toolbar, Box, Tabs, Tab } from '@material-ui/core';

class PairedTabPanel {
  #tabIndex;

  constructor(tabIndex) {
    this.#tabIndex = tabIndex;
  }

  render({ children, ...other }) {
    return (visibleIndex) => (
      <Typography
        component="div"
        role="tabpanel"
        hidden={visibleIndex !== this.#tabIndex}
        id={`simple-tabpanel-${this.#tabIndex}`}
        aria-labelledby={`simple-tab-${this.#tabIndex}`}
        {...other}
      >
        <Box p={3}>
          {children}
        </Box>
      </Typography>
    );
  }
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

class PairedTab {
  #tabIndex;

  constructor(tabIndex) {
    this.#tabIndex = tabIndex;
  }

  render() {
    return (
      <Tab {...this.props} {...a11yProps(this.#tabIndex)} />
    )
  }
}

let nextTabIndex = 0;

export const generateTab = () => {
  const tabIndex = nextTabIndex++;

  const tab = new PairedTab(tabIndex);
  const panel = new PairedTabPanel(tabIndex);

  return [tab, panel];
};