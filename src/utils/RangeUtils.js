export default class RangeUtils {
  #startNode;
  #startOffset;
  #endNode;
  #endOffset;
  #startRange;

  constructor({ startContainer, startOffset, endContainer, endOffset }) {
    this.#startNode = startContainer;
    this.#startOffset = startOffset;
    this.#endNode = endContainer;
    this.#endOffset = endOffset;

    this.#startRange = new Range();
    this.#startRange.setStart(startContainer, startOffset);
    if (startContainer === endContainer) {
      this.#startRange.setEnd(endContainer, endOffset);
    } else {
      this.#startRange.setEndAfter(startContainer);
    }
  }

  apply(fn) {
    // apply to the left-most range
    fn(this.#startRange);

    // recursively move to siblings/uncles until the end is found

    if (this.#startNode === this.#endNode) {
      // found the end already, nothing left to do
      return;
    }

    let currentNode = this.#startNode;
    for (;;) {
      if (!currentNode.nextSibling) {
        currentNode = currentNode.parentNode;
        continue;
      }

      currentNode = currentNode.nextSibling;
      if (this.applyToLeaves(fn, currentNode)) {
        return;
      }
    }
  }

  applyToLeaf(fn, currentNode) {
    const currentRange = new Range();
    currentRange.setStartBefore(currentNode);

    if (currentNode !== this.#endNode) {
      currentRange.setEndAfter(currentNode);
      fn(currentRange);
      return false;
    }

    currentRange.setEnd(this.#endNode, this.#endOffset);
    fn(currentRange);
    return true;
  }

  applyToLeaves(fn, startNode) {
    const stack = [startNode];

    while (stack.length !== 0) {
      const currentNode = stack.pop();
      if (currentNode.childNodes.length === 0) {
        if (this.applyToLeaf(fn, currentNode)) {
          return true;
        }
      } else {
        for (let i = currentNode.childNodes.length-1; i >= 0; i--) {
          stack.push(currentNode.childNodes[i]);
        }
      }
    }

    return false;
  }
}

function highlightRange(range) {
    const newNode = document.createElement("div");
    newNode.setAttribute(
       "style",
       "background-color: yellow; display: inline;"
    );
    range.surroundContents(newNode);
}


export function highlightSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
  	return;
  }

  const selectionRange = selection.getRangeAt(0);
  const utils = new RangeUtils(selectionRange);
  utils.apply(highlightRange);
}
