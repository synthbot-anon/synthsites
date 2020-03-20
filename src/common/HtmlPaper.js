import React from 'react';
import { Paper } from '@material-ui/core';
import sanitizeHtml from 'sanitize-html';

// Panel used to display an HTML story.
export default ({ children, ...other }) => {
  const sanitizedHtml = customSanitizeHtml(children);
  return <Paper {...other} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
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
      'iframe',
    ],
    disallowedTagsMode: 'discard',
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src'],
      span: ['data-cookiesynth', 'style'],
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
