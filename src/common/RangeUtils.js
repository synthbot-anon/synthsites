/**
 * Utility functions for dealing with Range objects.
 */

/**
 * Wrap a Range object and treat it as a sequence of leaf nodes over a DOM tree.
 */
export default class RangeUtils {
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
  constructor({ startContainer, startOffset, endContainer, endOffset }) {
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
    // apply to the left-most range
    fn(this.#startRange);

    // recursively move to siblings/uncles until the end is found

    if (this.#startNode === this.#endNode) {
      // found the end already, nothing left to do
      return;
    }

    // apply fn to every leaf node right of the #startNode
    let currentNode = this.#startNode;
    for (;;) {
      if (currentNode.nextSibling) {
        // apply to the next sibling and continue
        currentNode = currentNode.nextSibling;
        if (this.applyToLeaves(fn, currentNode)) {
          // reach the end node, so don't continue
          return;
        }
      } else {
        // done applying to siblings... move up to parent and repeat
        currentNode = currentNode.parentNode;
      }
    }
  }

  /**
   * Apply a function to a single leaf DOM node.
   * @param fn (leafRangeObject) => {...}
   * @param currentNode leaf DOM node
   * @returns true iff this node is the last node within the range
   */
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

  /**
   * Apply a function to all leaf nodes under a DOM node.
   * @param fn (leafRangeObject) => {...}
   * @param startNode
   * @returns true iff the last node within the range is a child of startNode
   */
  applyToLeaves(fn, startNode) {
    const stack = [startNode];

    while (stack.length !== 0) {
      const currentNode = stack.pop();
      if (currentNode.childNodes.length === 0) {
        if (this.applyToLeaf(fn, currentNode)) {
          return true;
        }
      } else {
        for (let i = currentNode.childNodes.length - 1; i >= 0; i--) {
          stack.push(currentNode.childNodes[i]);
        }
      }
    }

    return false;
  }
}
