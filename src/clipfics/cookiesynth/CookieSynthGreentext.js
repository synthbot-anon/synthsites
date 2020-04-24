import React, { useEffect } from 'react';
import { Paper } from '@material-ui/core';
import sanitizeHtml from 'sanitize-html';
import { useClipfics } from 'tasks.js';
import {
  getCookieSynthOpenLabelType,
  getCookieSynthCloseLabelType,
  parseTags,
} from 'clipfics/cookiesynth/common.js';
import { reloadLabels } from 'clipfics/cookiesynth/CookieSynthLabel.js';

const greenToHtml = (greentext) => {
  if (!greentext) {
    return "";
  }

  const lines = greentext.split('\n');
  const div = document.createElement('div');
  const pendingLabels = new Map();

  lines.forEach((line) => {
    const p = document.createElement('p');
    if (line.startsWith('>')) {
      p.setAttribute('class', 'u-greentext--green');
    }

    parseTags(line).forEach((piece) => {
      if (line[0] !== '[' || line[line.length - 1] !== ']') {
        const text = document.createTextNode(piece);
        p.appendChild(text);
        return;
      }

      const span = document.createElement('span');
      span.setAttribute('data-cookiesynth', piece);
      p.appendChild(span);
    });

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

  clone.querySelectorAll('p').forEach((e) => {
    const textTag = e.textContent;
    const textNode = document.createTextNode(`${textTag}\n`);
    e.replaceWith(textNode);
  });

  return clone.innerHTML;
}

export default ({ children }) => {
  const clipfics = useClipfics();

  const div = document.createElement('div');
  div.innerHTML = greenToHtml(children);

  div.querySelectorAll('[data-cookiesynth-style]').forEach((e) => {
    e.replaceWith(...e.childNodes);
  });

  useEffect(() => reloadLabels(clipfics));

  return (
    <Paper
      ref={clipfics.storyContainerRef}
      id="js-story-sheet"
      dangerouslySetInnerHTML={{ __html: div.innerHTML }}
    />
  );

}