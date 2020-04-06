import React, { useState, useContext } from 'react';
import { Grid } from '@material-ui/core';

import { ThemeContext } from 'theme.js';
import { useClipfics } from 'tasks.js';
import TextFieldModal from 'common/TextFieldModal.js';
import { useSelectionCache } from 'common/ContainerSelection.js';
import useModalControls from 'common/useModalControls.js';
import useLoopControls from 'common/useLoopControls.js';
import useInitializer from 'common/useInitializer.js';
import CookieSynthLabel, {
  getLabelDescription,
} from './cookiesynth/CookieSynthLabel.js';
import { useCreateNewHotkey } from 'common/Hotkeys.js';

const Hotkey = ({ shortcut, description, ...other }) => {
  const { classes } = useContext(ThemeContext);
  return (
    <div
      key={shortcut}
      className={classes['c-hotkey__paper']}
    >{`${shortcut} 🠖 ${description}`}</div>
  );
};

const useDisplayableHotkeys = () => {
  const { hotkeys } = useClipfics();
  const [existingHotkeyActions] = useState({});
  let [hotkeyDisplays, setHotkeyDisplays] = useState([]);

  hotkeys.useHotkeys();

  const registerHotkey = (shortcut, action, display) => {
    if (shortcut in existingHotkeyActions) {
      const existingAction = existingHotkeyActions[shortcut];
      hotkeys.unregisterHotkey(shortcut, existingAction);
      hotkeyDisplays = hotkeyDisplays.filter((x) => x['key'] !== shortcut);
    }

    hotkeys.registerHotkey(shortcut, action);
    setHotkeyDisplays((hotkeyDisplays = [display, ...hotkeyDisplays]));
    existingHotkeyActions[shortcut] = action;
  };

  useInitializer(() => {});

  return { registerHotkey, hotkeyDisplays };
};

