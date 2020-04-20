/**
 * Utility functions for dealing with Range objects.
 */

/**
 * Wrap a Range object and treat it as a sequence of leaf nodes over a DOM tree.
 */
export default class RangeUtils {
  #range;
  #startNode;
  #startOffset;
  #endNode;
  #endOffset;
  #startingPoint;
  #endingPoint;
  #startRange;

  /**
   * @param Range object
   */
  constructor(range) {
    const { startContainer, startOffset, endContainer, endOffset } = range;

    this.#range = range;
    this.#startNode = startContainer;
    this.#startOffset = startOffset;
    this.#endNode = endContainer;
    this.#endOffset = endOffset;

    this.#endingPoint = new Range();
    this.#endingPoint.setStart(endContainer, endOffset);
    this.#endingPoint.setEnd(endContainer, endOffset);

    this.#startRange = new Range();
    this.#startRange.setStart(startContainer, startOffset);
    if (startContainer === endContainer) {
      this.#startRange.setEnd(endContainer, endOffset);
    } else {
      this.#startRange.setEndAfter(startContainer);
    }
  }

  scrollIntoView() {
    const span = document.createElement('span');
    span.id = '__synth_selection';
    this.#startRange.insertNode(span);
    span.scrollIntoView(false);
    span.parentNode.removeChild(span);
  }

  prepend(node) {
    this.#startRange.insertNode(node);
  }

  append(node) {
    this.#endingPoint.insertNode(node);
  }

  /**
   * Apply a function to each DOM leaf node within this range.
   * @param fn (leafRangeObject) => {...}
   */
  apply(fn) {
    const leafNodes = [];
    const uncheckedNodes = [this.#range.commonAncestorContainer];
    console.log('ancestor:', this.#range.commonAncestorContainer);

    while (uncheckedNodes.length !== 0) {
      const nextNode = uncheckedNodes.pop();

      if (!nextNode.childNodes) {
        leafNodes.push(nextNode);
        continue;
      }

      if (nextNode.childNodes.length === 0) {
        leafNodes.push(nextNode);
        continue;
      }

      for (let childNode of nextNode.childNodes) {
        uncheckedNodes.push(childNode);
      }
    }

    const leafRange = new Range();
    leafNodes.forEach((leaf) => {
      leafRange.selectNode(leaf);
      if (this.#range.compareBoundaryPoints(Range.END_TO_START, leafRange) === 1) {
        return;
      }
      if (this.#range.compareBoundaryPoints(Range.START_TO_END, leafRange) === -1) {
        return;
      }

      const resultRange = new Range();
      try {
        if (
          this.#range.compareBoundaryPoints(Range.START_TO_START, leafRange) === -1
        ) {
          resultRange.setStart(leafRange.startContainer, leafRange.startOffset);
        } else {
          resultRange.setStart(this.#range.startContainer, this.#range.startOffset);
        }

        if (this.#range.compareBoundaryPoints(Range.END_TO_END, leafRange) === -1) {
          resultRange.setEnd(this.#range.endContainer, this.#range.endOffset);
        } else {
          resultRange.setEnd(leafRange.endContainer, leafRange.endOffset);
        }
      } catch (e) {
        console.log(e);
      }

      fn(resultRange);
    });
  }

  compareTo(otherRange, how) {
    return this.#range.compareBoundaryPoints(how, otherRange);
  }

  /**
   * Return the text contents within range, optionally limiting the number of
   * characters returned. If the contents don't fit within the limit, the middle
   * characters are replaced with an ellipsis.
   *
   * @param startChars Optional parameter to limit the number of leading characters.
   * @param endChars Parameter to limit the number of ending characters returned. This
   * must be provided iff startChars is provided.
   */
  getText(startChars, endChars) {
    const div = document.createElement('div');
    div.appendChild(this.#range.cloneContents());
    const contents = div.textContent;

    if (!startChars) {
      return contents;
    }

    if (!endChars) {
      throw new Error('cannot use startChars without endChars');
    }

    // start + end + ellipsis length
    const maxChars = startChars + endChars + 3;

    if (contents.length <= maxChars) {
      return contents;
    }

    const contentStart = contents.slice(0, startChars).replace(/\s+$/, '');
    const contentEnd = contents.slice(-endChars).replace(/^\s+/, '');
    return `${contentStart}...${contentEnd}`;
  }

  setSelection(containerSelection) {
    containerSelection.setRange(this.#range);
  }
}
