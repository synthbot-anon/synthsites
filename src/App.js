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
class StoryPanel extends React.Component {
  render() {
    const { id, styles } = this.props;
    const { storyPanel } = styles;

    return (
      <Paper id={id} className={storyPanel}>
        Select a story
      </Paper>
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
class ControlsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0
    };
  }

  render() {
    const { controlsPanel, controlTab } = this.props.styles;
    const value = this.state.selectedTab;

    const onChange = (event, newValue) => {
      this.setState({ selectedTab: newValue });
    };

    return (
      <div className={controlsPanel}>
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
    const { title } = this.props.styles;
    return (
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={title}>
            Clipfics
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

/**
 * Button to load a story file into the StoryPanel.
 */
class FileImport extends React.Component {
  render() {
    const { storyButton } = this.props.styles;

    const loadStory = event => {
      const reader = new FileReader();
      reader.onload = e => {
        const html = e.target.result;
        const container = document.getElementById("StoryPanel");
        container.innerHTML = html;
      };
      reader.readAsText(event.target.files[0]);
    };

    return (
      <div>
        <input
          id="raised-button-file"
          type="file"
          style={{ display: "none" }}
          onChange={loadStory}
        />
        <label htmlFor="raised-button-file">
          <Button variant="contained" component="span" className={storyButton}>
            New story
          </Button>
        </label>
      </div>
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
    const { storyButton } = this.props.styles;
    return (
      <Button className={storyButton} onClick={highlightSelection}>
        Highlight
      </Button>
    );
  }
}

/**
 * Main app.
 */
const App = () => {
  const styles = useStyles(theme);
  const { app, main } = styles;

  return (
    <div id="app" className={app}>
      <NavigationBar styles={styles} />
      <Grid container className={main} spacing={2}>
        <Grid item xs={7}>
          <StoryPanel id="StoryPanel" styles={styles} />
        </Grid>
        <Grid item xs={5}>
          <ControlsPanel styles={styles} />
          <Grid container>
            <FileImport styles={styles} />
            <FileExport styles={styles} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default App;
