import { useState } from 'react';
import synthComponent, { synthSubscription } from 'common/synthComponent.js';

export default () => {
  const { api, internal } = synthComponent();

  api.isModalOpen = false;
  internal.subscription = synthSubscription();

  api.openModal = () => {
    api.isModalOpen = true;
    internal.subscription.broadcast();
  };

  api.closeModal = () => {
    api.isModalOpen = false;
    internal.subscription.broadcast();
  };

  api.useSubscription = internal.subscription.useSubscription;

  return { api };
};
