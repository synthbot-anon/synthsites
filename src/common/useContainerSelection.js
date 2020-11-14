import { useEffect, useState } from 'react';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';

export default (containerRef) => {
  const { api, internal } = synthComponent();

  api.rangeSubscription = synthSubscription();
  api.clickSubscription = synthSubscription();

  useEffect(() => {
    const listener = () => {
      const newRange = api.getRange();
      if (newRange) {
        api.rangeSubscription.broadcast(newRange);
      }
    };

    document.addEventListener('selectionchange', listener);

    return () => {
      document.removeEventListener('selectionchange', listener);
    };
  });

  useEffect(() => {
    const listener = () => {
      const newRange = api.getRange();
      if (newRange) {
        api.clickSubscription.broadcast(newRange);
      }
    }

    document.addEventListener('click', listener);

    return () => {
      document.removeEventListener('click', listener);
    };
  });

  api.setRange = (range) => {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  api.getRange = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (isRangeWithin(range, containerRef.current)) {
      return range;
    }

    return null;
  }

  return { api };
}

const isRangeWithin = (selectionRange, container) => {
  if (!selectionRange || !container) {
    return false;
  }

  const startNode = selectionRange.startContainer;
  const endNode = selectionRange.endContainer;

  if (!container.contains(startNode)) {
    return false;
  }

  if (!container.contains(endNode)) {
    return false;
  }

  return true;
};

export const useSelectionCache = (selection) => {
  const { api } = synthComponent();
  api.savedRange = null;

  api.saveSelection = () => {
    api.savedRange = selection.getRange();
  };

  api.restoreSelection = () => {
    if (api.savedRange === null) {
      return;
    }

    selection.setRange(api.savedRange);
  };

  return { api };
};
