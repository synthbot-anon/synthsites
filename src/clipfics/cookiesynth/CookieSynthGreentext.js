import React, { useEffect } from 'react';
import { Paper } from '@material-ui/core';
import sanitizeHtml from 'sanitize-html';
import { useClipficsContext } from 'tasks.js';
import {
  getCookieSynthOpenLabelType,
  getCookieSynthCloseLabelType,
  parseTags,
} from 'clipfics/cookiesynth/common.js';
import { reloadLabels } from 'clipfics/cookiesynth/CookieSynthLabel.js';

const greenToHtml = (greentext) => {
  if (!greentext) {
    return '';
  }

  const lines = greentext.split('\n');
  const div = document.createElement('div');
  const pendingLabels = new Map();

  lines.forEach((line) => {
    const p = document.createElement('p');

    parseTags(line).forEach((piece) => {
      if (piece[0] !== '[' || piece[piece.length - 1] !== ']') {
        const text = document.createTextNode(piece);
        p.appendChild(text);
        return;
      }

      const span = document.createElement('span');
      span.setAttribute('data-cookiesynth', piece);
      p.appendChild(span);
    });

    if (p.textContent.startsWith('>')) {
      p.setAttribute('class', 'u-greentext--green');
    }

    div.appendChild(p);
  });

  return div.innerHTML;
};

export const htmlToGreen = (node) => {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('[data-cookiesynth]').forEach((e) => {
    const textTag = e.dataset.cookiesynth;
    const textNode = document.createTextNode(textTag);
    e.replaceWith(textNode);
  });

  const textLines = [];
  clone.querySelectorAll('p').forEach((e) => {
    let textTag = e.textContent;
    if (textTag.endsWith('\n')) {
      textTag = textTag.substr(0, textTag.length - 1);
    }
    textLines.push(textTag);
  });

  // return clone.childNodes[0].nodeValue;
  return textLines.join("\n");
};

export default ({ children }) => {
  const clipfics = useClipficsContext();

  const div = document.createElement('div');
  div.innerHTML = greenToHtml(children);

  div.querySelectorAll('[data-cookiesynth-style]').forEach((e) => {
    e.replaceWith(...e.childNodes);
  });

  useEffect(() => reloadLabels(clipfics));

  return (
    <div
      ref={clipfics.api.storyContainerRef}
      id="js-story-sheet"
      dangerouslySetInnerHTML={{ __html: div.innerHTML }}
    />
  );
};
