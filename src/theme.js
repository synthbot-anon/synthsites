import { createMuiTheme, makeStyles } from "@material-ui/core/styles";

// TODO: https://material.io/design/material-theming/implementing-your-theme.html#color
export const theme = createMuiTheme();

// TODO: use BEM naming conventions for these
export const useStyles = makeStyles({
  'c-app--full-height': {
    height: "calc(100vh - 16px)",
    "max-height": "calc(100vh - 16px)"
  },

  'c-story-panel--full-height': {
    "max-height": "calc(100vh - 64px)",
  },

  'c-control-panel': {
  },

  'c-fileio-import-button': {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(1)
  },

  'c-fileio-export-button': {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(1)
  },

  'c-story-panel__paper': {
    padding: theme.spacing(1),
  },

  'c-story-panel__container': {
    overflow: 'auto',
    height: "100%",
  }

});
