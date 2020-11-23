import React, { useState, useContext, useEffect, createRef } from 'react';
import useHotkeyListener from 'common/useHotkeyListener.js';
import useContainerSelection from 'common/useContainerSelection.js';
import HtmlNavigator from 'common/HtmlNavigator.js';
import CookieSynthHtml from 'clipfics/cookiesynth/CookieSynthHtml.js';
import CookieSynthGreentext, {
  htmlToGreen,
} from 'clipfics/cookiesynth/CookieSynthGreentext.js';
import { ThemeContext } from 'theme.js';
import useForceUpdate from 'common/useForceUpdate.js';
import { Grid } from '@material-ui/core';
import MetaReplay, { MetaDisplay } from 'clipfics/MetaReplay.js';
import useClipkeys from 'clipfics/useClipkeys.js';
import RangeTreeMap from 'common/RangeTreeMap.js';
import { useClipficsContext } from 'tasks.js';
import synthComponent from 'common/synthComponent.js';
import useInitializer from 'common/useInitializer.js';
import { TerminalSpan, TerminalButton } from 'common/Terminal.js';

const HtmlResourceView = ({ taskContext }) => {
  const { classes } = useContext(ThemeContext);
  const { forceUpdate } = useForceUpdate();

  useEffect(() => {
    taskContext.updateStoryDisplay = forceUpdate;
    return () => {
      taskContext.updateStoryDisplay = null;
    };
  });

  return (
    <div className={classes['c-story-panel__container']}>
      <CookieSynthHtml className={classes['c-story-panel__paper']}>
        {taskContext.storyContent}
      </CookieSynthHtml>
    </div>
  );
};

const GreentextResourceView = ({ taskContext }) => {
  const { classes } = useContext(ThemeContext);
  const { forceUpdate } = useForceUpdate();

  useEffect(() => {
    taskContext.updateStoryDisplay = forceUpdate;
    return () => {
      taskContext.updateStoryDisplay = null;
    };
  });

  return (
    <div className={classes['c-story-panel__container']}>
      <CookieSynthGreentext className={classes['c-story-panel__paper']}>
        {taskContext.storyContent}
      </CookieSynthGreentext>
    </div>
  );
};

const MetaStateView = ({ taskContext }) => {
  const { forceUpdate } = useForceUpdate();

  useEffect(() => {
    taskContext.updateMetaDisplay = forceUpdate;
    return () => {
      taskContext.updateMetaDisplay = null;
    };
  });

  return <MetaDisplay />;
};

const HotkeyPanel = () => {
  const clipfics = useClipficsContext();
  const { classes } = useContext(ThemeContext);

  return (
    <Grid container>
      <Grid item className={classes['c-controls--fill-width']}>
        <clipfics.components.HotkeyDisplay />
        <clipfics.components.HotkeyModals />
      </Grid>
    </Grid>
  );
};

const getCurrentHtmlContent = () => {
  const div = document.getElementById('js-story-sheet').cloneNode(true);
  div.querySelectorAll('.o-label--blcat-highlight-full').forEach((el) => {
    el.replaceWith(...el.childNodes);
  });

  const storyData = div.innerHTML;
  const storyBlob = new Blob([storyData], {
    type: 'text/html',
  });

  return storyBlob;
};

const getCurrentGreenContent = () => {
  const storyNode = document.getElementById('js-story-sheet');
  const greentext = htmlToGreen(storyNode);
  const storyBlob = new Blob([greentext], {
    type: 'text/plain',
  });

  return storyBlob;
};

class StandardHotkeySetter {
  #clipkeys;

