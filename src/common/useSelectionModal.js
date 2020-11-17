import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '@material-ui/core';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';
import { ThemeContext } from 'theme.js';
import RangeUtils from 'common/RangeUtils.js';

const addOverlay = (rect) => {
  const div = document.createElement("div");
  const cssText = `
    background-color:#c8c8c848;
    color:#000;
    position:absolute;
    top:${rect.top}px;
    left:${rect.left}px;
    width:${rect.width}px;
    height:${rect.height}px;
  `;

  div.style.cssText = cssText;
  document.body.appendChild(div);

  return div;
};

export default () => {
  const { api, components, internal } = synthComponent();

  internal.displaySubscription = synthSubscription();
  internal.highlightNodes = [];
  api.cancelSubscription = synthSubscription();

  api.showModal = (range) => {
    internal.highlightNodes.forEach((n) => n.replaceWith(...n.childNodes));

    // get the first (top-left) rectangle
    let rect;
    for (let domRect of range.getClientRects()) {
      internal.highlightNodes.push(addOverlay(domRect));

      if (!rect) {
        rect = domRect;
      } else if (domRect.top < rect.top) {
        rect = domRect;
      } else if (domRect.top === rect.top) {
        if (domRect.left < rect.left) {
          rect = domRect;
        }
      }
    }

    const style = { position: 'fixed' };

    const breakpointX = window.innerWidth / 2;
    const breakpointY = window.innerHeight / 2;

    if (rect.top <= breakpointY) {
      style.top = rect.top + rect.height;
    } else {
      style.bottom = `calc(100vh - ${rect.top}px)`;
    }

    if (rect.left <= breakpointX) {
      style.left = rect.left;
    } else {
      style.right = `calc(100vw - ${rect.left}px)`;
    }

    // const rangeUtils = new RangeUtils(range);
    // rangeUtils.apply((range) => {
    //   const highlighter = document.createElement('span');
    //   highlighter.style.cssText = 'background-color:#c8c8c8;color:#000';
      
    //   range.surroundContents(highlighter);
    //   internal.highlightNodes.push(highlighter);
    // });

    internal.style = style;
    internal.displaySubscription.broadcast(true);
  };

  api.hideModal = () => {
    internal.highlightNodes.forEach((n) => n.replaceWith(...n.childNodes));
    internal.displaySubscription.broadcast(false, {});
  };

  const Display = ({ children }) => {
    const { classes } = useContext(ThemeContext);
    const [open, setOpen] = useState(false);

    internal.displaySubscription.useSubscription((visible) => {
      setOpen(visible);
    });

    return (
      <Modal open={open} onClose={() => api.cancelSubscription.broadcast()}>
        <div style={internal.style} className={classes['c-labelmodal__container']} children={children} />
      </Modal>
    );
  };
  components.Display = Display;

  return { api, components };
};
