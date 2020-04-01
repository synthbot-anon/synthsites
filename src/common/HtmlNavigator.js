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
    if (this.isNodeContained(result) && result.textContent.length !== 0) {
      return result;
    }

    return this.getNextSection(result, getNextCandidate);
  }

  getInitialRange() {
    const startNode = leftMost(this.#containerRef.current);
    const result = new Range();
    result.setStart(startNode, 0);
    result.setEnd(startNode, 0);
    return result;
  }

  getNextSectionRange(initialRange) {
    const result = new Range();

    const nextSection = this.getNextSection(initialRange.startContainer, nextRight);
    if (!nextSection) {
      return null;
    }

    result.selectNodeContents(nextSection);
    return result;
  }

  getPrevSectionRange(initialRange) {
    const result = new Range();

    const nextSection = this.getNextSection(initialRange.endContainer, nextLeft);
    if (!nextSection) {
      return null;
    }

    result.selectNodeContents(nextSection);
    return result;
  }

  getNextRegexRange(initialRange, regex) {
    let section = this.getContainingSection(initialRange.endContainer);
    let testRange = new Range();
    testRange.setStart(initialRange.endContainer, initialRange.endOffset);

    if (section) {
      // if there's remaining text in the current section, handle that
      const { node: endContainer, offset: endOffset } = getSectionEnd(section);
      testRange.setEnd(endContainer, endOffset);
      const matches = getRegexMatchesInRange(regex, testRange);

      if (matches.length !== 0) {
        const match = matches[0];
        const startSectionOffset = getSectionOffset(
          section,
          testRange.startContainer,
          testRange.startOffset,
        );
        return getSectionRangeFromMatch(section, startSectionOffset, match);
      }
    }

    // loop over subsequent sections and check for a match
    for (;;) {
      section = this.getNextSection(testRange.startContainer, nextRight);
      if (!section) {
        return null;
      }

      testRange = getSectionRange(section);
      const matches = getRegexMatchesInRange(regex, testRange);
      if (matches.length !== 0) {
        return getSectionRangeFromMatch(section, 0, matches[0]);
      }
    }
  }

  getPrevRegexRange(initialRange, regex) {
    let section = this.getContainingSection(initialRange.startContainer);
    let testRange = new Range();
    testRange.setEnd(initialRange.startContainer, initialRange.startOffset);

    if (section) {
      // if there's preceeding text in the current section, handle that
      const { node: startContainer, offset: startOffset } = getSectionStart(section);
      testRange.setStart(startContainer, startOffset);
      const matches = getRegexMatchesInRange(regex, testRange);

      if (matches.length !== 0) {
        const match = matches[matches.length - 1];
        return getSectionRangeFromMatch(section, 0, match);
      }
    }

    // loop over preceeding sections and check for a match
    for (;;) {
      section = this.getNextSection(testRange.endContainer, nextLeft);
      if (!section) {
        return null;
      }

      testRange = getSectionRange(section);
      const matches = getRegexMatchesInRange(regex, testRange);

      if (matches.length !== 0) {
        const match = matches[matches.length - 1];
        return getSectionRangeFromMatch(section, 0, match);
      }
    }
  }

  getNextPhrase(initialRange, regex) {
    let section = this.getContainingSection(initialRange.endContainer);
    let testRange = initialRange;

    if (section) {
      testRange = getSectionRange(section);
      const matches = getRegexMatchesInRange(regex, testRange);
      let endSectionOffset = getSectionOffset(
        section,
        initialRange.endContainer,
        initialRange.endOffset,
      );

      for (let match of matches) {
        if (match.index > endSectionOffset) {
          const result = getSectionRangeFromMatch(section, 0, match);
          return result;
        }
      }
    }

    for (;;) {
      section = this.getNextSection(testRange.endContainer, nextRight);
      if (!section) {
        return null;
      }

      testRange = getSectionRange(section);
      const matches = getRegexMatchesInRange(regex, testRange);

      if (matches.length !== 0) {
        return getSectionRangeFromMatch(section, 0, matches[0]);
      }
    }
  }

  getPreviousPhrase(initialRange, regex) {
    let section = this.getContainingSection(initialRange.startContainer);
    let testRange = initialRange;

    if (section) {
      testRange = getSectionRange(section);
      const matches = getRegexMatchesInRange(regex, testRange);
      let startSectionOffset = getSectionOffset(
        section,
        initialRange.startContainer,
        initialRange.startOffset,
      );

      for (let match of matches.reverse()) {
        if (match.index + match[0].length <= startSectionOffset) {
          return getSectionRangeFromMatch(section, 0, match);
        }
      }
    }

    for (;;) {
      section = this.getNextSection(testRange.startContainer, nextLeft);
      if (!section) {
        return null;
      }

      testRange = getSectionRange(section);
      const matches = getRegexMatchesInRange(regex, testRange);

      if (matches.length !== 0) {
        const match = matches[matches.length - 1];
        return getSectionRangeFromMatch(section, 0, match);
      }
    }
  }
}

const getRegexMatchesInRange = (regex, testRange) => {
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
