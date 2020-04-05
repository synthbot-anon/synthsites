import { createContext } from 'react';
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';

export const ThemeContext = createContext();

// TODO: https://material.io/design/material-theming/implementing-your-theme.html#color
export const theme = createMuiTheme();

// TODO: use BEM naming conventions for these
export const useStyles = makeStyles({
  'c-app--full-height': {
    height: 'calc(100vh - 4px)',
    'max-height': 'calc(100vh - 4px)',
  },

  'c-story-panel--full-height': {
    'max-height': 'calc(85vh - 64px)',
    'height': 'calc(85vh - 64px)',
  },

  'c-fileio-import-button': {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(1),
  },

  'c-fileio-export-button': {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(1),
  },

  'c-story-panel__paper': {
    padding: theme.spacing(1),
    'user-select': 'contain',
  },

  'c-story-panel__container': {
    overflow: 'auto',
    height: '100%',
  },

  'c-control-panel': {
    'max-height': 'calc(85vh - 64px)',
    'height': 'calc(85vh - 64px)',
  },

  'c-controls--fill-width': {
    width: '100%',
  },

  'c-controls__textfield': {
    'margin-top': theme.spacing(2),
    'margin-bottom': theme.spacing(2),
  },

  'c-controls__hotkey-list': {
    'height': 'calc(85vh - 340px)',
    'max-height': 'calc(85vh - 340px)',
    'overflow-y': 'auto',
    'overflow-x': 'hidden',
  },

  'c-hotkey__paper': {
    padding: theme.spacing(1),
    width: '100%',
  },

  'c-labelmodal__container': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    padding: theme.spacing(5),
  },

  'c-labelmodal__textfield': {
    width: '100%',
  },

  'c-request-hotkey__request': {
    background: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    padding: theme.spacing(1),
    'font-weight': 'bold',
  },

  'c-request-hotkey__description': {
    padding: theme.spacing(1),
  },

  'c-request-hotkey__paper': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    padding: theme.spacing(2),
  },

  'c-terminal': {
    'padding-top': theme.spacing(2),
    'margin-left': theme.spacing(2),
    'margin-right': theme.spacing(2),
    'max-height': 'calc(15vh - 8px)',
    'height': 'calc(15vh - 8px)',
    'overflow': 'auto',
    'bottom': '0%',
    flexWidth: 1,

  },

  'c-terminal__history': {
    'font-family': "'Inconsolata', monospace",
    'line-height': 1.0,
  },

});