  constructor(clipkeys) {
    this.#clipkeys = clipkeys;

    this.changeNarrator = (shortcut) =>
      clipkeys.api.createLabelHotkey(
        shortcut,
        'meta element="narrator" character="?"',
      );
    this.labelSpeaker = (shortcut) =>
      clipkeys.api.createLabelHotkey(shortcut, 'spoken character="?"');
    this.speakerDescription = (shortcut) =>
      clipkeys.api.createLabelHotkey(
        shortcut,
        'meta character="?" age="?" gender="?"',
      );
    this.labelEmotion = (shortcut) =>
      clipkeys.api.createLabelHotkey(shortcut, 'spoken emotion="?"');
    this.defaultEmotion = (shortcut) =>
      clipkeys.api.createLabelHotkey(shortcut, 'meta character="?" emotion="?"');
    this.tunePhrase = (shortcut) =>
      clipkeys.api.createLabelHotkey(
        shortcut,
        'tuned rate="?" stress="?" volume="?" pitch="?"',
      );
    this.labelPause = (shortcut) =>
      clipkeys.api.createLabelHotkey(
        shortcut,
        'timed pause-before="?" pause-after="?"',
      );
    this.labelDirection = (shortcut) =>
      clipkeys.api.createLabelHotkey(shortcut, 'positioned balance="?"');
    this.labelPronunciation = (shortcut) =>
      clipkeys.api.createLabelHotkey(shortcut, 'spoken-as pronunciation="?"');
    this.labelEffects = (shortcut) =>
      clipkeys.api.createLabelHotkey(shortcut, 'voiced effects="?"');
    this.ignore = (shortcut) => clipkeys.api.createLabelHotkey(shortcut, 'ignored');
    this.repeatLastLabel = (shortcut) =>
      clipkeys.api.createRepeatLabelHotkey(shortcut);
    this.nextParagraph = (shortcut) =>
      clipkeys.api.createNextSelectionHotkey(
        shortcut,
        /\S.*\S?/g,
        'Select next paragraph',
      );
    this.prevParagraph = (shortcut) =>
      clipkeys.api.createPrevSelectionHotkey(
        shortcut,
        /\S.*\S?/g,
        'Select previous paragraph',
      );
    this.nextQuote = (shortcut) =>
      clipkeys.api.createNextSelectionHotkey(
        shortcut,
        /"[^ ][^"]*"?/g,
        'Select next quote',
      );
    this.prevQuote = (shortcut) =>
      clipkeys.api.createPrevSelectionHotkey(
        shortcut,
        /"[^ ][^"]*"?/g,
        'Select previous quote',
      );
    this.nextPhrase = (shortcut) =>
      clipkeys.api.createNextSelectionHotkey(
        shortcut,
        /(?:\w[^.?!"]*[^ "][.?!]*)/g,
        'Select next phrase',
      );
    this.prevPhrase = (shortcut) =>
      clipkeys.api.createPrevSelectionHotkey(
        shortcut,
        /(?:\w[^.?!"]*[^ "][.?!]*)/g,
        'Select previous phrase',
      );
  }

  clearHotkeys() {
    this.#clipkeys.api.clearHotkeys();
  }
}

const addUSHotkeys = (hotkeySetter) => {
  hotkeySetter.clearHotkeys();

  hotkeySetter.changeNarrator('~');
  hotkeySetter.labelSpeaker('1');
  hotkeySetter.labelEmotion('2');
  hotkeySetter.tunePhrase('3');
  hotkeySetter.labelPause('4');
  hotkeySetter.labelDirection('5');
  hotkeySetter.labelPronunciation('6');
  hotkeySetter.labelEffects('7');
  hotkeySetter.ignore('9');
  hotkeySetter.repeatLastLabel('0');

  hotkeySetter.speakerDescription('!');
  hotkeySetter.defaultEmotion('@');

  hotkeySetter.prevParagraph('<');
  hotkeySetter.nextParagraph('>');
  hotkeySetter.prevQuote('"');
  hotkeySetter.nextQuote("'");
  hotkeySetter.prevPhrase(',');
  hotkeySetter.nextPhrase('.');
};

const addUKHotkeys = (hotkeySetter) => {
  hotkeySetter.clearHotkeys();

  hotkeySetter.changeNarrator('¬');
  hotkeySetter.labelSpeaker('1');
  hotkeySetter.labelEmotion('2');
  hotkeySetter.tunePhrase('3');
  hotkeySetter.labelPause('4');
  hotkeySetter.labelDirection('5');
  hotkeySetter.labelPronunciation('6');
  hotkeySetter.labelEffects('7');
  hotkeySetter.ignore('9');
  hotkeySetter.repeatLastLabel('0');

  hotkeySetter.speakerDescription('!');
  hotkeySetter.defaultEmotion('"');

  hotkeySetter.prevParagraph('<');
  hotkeySetter.nextParagraph('>');
  hotkeySetter.prevQuote('@');
  hotkeySetter.nextQuote("'");
  hotkeySetter.prevPhrase(',');
  hotkeySetter.nextPhrase('.');
};

const LOCALIZATION_OPTIONS = ['american', 'british'];
const localize = (hotkeySetter, locale) => {
  if (locale === 'american') {
    addUSHotkeys(hotkeySetter);
  } else if (locale === 'british') {
    addUKHotkeys(hotkeySetter);
  }
};

