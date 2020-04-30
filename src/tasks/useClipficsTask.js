import React, { useState, useContext, useEffect, createRef } from 'react';
import Hotkeys from 'common/Hotkeys.js';
import ContainerSelection from 'common/ContainerSelection.js';
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
import { useClipfics } from 'tasks.js';

const HtmlResourceView = ({ taskContext }) => {
  console.log('loading resource view');
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
  console.log('loading resource view');
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

const StoryFocusTracker = () => {
  const clipfics = useClipfics();

  const bumpRelevantLogs = (range) => {
    for (let bumpLog of clipfics.onLabelClicked.getAll(range)) {
      bumpLog();
    }
  };

  clipfics.selection.useClick(bumpRelevantLogs);

  return null;
};

const HotkeyPanel = () => {
  const { HotkeyDisplay, HotkeyModals, CreateHotkey } = useClipkeys();
  const { classes } = useContext(ThemeContext);

  return (
    <Grid container>
      <Grid item className={classes['c-controls--fill-width']}>
        <HotkeyDisplay />
        <CreateHotkey />
        <HotkeyModals />
        <StoryFocusTracker />
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

export default (resourceManager, terminal) => {
  const [taskContext] = useState(() => {
    const result = {};
    result.terminal = terminal;
    result.resourceManager = resourceManager;
    result.hotkeys = new Hotkeys();
    result.storyContent = '';

    const storyContainerRef = createRef();
    result.storyContainerRef = storyContainerRef;
    result.selection = new ContainerSelection(storyContainerRef);
    result.storyNavigator = new HtmlNavigator(storyContainerRef);
    result.metaReplay = new MetaReplay();
    result.onLabelClicked = new RangeTreeMap();
    result.saveResource = null;

    return result;
  });

  taskContext.hotkeys.useHotkeyListener();

  const loadStoryContent = (content) => {
    taskContext.storyContent = content;
    taskContext.metaReplay = new MetaReplay();
    taskContext.labelMap = new RangeTreeMap();
    taskContext.terminal.clear();

    if (taskContext.updateStoryDisplay) {
      taskContext.updateStoryDisplay();
    }

    if (taskContext.updateMetaDisplay) {
      taskContext.updateMetaDisplay();
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
      taskContext.currentResource = resource;
      taskContext.storyContent = '';
      readTextFile(resource).then(({ target }) => loadStoryContent(target.result));
      return () => {
        useEffect(() => {
          const saveResource = () => {
            taskContext.currentResource = resourceManager.updateResource(
              resource,
              getCurrentHtmlContent(),
            );
          };

          taskContext.saveResource = saveResource;
          return () => {
            taskContext.saveResource = null;
          };
        });

        return <HtmlResourceView taskContext={taskContext} />;
      };
    };

    const createGreentextView = (resource) => {
      taskContext.currentResource = resource;
      taskContext.storyContent = '';
      readTextFile(resource).then(({ target }) => {
        loadStoryContent(target.result);
      });

      return () => {
        useEffect(() => {
          const saveResource = () => {
            taskContext.currentResource = resourceManager.updateResource(
              resource,
              getCurrentGreenContent(),
            );
          };

          taskContext.saveResource = saveResource;
          console.log('loading saveResource as:', saveResource);
          return () => {
            taskContext.saveResource = null;
            console.log('unloading saveResource');
          };
        });

        return <GreentextResourceView taskContext={taskContext} />;
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
      resourceManager.unregisterResourceHandler('story/greentext', createGreentextView);
    };
  }, []);

  return {
    taskContext,
    tabs: [
      {
        label: 'Story',
        panel: () => <MetaStateView taskContext={taskContext} />,
      },
      {
        label: 'Hotkeys',
        panel: HotkeyPanel,
      },
    ],
  };
};
