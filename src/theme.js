import { createContext } from 'react';
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';

export const ThemeContext = createContext();

// TODO: https://material.io/design/material-theming/implementing-your-theme.html#color
export const theme = createMuiTheme();

// TODO: use BEM naming conventions for these
export const useStyles = makeStyles({
  'c-app--full-height': {
    height: 'calc(100vh - 0px)',
    'max-height': 'calc(100vh - 0px)',
  },

  'c-story-panel--full-height': {
    'max-height': 'calc(82vh - 64px)',
    height: 'calc(82vh - 64px)',
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
    padding: theme.spacing(3),
  },

  'c-control-panel': {
    position: 'absolute',
    top: '64px',
    bottom: '170px',
    right: '8px',
    overflow: 'auto',
    width: '100%',
    'border-radius': '4px',
    'border-style': 'solid',
    'border-width': '0px 0px 0px 2px',
    'border-color': '#F7F7F7',
    // 'max-height': 'calc(82vh - 64px)',
    // height: 'calc(82vh - 64px)',
  },

  'c-controls--fill-width': {
    width: '100%',
  },

  'c-controls__textfield': {
    'margin-top': theme.spacing(2),
    'margin-bottom': theme.spacing(2),
  },

  'c-controls__hotkey-list': {
    'max-width': '540px',
    'overflow-y': 'auto',
    'overflow-x': 'hidden',
    'width': '100%',
  },

  'c-hotkey__paper': {
    padding: theme.spacing(1),
    'line-height': '22px',
  },

  'c-hotkey__container': {
    'position': 'relative',
    'width': '100%',
    'text-align': 'left',
    'padding': theme.spacing(1),
    'margin-bottom': '8px',
  },

  'c-hotkey__description': {
    'border-style': 'solid',
    'border-width': '0px 0px 1px 0px',
    'border-color': '#F7F7F7',
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },

  'c-hotkey__shortcut': {
    position: 'absolute',
    right: 0,
    'min-width': '24px',
    'text-align': 'center',
  },

  'o-keyboard-key': {
    'background-color': '#F7F7F7',
    'background-image': 'linear-gradient(top,#F7F7F7, #E4E4E4)',
    'filter': 'progid :DXImageTransform.Microsoft.gradient(startColorStr="#F7F7F7",EndColorStr="#E4E4E4")',
    'border-color': '#D2D2D2',
    'border-radius': '3px',
    'border-style': 'solid',
    'border-width': '1px 1px 3px',
    'font-family': '"Courier New", Courier, monospace',
    'text-shadow': '1px 1px #FFFFFF',
    cursor: 'pointer',
  },

  'c-hotkey--enabled': {
    color: 'black',
  },

  'c-hotkey--disabled': {
    color: 'gray',
  },

  'c-hotkey__restore-button': {
    'padding-top': 0,
    'padding-bottom': 0,
  },

  'c-labelmodal__container': {
    // position: 'absolute',
    // top: '50%',
    // left: '50%',
    // width: '50%',
    // transform: 'translate(-50%, -50%)',
    background: 'white',
    // padding: theme.spacing(5),
    padding: theme.spacing(1),
    margin: theme.spacing(2),
    width: '30%',
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
    'margin-top': theme.spacing(1),
    'padding-top': theme.spacing(1),
    'padding-left': theme.spacing(1),
    'padding-right': theme.spacing(1),
    'max-height': 'calc(18vh - 16px)',
    height: 'calc(18vh - 16px)',
    bottom: '8px',
    left: '8px',
    right: '8px',
    overflow: 'auto',
    position: 'absolute',
    background: '#f8f8f8',
  },

  'c-terminal__history': {
    'font-family': "'Inconsolata', monospace",
    'line-height': '22px',
  },

  'c-terminal__button': {
    'font-family': "'Inconsolata', monospace",
    'padding-top': 0,
    'padding-bottom': 0,
    'padding-left': theme.spacing(1),
    'padding-right': theme.spacing(1),
    'margin-left': theme.spacing(1),
  },

  'u-title-box--compact': {
    'padding-bottom': '16px!important',
    '& > div': {
      padding: '8px!important',
    },
  },

  'c-metareplay-box': {
    'min-width': '67%',
    'max-height': 'calc(83vh - 340px)',
    'overflow-y': 'auto',
    'overflow-x': 'hidden',
    'padding-top': '8px',
    '& > div': {
      'min-width': '67%',
      'overflow-x': 'visible',
      'overflow-y': 'visible',
    },
    '& label': {
      color: '#000000',
    },
  },

  'c-metareplay-box__assignment': {
    color: 'rgba(0, 0, 0, 0.54)',
  },

  'c-autocomplete__input': {
    color: '#686868',
  },
});
