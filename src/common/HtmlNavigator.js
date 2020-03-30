const TEXT_TYPES = new Set([
  Node.TEXT_NODE,
  Node.COMMENT_NODE,
  Node.CDATA_SECTION_NODE,
]);

const SECTION_NAMES = new Set(['P', 'H1', 'H2', 'H3']);

const normalizeQuotes = (text) => {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
};

export default class HtmlNavigator {
  #currentPosition;
  #containerRef;

  constructor(containerRef) {
    this.#containerRef = containerRef;
  }

  isNodeContained(node) {
    return this.#containerRef.current.contains(node);
  }

  getContainingSection(node) {
    if (!this.isNodeContained(node)) {
      return null;
    }

    let result = node;
    while (!SECTION_NAMES.has(result.nodeName)) {
      result = result.parentNode;
      if (!this.isNodeContained(result)) {
        return null;
      }
    }

    return result;
  }

  /**
   * Return the adjacent, non-empty section.
   *
   * This turns a (node) => adjacentNode function into a (node) => adjacentSection
   * function.
   *
   * @param startingNode
   * @param getNextCandidate (node) => adjacentNode
   */
  getNextSection(startingNode, getNextCandidate) {
    if (!this.isNodeContained(startingNode)) {
      return null;
    }

    const section = this.getContainingSection(startingNode);
    let nextCandidate = getNextCandidate(section || startingNode);

    while (!this.getContainingSection(nextCandidate)) {
      nextCandidate = getNextCandidate(nextCandidate);
      if (!this.isNodeContained(nextCandidate)) {
        return null;
      }
    }

    const result = this.getContainingSection(nextCandidate);
    if (result.textContent.length !== 0) {
      return result;
    }

    return this.getNextSection(result, getNextCandidate);
  }

  /**
   * Returns the section that includes the next section edge.
   *
   * If the next section edge is covered by the provided selection, this returns the
   * next adjacent section. Otherwise it returns the section that covers the provided
   * section.
   *
   * @param selectedNode The selection node closest to the relevant section edge
   * @param selectedOffset The selection offset closest to the relevant section edge
   * @param getSectionEdge (section) => { node, offset } should yield the comparison
   * edge position for the the input section.
   * @param shiftPosition (node) => adjacentNode, should probably be shiftLeft or
   * shiftRight.
   */

  getNextEdgeSection({ selectedNode, selectedOffset, getSectionEdge, shiftNode }) {
    if (!this.isNodeContained(selectedNode)) {
      return null;
    }

    const currentSection = this.getContainingSection(selectedNode);
    const result = new Range();

    if (currentSection) {
      // if there are contents remaining in the section, return the current section
      const { node: endNode, offset: endOffset } = getSectionEdge(currentSection);
      const startSectionOffset = getSectionOffset(
        currentSection,
        selectedNode,
        selectedOffset,
      );
      const endSectionOffset = getSectionOffset(currentSection, endNode, endOffset);

      if (startSectionOffset !== endSectionOffset) {
        result.selectNodeContents(currentSection);
        return result;
      }
    }

    // return the next paragraph
    const nextSection = this.getNextSection(selectedNode, shiftNode);
    if (!nextSection) {
      // we've reached the end of the container
      return null;
    }

    result.selectNodeContents(nextSection);
    return result;
  }

  getNextSectionRange(initialRange) {
    return this.getNextEdgeSection({
      selectedNode: initialRange.endContainer,
      selectedOffset: initialRange.endOffset,
      getSectionEdge: getSectionEnd,
      shiftNode: nextRight,
    });
  }

  getPrevSectionRange(initialRange) {
    return this.getNextEdgeSection({
      selectedNode: initialRange.startContainer,
      selectedOffset: initialRange.startOffset,
      getSectionEdge: getSectionStart,
      shiftNode: nextLeft,
    });
  }

  getNextRegexRange(initialRange, regex) {
    let { endContainer: startContainer, endOffset: startOffset } = initialRange;
    let section = this.getContainingSection(startContainer);
    let { node: endContainer, offset: endOffset } = getSectionEnd(section);
    let startSectionOffset = getSectionOffset(section, startContainer, startOffset);

    while (true) {
      const matches = getRegexMatchesInRange(
        regex,
        startContainer,
        startOffset,
        endContainer,
        endOffset,
      );

      if (matches.length !== 0) {
        const match = matches[0];
        return getSectionRangeFromMatch(section, startSectionOffset, match);
      }

      section = this.getNextSection(startContainer, nextRight);
      startSectionOffset = 0;

      ({ startContainer, startOffset, endContainer, endOffset } = getSectionRange(
        section,
      ));
    }
  }

