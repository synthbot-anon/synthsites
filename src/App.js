/**
 * Main entry point for the frontend.
 */

import React, { useState, useEffect, createRef, createContext, useContext } from 'react';
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
import { useStyles, theme } from './theme.js';

const hotkeys = {};

const LabelTargetContext = createContext();


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
const HotkeyHighlighter = (props) => {
  const containerRef = useContext(LabelTargetContext);

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

  
  return (
    <Hotkey shortcut="h" action={highlightWithinElement} description='h 🠖 [dialogue character="Twilight Sparkle"]' />
  );
};

// Panel used to display an HTML story.
const StorySheet = (props) => (
  <Paper {...props} />
);

/**
 * Stub class for displaying a tab panel. This is used for the Labels, Shortcuts,
 * and Search panels.
 */
const TabPanel = ({ children, value, index, ...other }) => (
  <Typography component="div" hidden={value !== index} {...other}>
    <Box p={3}>{children}</Box>
  </Typography>
);

const Hotkey = ({ shortcut, action, description, ...other }) => {
  useEffect(() => {
    let previousActions = hotkeys[shortcut];
    if (!previousActions) {
      previousActions = [];
      hotkeys[shortcut] = previousActions;
    }

    previousActions.push(action);

    return () => {
      hotkeys[shortcut] = hotkeys[shortcut].filter((x) => x !== action);
    }
  });

  return (
    <Paper {...other}>
      {description}
    </Paper>
  );
};

const CreateNewHotkey = (props) => {
  return (
    <Paper {...props} onClick={() => console.log("hello world")}>
      + Add hotkey
    </Paper>
  );
}

// Mock of what the Labels tab will look like.
const LabelsPanel = ({ containerRef, ...other }) => {
  return (
    <Grid container {...other}>
      <Grid item>
        <HotkeyHighlighter containerRef={containerRef} />
        <CreateNewHotkey />
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
const useHotkeys = (hotkeys) => {
  const keyPressListener = (e) => {
    const actions = hotkeys[e.key] || [];
    actions.forEach((f) => f());
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
  const labelTargetRef = createRef();
  useHotkeys(hotkeys);

  // TODO: sanitize html before displaying it

  return (
    <div id="app" className={classes['c-app--full-height']}>
      <NavigationBar classes={classes} />
      <LabelTargetContext.Provider value={labelTargetRef}>
        <Grid container spacing={2}>
          <Grid item xs={7} className={classes['c-story-panel--full-height']}>
            <div ref={labelTargetRef} className={classes["c-story-panel__container"]}>
              <StorySheet
                id="js-story-sheet"
                className={classes["c-story-panel__paper"]}
                dangerouslySetInnerHTML={{ __html: storyContents }}
              />
            </div>
          </Grid>
          <Grid item xs={5} className={classes['c-control-panel']}>
            <ControlPanel classes={classes} />
            <Grid container>
              <FileImportButton classes={classes} />
              <FileExport classes={classes} />
            </Grid>
          </Grid>
        </Grid>
      </LabelTargetContext.Provider>
    </div>
  );
};

export default App;
