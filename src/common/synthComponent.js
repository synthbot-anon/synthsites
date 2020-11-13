import React, { useRef, useEffect } from 'react';

export const synthSubscription = () => {
  const { api, internal } = synthComponent();

  internal.callbacks = [];

  const useSubscription = (cb) => {
    useEffect(() => {
      internal.callbacks.push(cb);

      return () => {
        internal.callbacks = internal.callbacks.filter((f) => f !== cb);
      };
    });
  };
  api.useSubscription = useSubscription;

  api.broadcast = (...args) => {
    internal.callbacks.forEach((f) => f(...args));
  };

  api.internal = internal;
  return api;
};

export const synthComponent = () => {
  const api = {};
  const components = {};
  const internal = {};

  return { api, components, internal };
};

export default synthComponent;
