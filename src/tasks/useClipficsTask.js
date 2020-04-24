import React, { useState, useContext, useEffect, createRef } from 'react';
import Hotkeys from 'common/Hotkeys.js';
import ContainerSelection from 'common/ContainerSelection.js';
import { MetaReplay } from 'clipfics/MetaReplay.js';
import HtmlNavigator from 'common/HtmlNavigator.js';
import CookieSynthHtml from 'clipfics/cookiesynth/CookieSynthHtml.js';
import CookieSynthGreentext, { htmlToGreen } from 'clipfics/cookiesynth/CookieSynthGreentext.js';
import { ThemeContext } from 'theme.js';
import useForceUpdate from 'common/useForceUpdate.js';
import { Grid } from '@material-ui/core';
import { MetaDisplay } from 'clipfics/MetaReplay.js';
import useClipkeys from 'clipfics/useClipkeys.js';

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
      <CookieSynthHtml className={classes['c-story-panel__paper']} >
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
      <CookieSynthGreentext className={classes['c-story-panel__paper']} >
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
  const { HotkeyDisplay, HotkeyModals, CreateHotkey } = useClipkeys();
  const { classes } = useContext(ThemeContext);

  return (
    <Grid container>
      <Grid item className={classes['c-controls--fill-width']}>
        <HotkeyDisplay />
        <CreateHotkey />
        <HotkeyModals />
      </Grid>
    </Grid>
  );
};

const getCurrentHtmlContent = () => {
  const storyData = document.getElementById('js-story-sheet').innerHTML;
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
}



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
    result.saveResource = null;

    return result;
  });

  taskContext.hotkeys.useHotkeyListener();

  const loadStoryContent = (content) => {
    taskContext.storyContent = content;
    taskContext.metaReplay = new MetaReplay();

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

  const createProseView = (resource) => {
    taskContext.currentResource = resource;
    readTextFile(resource).then(({ target }) => loadStoryContent(target.result));
    return () => {
      useEffect(() => {
        const saveResource = () => {
          taskContext.currentResource = resourceManager.update(
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
    readTextFile(resource).then(({ target }) => {
      loadStoryContent(target.result);
    });

    return () => {
      useEffect(() => {
        const saveResource = () => {
          taskContext.currentResource = resourceManager.update(
            resource,
            getCurrentGreenContent()
          );
        };

        taskContext.saveResource = saveResource;
        return () => {
          taskContext.saveResource = null;
        };
      });

      return <GreentextResourceView taskContext={taskContext} />;
    };
  };

  useEffect(() => {
    resourceManager.registerResourceHandler('story/prose', createProseView);
    resourceManager.registerResourceHandler('story/greentext', createGreentextView);
    return () => {
      resourceManager.unregisterResourceHandler('story/prose', createProseView);
      resourceManager.registerResourceHandler('story/greentext', createGreentextView);
    };
  });

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
