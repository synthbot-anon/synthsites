import React from "react";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { AppBar, IconButton, Toolbar, Box, Tabs, Tab } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import { highlightSelection } from "./utils/RangeUtils.js";

const theme = createMuiTheme();

const useStyles = makeStyles({
  app: {
    height: "calc(100vh - 16px)",
    "max-height": "calc(100vh - 16px)"
  },
  main: {
    "max-height": "calc(100vh - 64px)"
  },
  storyView: {
    padding: theme.spacing(1),
    textAlign: "left",
    overflow: "auto",
    height: "calc(100vh - 96px)",
    "max-height": "calc(100vh - 96px)"
  },
  sideView: {
    height: "calc(100vh - 152px)",
    "max-height": "calc(100vh - 96px)",
    padding: theme.spacing(1)
  },
  storyButton: {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(1)
  },
  title: {
    flexGrow: 1
  },
  controlTab: {}
});

class StoryView extends React.Component {
  render() {
    const { id, styles } = this.props;
    const { storyView } = styles;

    return (
      <Paper id={id} className={storyView}>
        Select a story
      </Paper>
    );
  }
}

const TabPanel = ({ children, value, index, ...other }) => (
  <Typography
    component="div"
    role="tabpanel"
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    <Box p={3}>{children}</Box>
  </Typography>
);

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`
  };
}

class SideView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0
    };
  }

  render() {
    const { sideView, controlTab } = this.props.styles;
    const value = this.state.selectedTab;

    const onChange = (event, newValue) => {
      this.setState({ selectedTab: newValue });
    };

    return (
      <div className={sideView}>
        <Toolbar>
          <Tabs value={value} onChange={onChange} aria-label="control panel">
            <Tab label="Labels" {...a11yProps(0)} />
            <Tab label="Shortcuts" {...a11yProps(1)} />
            <Tab label="Search" {...a11yProps(2)} />
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

const loadStory = event => {
  const reader = new FileReader();

  reader.onload = e => {
    const html = e.target.result;
    const container = document.getElementById("storyView");
    container.innerHTML = html;
  };

  reader.readAsText(event.target.files[0]);
};

class NavigationView extends React.Component {
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

class FileImport extends React.Component {
  render() {
    const { storyButton } = this.props.styles;
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

const App = () => {
  const styles = useStyles(theme);
  const { app, main } = styles;

  return (
    <div id="app" className={app}>
      <NavigationView styles={styles} />
      <Grid container className={main} spacing={2}>
        <Grid item xs={7}>
          <StoryView id="storyView" styles={styles} />
        </Grid>
        <Grid item xs={5}>
          <SideView styles={styles}>Hello World</SideView>
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
