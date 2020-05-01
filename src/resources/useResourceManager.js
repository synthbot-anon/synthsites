import React, { useRef, useEffect, useContext } from 'react';
import useForceUpdate from 'common/useForceUpdate.js';
import FileImportButton from 'common/FileImportButton.js';
import local from './local.js';
import { Button, Grid } from '@material-ui/core';
import { ThemeContext } from 'theme.js';

const EXTENSION = '([^.]+)'
const SUFFIX = '(?:\\s*\\(\\d*\\)\\s*)?'
const PREFIX = '(?:label(?:ed|s)?(?:\\s*[-_]*\\s*))?';
const FILENAME = '[^(.]*';
const FILENAME_REGEX = new RegExp(`^${PREFIX}(${FILENAME})${SUFFIX}\\.(${EXTENSION})$`);

/**
 * Button to export a labeled story file, which is not what it does at the moment.
 * This currently highlights the selected text. Note that this will highlight ANY
 * text selected on the page, not just story text.
 */
const FileExportButon = ({ getDownloadBlob }) => {
  const { classes } = useContext(ThemeContext);

  const download = () => {
    const { name, content } = getDownloadBlob();
    const a = document.createElement('a');
    a.setAttribute('href', window.URL.createObjectURL(content));

    const match = FILENAME_REGEX.exec(name);

    if (match) {
      const [,fileName, extension] = match;
      a.download = `labeled - ${fileName.trim()}.${extension.trim()}`;
    } else {
      a.download = `labeled - ${name}`;
    }

    a.click();
  };
  return (
    <Button className={classes['c-fileio-export-button']} variant="contained" component="span" onClick={download}>
      Export labels
    </Button>
  );
};

class ResourceManager {
  terminal;
  resourceView = () => <div />;
  onNewResourceLoaded;
  resourceHandlers = new Map();
  getResourceState;

  constructor(terminal) {
    this.terminal = terminal;
  }

  registerResourceHandler(type, createResourceView, getLatestResourceState) {
    const typeHandlers = this.resourceHandlers.get(type) || [];
    this.resourceHandlers.set(type, typeHandlers);

    typeHandlers.push([createResourceView, getLatestResourceState]);
  }

  unregisterResourceHandler(type, createResourceView) {
    let typeHandlers = this.resourceHandlers.get(type);
    typeHandlers = typeHandlers.filter((x) => x[0] !== createResourceView);
    this.current.resourceHandlers.set(type, typeHandlers);
    // TODO: check if the current resource display uses this type
    // if yes, then clear it
  }

  loadResource(resource) {
    const [handler, getResourceState] = this.resourceHandlers.get(resource.type)[0];

    if (typeof resource === 'number') {
      // TODO: if someone provides a key, load the corresponding resource
      throw new Error('not implemented');
    } else {
      this.resourceView = handler(resource);
      this.onNewResourceLoaded();
      this.getResourceState = () => {
        return { name: resource.name, content: getResourceState() };
      };
    }
  }

  updateResource(resourceEntry, content) {
    resourceEntry.promise.then((key) => {
      const newEntry = {
        name: resourceEntry.name,
        content: content,
        source: resourceEntry.source,
        type: resourceEntry.type,
      };

      newEntry.promise = local.updateFile(key, newEntry);
      return newEntry;
    });
  }

  storeFileResource(f) {
    this.terminal.log(`loading ${f.name}...`);
    let type;

    if (f.type === 'text/html') {
      type = 'story/prose';
    } else if (f.type === 'text/plain') {
      type = 'story/greentext';
    }

    if (!type) {
      this.terminal.log(
        `I don't recognize the file extension for ${f.name}. I only recognize html (fimfiction) and txt (greentext) files.`,
      );
      return;
    }

    const resourceEntry = {
      name: f.name,
      content: f,
      source: 'filesystem',
      type,
    };

    //resourceEntry.promise = local.storeFile(resourceEntry);
    return resourceEntry;
  }

  listResources() {
    local.listFiles();
  }
}

const Display = ({ resourceManager }) => {};

export default (terminal) => {
  const resourceManager = useRef(new ResourceManager(terminal));

  const ResourcePane = () => {
    const { forceUpdate } = useForceUpdate();

    if (local.database) {
      resourceManager.current.listResources();
    }

    useEffect(() => {
      resourceManager.current.onNewResourceLoaded = forceUpdate;

      return () => {
        resourceManager.current.onNewResourceLoaded = null;
      };
    });

    const ResourceView = resourceManager.current.resourceView;
    return <ResourceView />;
  };

  const ResourceManagerPanel = () => {
    return (
      <Grid container>
        <FileImportButton
          onFilesLoaded={(files) => {
            let entries = Array.from(files).map((x) =>
              resourceManager.current.storeFileResource(x),
            );

            entries = entries.filter((x) => x);
            if (!entries[0]) {
              return;
            }

            resourceManager.current.loadResource(entries[0]);
          }}
        />
        <FileExportButon
          getDownloadBlob={() => {
            return resourceManager.current.getResourceState();
          }}
        />
      </Grid>
    );
  };

  const tabs = [
    {
      label: 'Resources',
      panel: ResourceManagerPanel,
    },
  ];

  return { ResourcePane, resourceManager: resourceManager.current, tabs };
};
