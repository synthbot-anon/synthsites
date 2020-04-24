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
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

import { ThemeContext, useStyles, theme } from './theme.js';
import { ClipficsContext } from './tasks.js';
import Terminal from 'common/Terminal.js';
import useClipficsTask from 'tasks/useClipficsTask.js';
import useForceUpdate from 'common/useForceUpdate.js';
import useResourceManager from 'resources/useResourceManager.js';

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
  const [context] = useState(() => {
    return {
      tabLabels: [],
      tabPanels: [],
    };
  });

  const addTab = (label, panel) => {
    context.tabLabels.push(label);
    context.tabPanels.push(panel);

    if (context.updateTabDisplay) {
      context.updateTabDisplay();
    }
  };

  const TabBar = (props) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const { forceUpdate } = useForceUpdate();

    useEffect(() => {
      context.updateTabDisplay = forceUpdate;
      return () => {
        context.updateTabDisplay = null;
      };
    });

    const onTabSelected = (event, newValue) => {
      setSelectedTab(newValue);
    };

    return (
      <div>
        <Toolbar>
          <Tabs variant="scrollable" value={selectedTab} onChange={onTabSelected}>
            {context.tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Toolbar>

        {context.tabPanels.map((Panel, index) => (
          <TabPanel
            key={index}
            size={context.tabPanels.length}
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

  terminal.log('hello, anonymous.');
  terminal.log('do you need help using this interface?');

  const TerminalDisplay = terminal.Component;
  const { ResourcePane, resourceManager, tabs: resourceManagerTabs } = useResourceManager(terminal);
  
  const {
    taskContext,
    tabs: clipficsTabs,
  } = useClipficsTask(resourceManager, terminal);
  

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
        <ClipficsContext.Provider value={taskContext}>
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