const LocalizationLine = ({ hotkeySetter }) => {
  const [localization, setLocalization] = useState(LOCALIZATION_OPTIONS[0]);

  const alternatives = [`hello, ${localization} anon.`];
  for (let option of LOCALIZATION_OPTIONS) {
    const onClick = () => {
      localize(hotkeySetter, option);
      setLocalization(option);
    };

    if (localization !== option) {
      alternatives.push(
        <TerminalButton key={option} onClick={onClick}>
          i'm {option}
        </TerminalButton>,
      );
    }
  }

  return <TerminalSpan children={alternatives} />;
};

export default (resourceManager, terminal) => {
  const { api, components } = synthComponent();

  api.terminal = terminal;
  api.resourceManager = resourceManager;
  api.storyContent = '';
  api.storyContainerRef = createRef();
  api.selection = useContainerSelection(api.storyContainerRef).api;
  api.storyNavigator = new HtmlNavigator(api.storyContainerRef);
  api.metaReplay = new MetaReplay();
  api.onLabelClicked = new RangeTreeMap();
  api.saveResource = null;

  const hotkeyListener = useHotkeyListener();
  api.hotkeyListener = hotkeyListener.api;

  const clipkeys = useClipkeys({ api });
  components.HotkeyDisplay = clipkeys.components.HotkeyDisplay;
  components.HotkeyModals = clipkeys.components.HotkeyModals;

  api.hotkeySetter = new StandardHotkeySetter(clipkeys);
  addUSHotkeys(api.hotkeySetter);

  // TODO: use the typical useX component for this so it behaves properly on clear
  const localizationLine = <LocalizationLine hotkeySetter={api.hotkeySetter} />;
  terminal.append(() => localizationLine);

  const bumpRelevantLogs = (range) => {
    for (let bumpLog of api.onLabelClicked.getAll(range)) {
      bumpLog();
    }
  };

  api.selection.clickSubscription.useSubscription(bumpRelevantLogs);

  const loadStoryContent = (content) => {
    api.storyContent = content;
    api.metaReplay = new MetaReplay();
    api.labelMap = new RangeTreeMap();
    api.terminal.clear();
    terminal.append(() => localizationLine);

    if (api.updateStoryDisplay) {
      api.updateStoryDisplay();
    }

    if (api.updateMetaDisplay) {
      api.updateMetaDisplay();
    }
  };

  const readTextFile = (resource) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(resource.content);
      reader.onload = resolve;
      reader.onerror = reject;
    });
  };

  useEffect(() => {
    const createProseView = (resource) => {
      api.currentResource = resource;
      api.storyContent = '';
      readTextFile(resource).then(({ target }) => loadStoryContent(target.result));
      return () => {
        useEffect(() => {
          const saveResource = () => {
            api.currentResource = resourceManager.updateResource(
              resource,
              getCurrentHtmlContent(),
            );
          };

          api.saveResource = saveResource;
          return () => {
            api.saveResource = null;
          };
        });

        return <HtmlResourceView taskContext={api} />;
      };
    };

    const createGreentextView = (resource) => {
      api.currentResource = resource;
      api.storyContent = '';
      readTextFile(resource).then(({ target }) => {
        loadStoryContent(target.result);
      });

      return () => {
        useEffect(() => {
          const saveResource = () => {
            api.currentResource = resourceManager.updateResource(
              resource,
              getCurrentGreenContent(),
            );
          };

          api.saveResource = saveResource;
          return () => {
            api.saveResource = null;
          };
        });

        return <GreentextResourceView taskContext={api} />;
      };
    };

    resourceManager.registerResourceHandler(
      'story/prose',
      createProseView,
      getCurrentHtmlContent,
    );
    resourceManager.registerResourceHandler(
      'story/greentext',
      createGreentextView,
      getCurrentGreenContent,
    );
    return () => {
      resourceManager.unregisterResourceHandler('story/prose', createProseView);
      resourceManager.unregisterResourceHandler(
        'story/greentext',
        createGreentextView,
      );
    };
  }, []);

  return {
    api,
    components,
    tabs: [
      {
        label: 'Story',
        panel: () => <MetaStateView taskContext={api} />,
      },
      {
        label: 'Hotkeys',
        panel: HotkeyPanel,
      },
    ],
  };
};
