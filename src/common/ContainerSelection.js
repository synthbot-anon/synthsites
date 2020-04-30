import { useEffect, useState } from 'react';

export default class ContainerSelection {
  #containerRef;

  constructor(containerRef) {
    this.#containerRef = containerRef;
  }

  useRange(allUpdates, f) {
    const [range, setRange] = useState(this.getRange());

    useEffect(() => {
      const listener = () => {
        const newRange = this.getRange();
        if (allUpdates || newRange) {
          setRange(newRange);
          if (f) {
            f(newRange);
          }
        }
      };

      document.addEventListener('selectionchange', listener);

      return () => {
        document.removeEventListener('selectionchange', listener);
      };
    });

    return range;
  }

  useClick(f) {
    const containerRef = this.#containerRef.current;

    useEffect(() => {
      const listener = () => {
        const newRange = this.getRange();
        if (newRange) {
          f(newRange);
        }
      }

      if (containerRef) {
        containerRef.addEventListener('click', listener);
      }

      return () => {
        if (containerRef) {
          containerRef.removeEventListener('click', listener);
        }
      };
    });
  }

  setRange(range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  getRange() {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (isRangeWithin(range, this.#containerRef.current)) {
      return range;
    }

    return null;
  }
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
  let [savedRange, setSavedRange] = useState(null);

  const saveSelection = () => {
    setSavedRange((savedRange = selection.getRange()));
  };

  const restoreSelection = () => {
    if (savedRange === null) {
      return;
    }

    selection.setRange(savedRange);
  };

  return { saveSelection, restoreSelection };
};
