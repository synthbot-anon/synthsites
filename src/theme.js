import { createMuiTheme, makeStyles } from "@material-ui/core/styles";

// TODO: https://material.io/design/material-theming/implementing-your-theme.html#color
export const theme = createMuiTheme();

// TODO: use BEM naming conventions for these
export const useStyles = makeStyles({
  app: {
    height: "calc(100vh - 16px)",
    "max-height": "calc(100vh - 16px)"
  },
  main: {
    "max-height": "calc(100vh - 64px)"
  },
  storyPanel: {
    padding: theme.spacing(1),
    textAlign: "left",
    overflow: "auto",
    height: "calc(100vh - 96px)",
    "max-height": "calc(100vh - 96px)"
  },
  controlsPanel: {
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
