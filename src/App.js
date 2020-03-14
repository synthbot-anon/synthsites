/**
 * Main entry point for the frontend.
 */

import React, { useState, createRef, useContext } from 'react';
import {
  AppBar,
  Box,
  Button,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { ThemeContext, useStyles, theme } from './theme.js';
import { ClipficsContext } from './tasks.js';
import Hotkeys from './utils/Hotkeys.js';
import { ClipficsLabelsPanel } from './clipfics/LabelsPanel.js';
import RangeUtils from './utils/RangeUtils.js';
import HtmlPaper from './utils/HtmlPaper.js';
import ContainerSelection from './utils/ContainerSelection.js';
import FileImportButton from './utils/FileImportButton.js';

// Highlights a Range object. The Range object MUST NOT span over multiple DOM nodes.
const highlightSimpleRange = (label, range) => {
  const newNode = document.createElement('div');
  newNode.setAttribute('style', 'background-color: yellow; display: inline;');
  newNode.setAttribute('class', `${label} highlight`);
  range.surroundContents(newNode);
};

const addLabelToRange = (label, range) => {
  const utils = new RangeUtils(range);

  const startIndicator = document.createElement('span');
  startIndicator.setAttribute('class', `${label} start`);
  utils.prepend(startIndicator);

  const endIndicator = document.createElement('span');
  endIndicator.setAttribute('class', `${label} end`);
  utils.append(endIndicator);

  // Highlight the selection
  utils.apply((range) => highlightSimpleRange(label, range));
};

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
const ClipficsControlPanel = () => {
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
        <ClipficsLabelsPanel onLabel={addLabelToRange} />
      </TabPanel>
      <TabPanel className={classes.controlTab} value={selectedTab} index={1}>
        Item two
      </TabPanel>
      <TabPanel className={classes.controlTab} value={selectedTab} index={2}>
        Item three
      </TabPanel>
    </div>
  );
};

/**
 * Navigation bar at the top of the site. This doesn't serve any functiona purpose at
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
 * Button to export a labeled story file, which is not what it does at the moment.
 * This currently highlights the selected text. Note that this will highlight ANY
 * text selected on the page, not just story text.
 */
const FileExport = () => {
  const { classes } = useContext(ThemeContext);
  return <Button className={classes['c-fileio-export-button']}>Export labels</Button>;
};

/**
 * Main app.
 */
const App = () => {
  const [storyContents, setStoryContents] = useState('Load a story');

  const themeContext = {
    classes: useStyles(theme),
  };
  const classes = themeContext.classes;

  const taskContext = {};
  taskContext.hotkeys = new Hotkeys();
  taskContext.hotkeys.useHotkeys();
  taskContext.storyContainerRef = createRef();
  taskContext.selection = new ContainerSelection(taskContext.storyContainerRef);

  return (
    <ThemeContext.Provider value={themeContext}>
      <div id="app" className={classes['c-app--full-height']}>
        <NavigationBar />
        <Grid container spacing={2}>
          <Grid item xs={7} className={classes['c-story-panel--full-height']}>
            <div
              ref={taskContext.storyContainerRef}
              className={classes['c-story-panel__container']}
            >
              <HtmlPaper
                id="js-story-sheet"
                className={classes['c-story-panel__paper']}
              >
                {storyContents}
              </HtmlPaper>
            </div>
          </Grid>
          <Grid item xs={5} className={classes['c-control-panel']}>
            <ClipficsContext.Provider value={taskContext}>
              <ClipficsControlPanel />
            </ClipficsContext.Provider>
            <Grid container>
              <FileImportButton onFileLoaded={setStoryContents} />
              <FileExport />
            </Grid>
          </Grid>
        </Grid>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
