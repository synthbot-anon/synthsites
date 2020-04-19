import React, { createRef, useEffect } from 'react';
import { Paper } from '@material-ui/core';
import sanitizeHtml from 'sanitize-html';
import { useClipfics } from 'tasks.js';
import {
  getCookieSynthOpenLabelType,
  getCookieSynthCloseLabelType,
} from 'clipfics/cookiesynth/common.js';
import CookieSynthLabel from 'clipfics/cookiesynth/CookieSynthLabel.js';
import { getSectionOffset } from 'common/HtmlNavigator.js';
import RangeUtils from 'common/RangeUtils.js';

const reloadLabels = (clipfics) => {
  const { terminal, metaReplay } = clipfics;
  const div = clipfics.storyContainerRef.current;
  const pendingLabels = new Map();

  div.querySelectorAll('[data-cookiesynth]').forEach((e) => {
    let label = e.dataset.cookiesynth;
    if (label.length === 0) {
      return;
    }

    if (label[0] !== '[' || label[label.length - 1] !== ']') {
      terminal.log('invalid label:', label);
      return;
    }

    label = label.substring(1, label.length - 1);

    const openLabelType = getCookieSynthOpenLabelType(label);
    if (openLabelType) {
      if (openLabelType === 'meta') {
        const range = new Range();
        range.setStartAfter(e);
        range.setEndBefore(e);
        e.parentNode.removeChild(e);
        new CookieSynthLabel(range, label).injectLabel(clipfics);
        return;
      }
      const typeStack = pendingLabels.get(openLabelType) || [];
      pendingLabels.set(openLabelType, typeStack);
      typeStack.push([label, e]);
      return;
    }

    const closeLabelType = getCookieSynthCloseLabelType(label);
    if (closeLabelType) {
      const typeStack = pendingLabels.get(closeLabelType);
      const [label, start] = typeStack.pop();
      const range = new Range();

      console.log((start.parentNode.childNodes, start));

      const indexOf = Array.prototype.indexOf;

      const startContainer = start.nextSibling;
      const startOffset = 0;
      start.parentNode.removeChild(start);

      const endContainer = e.previousSibling;
      const endOffset = endContainer.length;
      e.parentNode.removeChild(e);


      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      // const utils = new RangeUtils(range);
      // const labelRange = utils.fixRange();
      
      new CookieSynthLabel(range, label).injectLabel(clipfics);
      return;
    }

    terminal.log('invalid label:', label);
  });
};

// Panel used to display an HTML story.
export default ({ children, ...other }) => {
  const sanitizedHtml = customSanitizeHtml(children);
  const clipfics = useClipfics();

  const div = document.createElement('div');
  div.innerHTML = sanitizedHtml;

  div.querySelectorAll('[data-cookiesynth-style]').forEach((e) => {
    e.replaceWith(...e.childNodes);
  });

  useEffect(() => reloadLabels(clipfics));

  return (
    <Paper
      ref={clipfics.storyContainerRef}
      id="js-story-sheet"
      {...other}
      dangerouslySetInnerHTML={{ __html: div.innerHTML }}
    />
  );
};

const customSanitizeHtml = (html) => {
  // default options plus h1, h2, and hr
  return sanitizeHtml(html, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'blockquote',
      'p',
      'a',
      'ul',
      'ol',
      'nl',
      'li',
      'b',
      'i',
      'strong',
      'em',
      'span',
      'strike',
      'code',
      'hr',
      'br',
      'div',
      'table',
      'thead',
      'caption',
      'tbody',
      'tr',
      'th',
      'td',
      'pre',
    ],
    disallowedTagsMode: 'discard',
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      span: ['data-cookiesynth', 'data-cookiesynth-style'],
    },
    selfClosing: [
      'img',
      'br',
      'hr',
      'area',
      'base',
      'basefont',
      'input',
      'link',
      'meta',
    ],
    allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    allowProtocolRelative: true,
  });
};