export const ClipficsLabelsPanel = ({ ...props }) => {
  const { classes } = useContext(ThemeContext);

  const { hotkeys, selection, terminal, storyNavigator } = useClipfics();
  const { saveSelection, restoreSelection } = useSelectionCache(selection);
  const {
    currentItem: currentMissingProp,
    hasNext: hasMissingProps,
    begin: beginRequestMissingProps,
    moveToNext: requestNextMissingProp,
    terminate: stopRequestingProps,
  } = useLoopControls();
  const {
    isModalOpen: isCustomLabelModalOpen,
    openModal: openCustomLabelModal,
    closeModal: closeCustomLabelModal,
  } = useModalControls();
  const {
    CreateNewHotkey,
    setValue: setNewHotkeyValue,
    requestHotkey: createHotkeyHotkey,
  } = useCreateNewHotkey();
  const {
    isModalOpen: isModifyLabelModalOpen,
    openModal: openModifyLabelModal,
    closeModal: closeModifyLabelModal,
  } = useModalControls();
  let [modifyLabelCallback, setModifyLabelCallback] = useState();
  let [originalLabel, setOriginalLabel] = useState();

  const [lastSelection, setLastSelection] = useState();
  const { registerHotkey, hotkeyDisplays } = useDisplayableHotkeys();
  let [pendingLabel, setPendingLabel] = useState();

  const requestNewLabel = (currentLabel, onComplete) => {
    modifyLabelCallback = onComplete;
    setOriginalLabel(originalLabel = currentLabel);
    setModifyLabelCallback(() => modifyLabelCallback);
    openModifyLabelModal();
  }

  const labelSelectionWithTemplate = (template) => {
    saveSelection();

    pendingLabel = new CookieSynthLabel(selection.getRange(), template);
    setPendingLabel(pendingLabel);

    beginRequestMissingProps(pendingLabel.missingProperties)
      .then(() => {
        if (pendingLabel.injectLabel(terminal, requestNewLabel)) {
          setNewHotkeyValue(pendingLabel.completedLabel);
        } else {
          terminal.log('invalid label:', pendingLabel.completedLabel);
        }
        restoreSelection();
      })
      .catch((error) => {
        console.log(error);
        setPendingLabel(null);
        stopRequestingProps();
        restoreSelection();
      });
  };

  const selectNext = (getNextRange) => {
    let currentSelection = selection.getRange();
    if (!currentSelection) {
      currentSelection = lastSelection || storyNavigator.getInitialRange();
    }

    const nextSelection = getNextRange(currentSelection);
    if (nextSelection) {
      setLastSelection(nextSelection);
      selection.setRange(nextSelection);

      const span = document.createElement('span');
      span.id = '__synth_selection';
      nextSelection.insertNode(span);
      span.scrollIntoView(false);
      span.parentNode.removeChild(span);
    }
  };

  const addCustomLabel = () => {
    const selectionRange = selection.getRange();
    if (!selectionRange) {
      terminal.log('you need to select some story text first');
      return;
    }

    saveSelection();
    openCustomLabelModal();
  };

  const addTemplatedLabel = (template) => () => {
    const selectionRange = selection.getRange();
    if (!selectionRange) {
      terminal.log('you need to select some story text first');
      return;
    }

    labelSelectionWithTemplate(template);
  };

  const createHotkey = (shortcut, action, description) => {
    registerHotkey(
      shortcut,
      action,
      <Hotkey key={shortcut} shortcut={shortcut} description={description} />,
    );
  };

  const createLabelHotkey = (shortcut, labelTemplate) => {
    const description = getLabelDescription(labelTemplate) || labelTemplate;
    createHotkey(shortcut, addTemplatedLabel(labelTemplate), description);
  };

  const createNextSelectionHotkey = (shortcut, regex, description) => {
    createHotkey(
      shortcut,
      () => selectNext((current) => storyNavigator.getNextPhrase(current, regex)),
      description,
    );
  };

  const createPrevSelectionHotkey = (shortcut, regex, description) => {
    createHotkey(
      shortcut,
      () => selectNext((current) => storyNavigator.getPreviousPhrase(current, regex)),
      description,
    );
  };

  useInitializer(() => {
    createHotkey('Enter', addCustomLabel, 'Create custom label');
    createLabelHotkey('e', 'meta character="?" emotion="?"');
    createLabelHotkey('c', 'dialogue speaker="?"');
    createNextSelectionHotkey('>', /\S.*\S?/g, 'Select next paragraph');
    createPrevSelectionHotkey('<', /\S.*\S?/g, 'Select previous paragraph');
    createNextSelectionHotkey("'", /"[^ ][^"]*"?/g, 'Select next quote');
    createPrevSelectionHotkey('"', /"[^ ][^"]*"?/g, 'Select previous quote');
    createNextSelectionHotkey(
      '.',
      /(?:\w[^.?!"]*[^ "][.?!]*)/g,
      'Select next phrase',
    );
    createPrevSelectionHotkey(
      ',',
      /(?:\w[^.?!"]*[^ "][.?!]*)/g,
      'Select previous phrase',
    );
    createHotkey('!', createHotkeyHotkey, 'Create a new hotkey');
  });

  return (
    <Grid container {...props}>
      <Grid item className={classes['c-controls--fill-width']}>
        <div
          className={classes['c-controls__hotkey-list']}
          children={hotkeyDisplays}
        />
        <TextFieldModal
          open={isCustomLabelModalOpen}
          onComplete={(text) => {
            closeCustomLabelModal();
            restoreSelection();
            labelSelectionWithTemplate(text);
          }}
          onClose={() => {
            closeCustomLabelModal();
            restoreSelection();
          }}
          label="Add label"
        />
        <TextFieldModal
          open={hasMissingProps}
          onComplete={(text) => {
            pendingLabel.setNextValue(text);
            requestNextMissingProp();
          }}
          onClose={stopRequestingProps}
          label={currentMissingProp}
        />
        <TextFieldModal
          open={isModifyLabelModalOpen}
          onComplete={(text) => {
            modifyLabelCallback(text);
            closeModifyLabelModal();
          }}
          onClose={() => {
            closeModifyLabelModal();
          }}
          value={originalLabel}
          label="Modify label"
        />
        <CreateNewHotkey hotkeys={hotkeys} onHotkeyAdded={createLabelHotkey} />
      </Grid>
    </Grid>
  );
};
