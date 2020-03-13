/**
 * Main entry point for the frontend.
 */

import React, { useState, useEffect, createRef, useContext } from 'react';
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
import sanitizeHtml from 'sanitize-html';
import { ThemeContext, useStyles, theme } from './theme.js';
import { ClipficsContext } from './tasks.js';
import { ClipficsLabelsPanel } from './clipfics/LabelsPanel.js';

const IGNORE_KEYS = new Set(['Shift', 'Control', 'Alt', 'CapsLock']);

// React effect to use hotkeys on a page
const useHotkeys = (hotkeys) => {
  const keyDownListener = (e) => {
    if (IGNORE_KEYS.has(e.key)) {
      return;
    }

    if (hotkeys['all'] && hotkeys['all'].length !== 0) {
      e.preventDefault();
      const actions = hotkeys['all'];
      actions.forEach((f) => f(e.key));
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      const actions = hotkeys['Escape'] || [];
      actions.forEach((f) => f(e.key));
      return;
    }

    if (document.activeElement.tagName.toLowerCase() === 'input') {
      return;
    }

    e.preventDefault();
    const actions = hotkeys[e.key] || [];
    actions.forEach((f) => f(e.key));
  };

  useEffect(() => {
    document.addEventListener('keydown', keyDownListener);
    return () => {
      document.removeEventListener('keydown', keyDownListener);
    };
  });
};

// Panel used to display an HTML story.
const StorySheet = (props) => <Paper {...props} />;

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
          <Tab label="Shortcuts" />
          <Tab label="Search" />
        </Tabs>
      </Toolbar>
      <TabPanel className={classes.controlTab} value={selectedTab} index={0}>
        <ClipficsLabelsPanel />
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

const sanitizeFimfic = (html) => {
  // default options plus h1, h2, and hr
  return sanitizeHtml(html, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'blockquote',
      'p',
      'a',
      'ul',
      'ol',
      'nl',
      'li',
      'b',
      'i',
      'strong',
      'em',
      'strike',
      'code',
      'hr',
      'br',
      'div',
      'table',
      'thead',
      'caption',
      'tbody',
      'tr',
      'th',
      'td',
      'pre',
      'iframe',
    ],
    disallowedTagsMode: 'discard',
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src'],
    },
    selfClosing: [
      'img',
      'br',
      'hr',
      'area',
      'base',
      'basefont',
      'input',
      'link',
      'meta',
    ],
    allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: true,
  });
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

  return () => {
    const { classes } = useContext(ThemeContext);
    return (
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
  const FileImportButton = createFileImportButton(setStoryContents);

  const themeContext = {
    classes: useStyles(theme),
  };
  const classes = themeContext.classes;

  const taskContext = {
    hotkeys: {},
    storyContainerRef: createRef(),
  };

  useHotkeys(taskContext.hotkeys);

  // TODO: sanitize html before displaying it

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
              <StorySheet
                id="js-story-sheet"
                className={classes['c-story-panel__paper']}
                dangerouslySetInnerHTML={{ __html: sanitizeFimfic(storyContents) }}
              />
            </div>
          </Grid>
          <Grid item xs={5} className={classes['c-control-panel']}>
            <ClipficsContext.Provider value={taskContext}>
              <ClipficsControlPanel />
            </ClipficsContext.Provider>
            <Grid container>
              <FileImportButton />
              <FileExport />
            </Grid>
          </Grid>
        </Grid>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
