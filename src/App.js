/**
 * Main entry point for the frontend.
 */

import React from "react";
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
  Typography
} from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import { highlightSelection } from "./utils/RangeUtils.js";
import { useStyles, theme } from "./theme.js";

/**
 * Panel used to display an HTML story.
 */
class StorySheet extends React.Component {
  render() {
    const { id, classes } = this.props;

    return (
      <div className={classes['c-story-panel__container']}>
        <Paper id={id} className={classes['c-story-panel__paper']} >
          Select a story
        </Paper>
      </div>
    );
  }
}

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
class ControlPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0
    };
  }

  render() {
    const { controlTab } = this.props.classes;
    const value = this.state.selectedTab;

    const onChange = (event, newValue) => {
      this.setState({ selectedTab: newValue });
    };

    return (
      <div>
        <Toolbar>
          <Tabs value={value} onChange={onChange}>
            <Tab label="Labels" />
            <Tab label="Shortcuts" />
            <Tab label="Search" />
          </Tabs>
        </Toolbar>
        <TabPanel className={controlTab} value={value} index={0}>
          Item one
        </TabPanel>
        <TabPanel className={controlTab} value={value} index={1}>
          Item two
        </TabPanel>
        <TabPanel className={controlTab} value={value} index={2}>
          Item three
        </TabPanel>
      </div>
    );
  }
}

/**
 * Navigation bar at the top of the site. This doesn't serve any functiona purpose at
 * the moment.
 */
class NavigationBar extends React.Component {
  render() {
    return (
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">
            Clipfics
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

/**
 * Button to load a story file into the StorySheet.
 */
class FileImport extends React.Component {
  render() {
    const classes = this.props.classes;

    const loadStory = event => {
      const reader = new FileReader();
      reader.onload = e => {
        const html = e.target.result;
        const container = document.getElementById("js-story-sheet");
        container.innerHTML = html;
      };
      reader.readAsText(event.target.files[0]);
    };

    return (
      <span>
        <input
          id="c-raised-button-file"
          type="file"
          style={{ display: "none" }}
          onChange={loadStory}
        />
        <label htmlFor="c-raised-button-file">
          <Button variant="contained" component="span" className={classes['c-fileio-import-button']}>
            Load story
          </Button>
        </label>
      </span>
    );
  }
}

/**
 * Button to export a labeled story file, which is not what it does at the moment.
 * This currently highlights the selected text. Note that this will highlight ANY
 * text selected on the page, not just story text.
 */
class FileExport extends React.Component {
  render() {
    const classes = this.props.classes;
    return (
      <Button className={classes['c-fileio-export-button']} onClick={highlightSelection}>
        Export labels
      </Button>
    );
  }
}

/**
 * Main app.
 */
const App = () => {
  const classes = useStyles(theme);

  return (
    <div id="app" className={classes['c-app--full-height']}>
      <NavigationBar classes={classes} />
      <Grid container spacing={2}>
        <Grid item xs={7} className={classes['c-story-panel--full-height']} >
          <StorySheet id="js-story-sheet" classes={classes} />
        </Grid>
        <Grid item xs={5} className={classes['c-control-panel']} >
          <ControlPanel classes={classes} />
          <Grid container>
            <FileImport classes={classes} />
            <FileExport classes={classes} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default App;
