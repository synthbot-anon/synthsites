import React, { useRef, useEffect, useContext } from 'react';
import useForceUpdate from 'common/useForceUpdate.js';
import FileImportButton from 'common/FileImportButton.js';
import local from './local.js';
import { Button, Grid } from '@material-ui/core';
import { ThemeContext } from 'theme.js';

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
    a.download = `labeled - ${name}`;
    a.click();
  };
  return (
    <Button className={classes['c-fileio-export-button']} onClick={download}>
      Export labels
    </Button>
  );
};

class ResourceManager {
  terminal;
  resourceView = () => <div />;
  onNewResourceLoaded;
  resourceHandlers = new Map();
  focusedResource;

  constructor(terminal) {
    this.terminal = terminal;
  }

  registerResourceHandler(type, createResourceView) {
    const typeHandlers = this.resourceHandlers.get(type) || [];
    this.resourceHandlers.set(type, typeHandlers);

    typeHandlers.push(createResourceView);
  }

  unregisterResourceHandler(type, createResourceView) {
    let typeHandlers = this.resourceHandlers.get(type);
    typeHandlers = typeHandlers.filter((x) => x !== createResourceView);
    this.current.resourceHandlers.set(type, typeHandlers);
    // TODO: check if the current resource display uses this type
    // if yes, then clear it
  }

  loadResource(resource) {
    const handler = this.resourceHandlers.get(resource.type)[0];

    if (typeof resource === 'number') {
      // TODO: if someone provides a key, load the corresponding resource
      throw new Error('not implemented');
    } else {
      this.resourceView = handler(resource);
      this.onNewResourceLoaded();
      this.focusedResource = resource;
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

    resourceEntry.promise = local.storeFile(resourceEntry);
    return resourceEntry;
  }
}

export default (terminal) => {
  const resourceManager = useRef(new ResourceManager(terminal));

  const ResourcePane = () => {
    const { forceUpdate } = useForceUpdate();

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
            return resourceManager.current.focusedResource;
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
