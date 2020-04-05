import { useState } from 'react';

export default (f) => {
  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    f();
    setInitialized(true);
  }
};
