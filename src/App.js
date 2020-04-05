/**
 * Main entry point for the frontend.
 */

import React, { useState, createRef, useContext } from 'react';

import {
  AppBar,
  Button,
  Grid,
  IconButton,
  Paper,
  Toolbar,
  Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

import { ThemeContext, useStyles, theme } from './theme.js';
import { ClipficsContext } from './tasks.js';
import Hotkeys from 'common/Hotkeys.js';
import Terminal from 'common/Terminal.js';
import ContainerSelection from 'common/ContainerSelection.js';
import FileImportButton from 'common/FileImportButton.js';
import ClipficsControlPanel from 'clipfics/ClipficsControlPanel.js';
import CookieSynthPaper from 'clipfics/cookiesynth/CookieSynthPaper.js';
import HtmlNavigator from 'common/HtmlNavigator.js';
import useInitializer from 'common/useInitializer.js';

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
const CookieSynthExport = () => {
  const { classes } = useContext(ThemeContext);

  const download = () => {
    const storyData = document.getElementById('js-story-sheet').innerHTML;
    const storyBlob = new Blob([storyData], {
      'type': 'text/html'
    });

    const a = document.createElement('a');
    a.setAttribute('href', window.URL.createObjectURL(storyBlob));
    a.download = "cookiesynth - story.html";
    a.click();

  };
  return <Button className={classes['c-fileio-export-button']} onClick={download}>Export labels</Button>;
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

  let [taskContext, setTaskContext] = useState();

  const storyContainerRef = createRef();

  useInitializer(() => {
    taskContext = {};
    taskContext.hotkeys = new Hotkeys();
    taskContext.storyContainerRef = storyContainerRef;
    taskContext.selection = new ContainerSelection(storyContainerRef);
    taskContext.terminal = new Terminal();
    taskContext.storyNavigator = new HtmlNavigator(storyContainerRef);

    taskContext.terminal.log("hello, anonymous.");
    taskContext.terminal.log("do you need help using this interface?");

    setTaskContext(taskContext);
  });

  taskContext.hotkeys.useHotkeyListener();
  const TerminalDisplay = taskContext.terminal.Component;

  return (
    <ThemeContext.Provider value={themeContext}>
      <div id="app" className={classes['c-app--full-height']}>
        <NavigationBar />
        <ClipficsContext.Provider value={taskContext}>
          <Grid container spacing={2}>
            <Grid item xs={7} className={classes['c-story-panel--full-height']}>
              <div
                ref={taskContext.storyContainerRef}
                className={classes['c-story-panel__container']}
              >
                <CookieSynthPaper
                  id="js-story-sheet"
                  className={classes['c-story-panel__paper']}
                >
                  {storyContents}
                </CookieSynthPaper>
              </div>
            </Grid>
            <Grid item xs={5} className={classes['c-control-panel']}>
              <ClipficsControlPanel />
              <Grid container>
                <FileImportButton onFileLoaded={(contents) => {
                  taskContext.terminal.log('loading fic');
                  setStoryContents(contents);
                }} />
                <CookieSynthExport />
              </Grid>
            </Grid>
          </Grid>
        </ClipficsContext.Provider>
        <Paper>
          <TerminalDisplay />
        </Paper>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
