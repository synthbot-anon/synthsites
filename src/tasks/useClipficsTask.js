import React, { useState, useContext, useEffect, createRef } from 'react';
import Hotkeys from 'common/Hotkeys.js';
import ContainerSelection from 'common/ContainerSelection.js';
import { MetaReplay } from 'clipfics/MetaReplay.js';
import HtmlNavigator from 'common/HtmlNavigator.js';
import CookieSynthPaper from 'clipfics/cookiesynth/CookieSynthPaper.js';
import { ThemeContext } from 'theme.js';
import useForceUpdate from 'common/useForceUpdate.js';
import { Grid } from '@material-ui/core';
import { MetaDisplay } from 'clipfics/MetaReplay.js';
import useClipkeys from 'clipfics/useClipkeys.js';

const ResourceView = ({ taskContext }) => {
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
      <CookieSynthPaper className={classes['c-story-panel__paper']}>
        {taskContext.storyContent}
      </CookieSynthPaper>
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

export default (terminal) => {
  const [resource, setResource] = useState();
  const [taskContext] = useState(() => {
    const result = {};
    result.hotkeys = new Hotkeys();
    result.terminal = terminal;
    result.storyContent = 'Load a story';

    const storyContainerRef = createRef();
    result.storyContainerRef = storyContainerRef;
    result.selection = new ContainerSelection(storyContainerRef);
    result.storyNavigator = new HtmlNavigator(storyContainerRef);
    result.metaReplay = new MetaReplay();

    return result;
  });

  taskContext.hotkeys.useHotkeyListener();

  const loadResource = (resource) => {
    taskContext.storyContent = resource;
    taskContext.metaReplay = new MetaReplay();

    if (taskContext.updateStoryDisplay) {
      taskContext.updateStoryDisplay();
    }

    if (taskContext.updateMetaDisplay) {
      taskContext.updateMetaDisplay();
    }
  };

  return {
    taskContext,
    loadResource,
    ResourceView: () => <ResourceView taskContext={taskContext} />,
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
