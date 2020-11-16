/**
 * Main entry point for the frontend.
 */

import React, { useState, useEffect, useContext } from 'react';

import {
  AppBar,
  Button,
  Grid,
  IconButton,
  Toolbar,
  Typography,
  Box,
  Tab,
  Tabs,
  TextField,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

import { ThemeContext, useStyles, theme } from './theme.js';
import { ClipficsContext } from './tasks.js';
import Terminal from 'common/Terminal.js';
import useClipficsTask from 'tasks/useClipficsTask.js';
import useForceUpdateControl from 'common/useForceUpdateControl.js';
import useResourceManager from 'resources/useResourceManager.js';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import useCompletableTextField from 'common/useCompletableTextField.js';
import useSelectionModal from 'common/useSelectionModal.js';

/**
 * Navigation bar at the top of the site. This doesn't serve any functional purpose at
 * the moment.
 */
const NavigationBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6">Clipfics</Typography>
      </Toolbar>
    </AppBar>
  );
};

/**
 * Stub class for displaying a tab panel. This is used for the Labels, Shortcuts,
 * and Search panels.
 */
const TabPanel = ({ children, size, value, index, ...other }) => (
  <Typography component="div" hidden={value !== index} {...other}>
    <Box p={size}>{children}</Box>
  </Typography>
);

const useTabs = () => {
  const { api, components, internal } = synthComponent();

  internal.tabLabels = [];
  internal.tabPanels = [];
  internal.subscription = synthSubscription();

  const addTab = (label, panel) => {
    internal.tabLabels.push(label);
    internal.tabPanels.push(panel);
    internal.subscription.broadcast();
  };

  const TabBar = (props) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const { forceUpdate } = useForceUpdateControl();

    internal.subscription.useSubscription(forceUpdate);

    const onTabSelected = (event, newValue) => {
      setSelectedTab(newValue);
    };

    return (
      <div>
        <Toolbar>
          <Tabs variant="scrollable" value={selectedTab} onChange={onTabSelected}>
            {internal.tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Toolbar>

        {internal.tabPanels.map((Panel, index) => (
          <TabPanel
            key={index}
            size={internal.tabPanels.length}
            value={selectedTab}
            index={index}
          >
            <Panel />
          </TabPanel>
        ))}
      </div>
    );
  };

  return { TabBar, addTab };
};


/**
 * Main app.
 */
const App = () => {
  console.log('reloading app');
  const themeContext = {
    classes: useStyles(theme),
  };
  const classes = themeContext.classes;

  const terminal = new Terminal();
  const { TabBar, addTab } = useTabs();

  const TerminalDisplay = terminal.Component;
  const {
    download,
    ResourcePane,
    resourceManager,
    tabs: resourceManagerTabs,
  } = useResourceManager(terminal);

  useEffect(() => {
    const exportLabels = (e) => {
      if (e.key === "s" && e.ctrlKey) {
        download();
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", exportLabels);
    return () => {
      document.removeEventListener("keydown", exportLabels);
    }
  });

  const clipfics = useClipficsTask(resourceManager, terminal);
  const clipficsTabs = clipfics.tabs;

  for (let { label, panel } of clipficsTabs) {
    addTab(label, panel);
  }

  for (let { label, panel } of resourceManagerTabs) {
    addTab(label, panel);
  }

  return (
    <ThemeContext.Provider value={themeContext}>
      <div id="app" className={classes['c-app--full-height']}>
        <NavigationBar />
        <ClipficsContext.Provider value={clipfics}>
          <Grid container spacing={2}>
            <Grid item xs={7} className={classes['c-story-panel--full-height']}>
              <ResourcePane />
            </Grid>
            <Grid item xs={5} className={classes['c-control-panel']}>
              <TabBar />
            </Grid>
          </Grid>
        </ClipficsContext.Provider>
        <TerminalDisplay />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
