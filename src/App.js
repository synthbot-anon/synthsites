/**
 * Main entry point for the frontend.
 */

import React, { useState, useEffect, createRef } from 'react';
import {
  AppBar,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import RangeUtils from './utils/RangeUtils.js';
import StateMachine from './utils/StateMachine.js';
import { useStyles, theme } from './theme.js';

// Keep track of the current key combo for hotkey sequences.
const hotkeyNavigator = new StateMachine();

// Highlights a Range object. The Range object MUST NOT span over multiple DOM nodes.
const highlightRange = (range) => {
  const newNode = document.createElement('div');
  newNode.setAttribute('style', 'background-color: yellow; display: inline;');
  range.surroundContents(newNode);
};

// Highlights the current selection, even over multiple DOM elements.
const highlightSelection = () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    return;
  }

  const selectionRange = selection.getRangeAt(0);
  const utils = new RangeUtils(selectionRange);
  utils.apply(highlightRange);
};

/**
 * React effect to highlight text by hotkey.
 * @param navigator StateMachine with which to register this hotkey
 * @param containerRef React ref for where a selection is valid
 */
const useHotkeyHighlighter = (navigator, containerRef) => {
  // Highlight selection only if it falls within the container
  const highlightWithinElement = () => {
    const selection = window.getSelection();

    // Make sure there's a selection within the container
    if (!selection.rangeCount) {
      return;
    }

    const selectionRange = selection.getRangeAt(0);
    const startNode = selectionRange.startContainer;
    const endNode = selectionRange.endContainer;

    if (!containerRef.current.contains(startNode)) {
      return;
    }

    if (!containerRef.current.contains(endNode)) {
      return;
    }

    // Highlight the selection
    const utils = new RangeUtils(selectionRange);
    utils.apply(highlightRange);
  };

  
  useEffect(() => {
    // Register highlighter with the hotkey navigator  
    const transition = navigator.registerTransition(
      navigator.start, // starting state
      'h', // key trigger to transition states
      navigator.start, // ending state (loop back)
      highlightWithinElement, // callback on transition
    );

    // Unregister on unmount
    return () => {
      navigator.unregisterTransition(transition);
    };
  });
};

// Panel used to display an HTML story.
const StorySheet = ({ classes, ...other }) => (
  <Paper className={classes['c-story-panel__paper']} {...other} />
);

// Wrap an element to make it highlightable by hotkey
const Highlightable = (props) => {
  const containerRef = createRef();
  useHotkeyHighlighter(hotkeyNavigator, containerRef);
  return <div ref={containerRef} {...props} />;
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

// Mock of what the Labels tab will look like.
const LabelsPanel = () => {
  return (
    <Grid container>
      <Grid item xs={6}>
        <Typography>
          [ d ] dialogue <br />
          ├── character <br />
          ├──── ? <br />
          └── next quote
          <br />
          <br />
          [ i ] dialogue <br />
          ├── style <br />
          ├──── internal monologue <br />
          ├── character <br />
          ├──── ? <br />
          └── next quote or italicized
          <br />
          <br />
          [ t ] dialogue <br />
          ├── character <br />
          ├──── Twilight Sparkle <br />
          └── next quote
          <br />
          <br />
          [ n ] emotion <br />
          ├──── neutral <br />
          └── next sentence
          <br />
          <br />
          [ ↵ ] ? <br />
          ├── ... <br />
          <br />
          [ q ] next quote <br />
        </Typography>
      </Grid>
    </Grid>
  );
};

/**
 * Panel used to display control options. This panel contains three tabs:
 *   * Labels -
 *   * Shortcuts -
 *   * Search -
 */
const ControlPanel = ({ classes }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const onTabSelected = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <div>
      <Toolbar>
        <Tabs value={selectedTab} onChange={onTabSelected}>
          <Tab label="Labels" />
          <Tab label="Shortcuts" />
          <Tab label="Search" />
        </Tabs>
      </Toolbar>
      <TabPanel className={classes.controlTab} value={selectedTab} index={0}>
        <LabelsPanel />
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
 * Button to load a story file into the StorySheet.
 */
const createFileImportButton = (setFileContents) => {
  const handleFileSelected = (event) => {
    const reader = new FileReader();
    reader.onload = (e) => setFileContents(e.target.result);
    reader.readAsText(event.target.files[0]);
  };

  return ({ classes }) => (
    <span>
      <input
        id="c-raised-button-file"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
      <label htmlFor="c-raised-button-file">
        <Button
          variant="contained"
          component="span"
          className={classes['c-fileio-import-button']}
        >
          Load story
        </Button>
      </label>
    </span>
  );
};

/**
 * Button to export a labeled story file, which is not what it does at the moment.
 * This currently highlights the selected text. Note that this will highlight ANY
 * text selected on the page, not just story text.
 */
const FileExport = ({ classes }) => {
  return (
    <Button
      className={classes['c-fileio-export-button']}
      onClick={highlightSelection}
    >
      Export labels
    </Button>
  );
};

// React effect to use hotkeys on a page
const useNavigator = (navigator) => {
  const keyPressListener = (e) => {
    navigator.transition(e.key);
  };

  useEffect(() => {
    document.addEventListener('keypress', keyPressListener);
    return () => {
      document.removeEventListener('keypress', keyPressListener);
    };
  });
};

/**
 * Main app.
 */
const App = () => {
  const classes = useStyles(theme);

  const [storyContents, setStoryContents] = useState('Select a story');
  const FileImportButton = createFileImportButton(setStoryContents);
  useNavigator(hotkeyNavigator);

  return (
    <div id="app" className={classes['c-app--full-height']}>
      <NavigationBar classes={classes} />
      <Grid container spacing={2}>
        <Grid item xs={7} className={classes['c-story-panel--full-height']}>
          <Highlightable className={classes['c-story-panel__container']}>
            <StorySheet
              id="js-story-sheet"
              classes={classes}
              dangerouslySetInnerHTML={{ __html: storyContents }}
            />
          </Highlightable>
        </Grid>
        <Grid item xs={5} className={classes['c-control-panel']}>
          <ControlPanel classes={classes} />
          <Grid container>
            <FileImportButton classes={classes} />
            <FileExport classes={classes} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default App;
