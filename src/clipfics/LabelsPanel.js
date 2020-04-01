import React, { useState, useContext } from 'react';
import { Grid } from '@material-ui/core';

import { ThemeContext } from 'theme.js';
import { useClipfics } from 'tasks.js';
import TextFieldModal from 'common/TextFieldModal.js';
import { useSelectionCache } from 'common/ContainerSelection.js';
import useModalControls from 'common/useModalControls.js';
import useLoopControls from 'common/useLoopControls.js';
import CookieSynthLabel from './cookiesynth/CookieSynthLabel.js';


/**
 * React effect to highlight text by hotkey.
 * @param navigator StateMachine with which to register this hotkey
 * @param containerRef React ref for where a selection is valid
 */
const ClipficsHotkey = ({ onLabel, shortcut, description }) => {
  const { hotkeys, selection, terminal } = useClipfics();

  // Highlight selection only if it falls within the container
  const highlightWithinElement = () => {
    const selectionRange = selection.getRange();
    if (selectionRange) {
      onLabel(description);
    } else {
      terminal.log('you need to select some story text first');
    }
  };

  return (
    <hotkeys.Hotkey
      shortcut={shortcut}
      action={highlightWithinElement}
      description={description}
    />
  );
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
    isModalOpen: isTemplateModalOpen,
    openModal: openTemplateModal,
    closeModal: closeTemplateModal,
  } = useModalControls();

  const [displayKeys, setDisplayKeys] = useState([]);
  const [lastSelection, setLastSelection] = useState();
  let [pendingLabel, setPendingLabel] = useState();

  const onTemplateSpecified = (text) => {
    saveSelection();

    pendingLabel = new CookieSynthLabel(selection.getRange(), text);
    setPendingLabel(pendingLabel);

    beginRequestMissingProps(pendingLabel.missingProperties)
      .then(() => {
        if (pendingLabel.injectLabel()) {
          terminal.log('added label:', pendingLabel.completedLabel);
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

  const onHotkeyAdded = (shortcut, label) => {
    const newHotkey = (
      <ClipficsHotkey
        key={shortcut}
        onLabel={onTemplateSpecified}
        shortcut={shortcut}
        description={label}
      />
    );

    setDisplayKeys([newHotkey, ...displayKeys]);
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
    }
  };

  return (
    <Grid container {...props}>
      <Grid item className={classes['c-controls--fill-width']}>
        <hotkeys.Hotkey
          shortcut="Enter"
          action={() => {
            saveSelection();
            openTemplateModal();
          }}
          description="create custom label"
        />
        <ClipficsHotkey
          shortcut="c"
          onLabel={onTemplateSpecified}
          description='dialogue character="?"'
        />
        <ClipficsHotkey
          shortcut="e"
          onLabel={onTemplateSpecified}
          description='meta character="?" emotion="?"'
        />
        <hotkeys.Hotkey
          shortcut=">"
          action={() =>
            selectNext((current) => storyNavigator.getNextPhrase(current, /\S.*\S?/g))
          }
          description="Select next paragraph"
        />
        <hotkeys.Hotkey
          shortcut="<"
          action={() =>
            selectNext((current) => storyNavigator.getPreviousPhrase(current, /\S.*\S?/g))
          }
          description="Select previous paragraph"
        />
        <hotkeys.Hotkey
          shortcut="'"
          action={() =>
            selectNext((current) =>
              storyNavigator.getNextPhrase(current, /"[^ ][^"]*"?/g),
            )
          }
          description="Select next quote"
        />
        <hotkeys.Hotkey
          shortcut='"'
          action={() =>
            selectNext((current) =>
              storyNavigator.getPreviousPhrase(current, /"[^ ][^"]*"?/g),
            )
          }
          description="Select previous quote"
        />
        <hotkeys.Hotkey
          shortcut="."
          action={() =>
            selectNext((current) =>
              storyNavigator.getNextPhrase(current, /(?:\w[^.?!"]*[^ "][.?!]*)/g),
            )
          }
          description="Select next phrase"
        />
        <hotkeys.Hotkey
          shortcut=","
          action={() =>
            selectNext((current) =>
              storyNavigator.getPreviousPhrase(current, /(?:\w[^.?!"]*[^ "][.?!]*)/g),
            )
          }
          description="Select previous phrase"
        />


        <div children={displayKeys} />
        <TextFieldModal
          open={isTemplateModalOpen}
          onComplete={(text) => {
            closeTemplateModal();
            restoreSelection();
            onTemplateSpecified(text);
          }}
          onClose={() => {
            closeTemplateModal();
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
        <hotkeys.CreateNewHotkey onHotkeyAdded={onHotkeyAdded} />
      </Grid>
    </Grid>
  );
};