  getPrevRegexRange(initialRange, regex) {
    let { startContainer: endContainer, startOffset: endOffset } = initialRange;
    let section = this.getContainingSection(endContainer);
    let { node: startContainer, offset: startOffset } = getSectionStart(section);
    let startSectionOffset = 0;

    while (true) {
      const matches = getRegexMatchesInRange(
        regex,
        startContainer,
        startOffset,
        endContainer,
        endOffset,
      );

      if (matches.length !== 0) {
        const match = matches[matches.length - 1];
        return getSectionRangeFromMatch(section, startSectionOffset, match);
      }

      section = this.getNextSection(startContainer, nextLeft);
      startSectionOffset = 0;

      ({ startContainer, startOffset, endContainer, endOffset } = getSectionRange(
        section,
      ));
    }
  }
}

const getRegexMatchesInRange = (regex, startNode, startOffset, endNode, endOffset) => {
  const testRange = new Range();
  testRange.setStart(startNode, startOffset);
  testRange.setEnd(endNode, endOffset);

  const div = document.createElement('div');
  div.appendChild(testRange.cloneContents());

  const text = normalizeQuotes(div.textContent);
  const matches = text.matchAll(regex);

  return Array.from(matches);
};

const getSectionRangeFromMatch = (section, startSectionOffset, match) => {
  const { node: startNode, offset: startOffset } = getSectionNode(
    section,
    match.index + startSectionOffset,
  );
  const { node: endNode, offset: endOffset } = getSectionNode(
    section,
    match.index + match[0].length + startSectionOffset,
  );

  const result = new Range();
  result.setStart(startNode, startOffset);
  result.setEnd(endNode, endOffset);

  return result;
};

const leftMost = (node) => {
  if (node.childNodes.length === 0) {
    return node;
  }

  return leftMost(node.childNodes[0]);
};

const rightMost = (node) => {
  const numChildren = node.childNodes.length;
  if (numChildren === 0) {
    return node;
  }

  return rightMost(node.childNodes[numChildren - 1]);
};

const nextRight = (node) => {
  if (node.nextSibling) {
    return leftMost(node.nextSibling);
  }

  return leftMost(nextRight(node.parentNode));
};

const nextLeft = (node) => {
  if (node.previousSibling) {
    return rightMost(node.previousSibling);
  }

  return rightMost(nextLeft(node.parentNode));
};

/**
 * Get the section text offset given a section, a node within that section, and an
 * offset within that node. This uses JavaScript's Range conventions for node
 * (container) and offset.
 *
 * @param section The section from which to calculate offsets.
 * @param node The container node.
 * @param offset Character offset if node is of type Text, Comment, or CDataSection.
 * Child node index otherwise.
 */
const getSectionOffset = (section, node, offset) => {
  let runningOffset = 0;
  let currentNode = leftMost(section);

  while (!node.contains(currentNode)) {
    runningOffset += currentNode.textContent.length;
    currentNode = nextRight(currentNode);
  }

  // Text, Comments, and CDataSections use character offsets
  if (TEXT_TYPES.has(node.nodeType)) {
    return runningOffset + offset;
  }

  // everything else uses child offsets
  for (let i = 0; i < offset; i++) {
    runningOffset += node.childNodes[i].textContent.length;
  }

  return runningOffset;
};

const getSectionEnd = (section) => {
  const lastNode = rightMost(section);
  return {
    node: lastNode,
    offset: lastNode.textContent.length,
  };
};

const getSectionStart = (section) => {
  return {
    node: section,
    offset: 0,
  };
};

/**
 * Get the container and offset associated with a section text offset.
 *
 * @param section Node that contains the relevant text.
 * @param textOffset Character offset within the node's text.
 * @return { node, nodeOffset } usable within a Range
 */
const getSectionNode = (section, textOffset) => {
  let currentNode = leftMost(section);
  let remainingOffset = textOffset;

  while (remainingOffset > currentNode.textContent.length) {
    remainingOffset -= currentNode.textContent.length;
    currentNode = nextRight(currentNode);
  }

  return {
    node: currentNode,
    offset: remainingOffset,
  };
};

const getSectionRange = (section) => {
  const { node: startNode, offset: startOffset } = getSectionStart(section);
  const { node: endNode, offset: endOffset } = getSectionEnd(section);

  const result = new Range();
  result.setStart(startNode, startOffset);
  result.setEnd(endNode, endOffset);

  return result;
};
