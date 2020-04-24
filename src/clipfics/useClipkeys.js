import React, { useState, useContext, useRef } from 'react';
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
import { isLabelValid } from './cookiesynth/common.js';
import { useCreateNewHotkey } from 'common/Hotkeys.js';
import RangeUtils from 'common/RangeUtils.js';
import { Button } from '@material-ui/core';

const Hotkey = ({ hotkeys, shortcut, description, disabled, restore }) => {
  const { classes } = useContext(ThemeContext);
  const classNamePaper = classes['c-hotkey__paper'];
  const classNameDisabled = classes[`c-hotkey--${disabled ? 'disabled' : 'enabled'}`];
  const classNames = `${classNamePaper} ${classNameDisabled}`;

  return (
    <div>
      <span className={classNames}>{`${shortcut} 🠖 ${description}`}</span>
      {disabled && (
        <Button
          className={classes['c-hotkey__restore-button']}
          variant="outlined"
          size="small"
          color="primary"
          disabled={!disabled}
          onClick={restore}
        >
          Restore
        </Button>
      )}
    </div>
  );
};

const HotkeyDisplay = ({
  hotkeys,
  enabledHotkeys,
  disabledHotkeys,
  restoreHotkey,
}) => {
  const { classes } = useContext(ThemeContext);
  hotkeys.useHotkeyUpdateListener();

  return (
    <div className={classes['c-controls__hotkey-list']}>
      {Array.from(enabledHotkeys.entries()).map(([, entry]) => {
        const [key, shortcut, , description] = entry;
        return (
          <Hotkey
            key={key}
            hotkeys={hotkeys}
            shortcut={shortcut}
            description={description}
            disabled={false}
          />
        );
      })}

      {Array.from(disabledHotkeys.entries()).map(([key, entry]) => {
        const [shortcut, , description] = entry;

        return (
          <Hotkey
            key={key}
            hotkeys={hotkeys}
            shortcut={shortcut}
            description={description}
            disabled={true}
            restore={() => restoreHotkey(key)}
          />
        );
      })}
    </div>
  );
};

const useHotkeyDisplay = () => {
  const clipfics = useClipfics();
  const nextHotkeyIndex = useRef(0);
  const enabledHotkeys = useRef(new Map());
  const disabledHotkeys = useRef(new Map());

  const registerHotkey = (shortcut, action, description) => {
    const enabled = enabledHotkeys.current;
    const disabled = disabledHotkeys.current;

    if (enabled.has(shortcut)) {
      const [oldKey, oldShortcut, oldAction, oldDescription] = enabled.get(shortcut);
      clipfics.hotkeys.unregisterHotkey(shortcut, oldAction);
      disabled.set(oldKey, [oldShortcut, oldAction, oldDescription]);
    }

    const nextIndex = nextHotkeyIndex.current++;
    enabled.set(shortcut, [nextIndex, shortcut, action, description]);

    clipfics.hotkeys.registerHotkey(shortcut, action);
  };

  const restoreHotkey = (key) => {
    const enabled = enabledHotkeys.current;
    const disabled = disabledHotkeys.current;
    const [shortcut, action, description] = disabled.get(key);
    const [oldKey, oldShortcut, oldAction, oldDescription] = enabled.get(shortcut);

    clipfics.hotkeys.unregisterHotkey(shortcut, oldAction);
    disabled.delete(key);
    enabled.set(shortcut, [key, shortcut, action, description]);
    disabled.set(oldKey, [oldShortcut, oldAction, oldDescription]);
    clipfics.hotkeys.registerHotkey(shortcut, action);
  };

  const Display = () => (
    <HotkeyDisplay
      hotkeys={clipfics.hotkeys}
      enabledHotkeys={enabledHotkeys.current}
      disabledHotkeys={disabledHotkeys.current}
      restoreHotkey={restoreHotkey}
    />
  );

  return {
    HotkeyDisplay: Display,
    registerHotkey,
  };
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
  } = useCreateNewHotkey(isLabelValid);
  const {
    isModalOpen: isModifyLabelModalOpen,
    openModal: openModifyLabelModal,
    closeModal: closeModifyLabelModal,
  } = useModalControls();
  let [modifyLabelCallback, setModifyLabelCallback] = useState();
  let [originalLabel, setOriginalLabel] = useState();

  const [lastSelection, setLastSelection] = useState();
  const { HotkeyDisplay, registerHotkey } = useHotkeyDisplay();
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
        const { terminal } = clipfics;
        if (pendingLabel.injectLabel(clipfics)) {
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
    registerHotkey(shortcut, action, description);
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
    <CreateNewHotkey
      hotkeys={clipfics.hotkeys}
      onHotkeyAdded={createLabelHotkey}
      isHotkeyValid={isLabelValid}
    />
  );

  clipfics.requestNewLabel = requestNewLabel;
  return { HotkeyDisplay, HotkeyModals, CreateHotkey, requestNewLabel };
};
