import React, { useState, useContext } from 'react';
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
import RangeUtils from 'common/RangeUtils.js';

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
  const clipfics = useClipfics();
  const [existingHotkeyActions] = useState({});
  let [hotkeyDisplays, setHotkeyDisplays] = useState([]);

  clipfics.hotkeys.useHotkeys();

  const registerHotkey = (shortcut, action, display) => {
    if (shortcut in existingHotkeyActions) {
      const existingAction = existingHotkeyActions[shortcut];
      clipfics.hotkeys.unregisterHotkey(shortcut, existingAction);
      hotkeyDisplays = hotkeyDisplays.filter((x) => x['key'] !== shortcut);
    }

    clipfics.hotkeys.registerHotkey(shortcut, action);
    setHotkeyDisplays((hotkeyDisplays = [display, ...hotkeyDisplays]));
    existingHotkeyActions[shortcut] = action;
  };

  return { registerHotkey, hotkeyDisplays };
};

export default () => {
  const clipfics = useClipfics();
  const { saveSelection, restoreSelection } = useSelectionCache(clipfics.selection);
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
    setOriginalLabel((originalLabel = currentLabel));
    setModifyLabelCallback(() => modifyLabelCallback);
    openModifyLabelModal();
  };

  const labelSelectionWithTemplate = (template) => {
    saveSelection();

    pendingLabel = new CookieSynthLabel(clipfics.selection.getRange(), template);
    setPendingLabel(pendingLabel);

    beginRequestMissingProps(pendingLabel.missingTemplateProperties)
      .then(() => {
        const { terminal, selection, metaReplay } = clipfics;
        if (
          pendingLabel.injectLabel(clipfics)
        ) {
          setNewHotkeyValue(pendingLabel.completedLabel);
        } else {
          terminal.log('invalid label:', pendingLabel.completedLabel);
        }
        restoreSelection();
      })
      .catch((error) => {
        setPendingLabel(null);
        stopRequestingProps();
        restoreSelection();
      });
  };

  const selectNext = (getNextRange) => {
    let currentSelection = clipfics.selection.getRange();
    if (!currentSelection) {
      currentSelection = lastSelection || clipfics.storyNavigator.getInitialRange();
    }

    const nextSelection = getNextRange(currentSelection);
    if (nextSelection) {
      setLastSelection(nextSelection);
      clipfics.selection.setRange(nextSelection);

      new RangeUtils(nextSelection).scrollIntoView();
    }
  };

  const addCustomLabel = () => {
    const selectionRange = clipfics.selection.getRange();
    if (!selectionRange) {
      clipfics.terminal.log('you need to select some story text first');
      return;
    }

    saveSelection();
    openCustomLabelModal();
  };

  const addTemplatedLabel = (template) => () => {
    const selectionRange = clipfics.selection.getRange();
    if (!selectionRange) {
      clipfics.terminal.log('you need to select some story text first');
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
      () =>
        selectNext((current) =>
          clipfics.storyNavigator.getNextPhrase(current, regex),
        ),
      description,
    );
  };

  const createPrevSelectionHotkey = (shortcut, regex, description) => {
    createHotkey(
      shortcut,
      () =>
        selectNext((current) =>
          clipfics.storyNavigator.getPreviousPhrase(current, regex),
        ),
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

  const HotkeyDisplay = () => {
    const { classes } = useContext(ThemeContext);
    return (
      <div className={classes['c-controls__hotkey-list']} children={hotkeyDisplays} />
    );
  };

  const HotkeyModals = () => (
    <React.Fragment>
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
        label="Update label"
      />
    </React.Fragment>
  );

  const CreateHotkey = () => (
    <CreateNewHotkey hotkeys={clipfics.hotkeys} onHotkeyAdded={createLabelHotkey} />
  );

  clipfics.requestNewLabel = requestNewLabel;
  return { HotkeyDisplay, HotkeyModals, CreateHotkey, requestNewLabel };
};
