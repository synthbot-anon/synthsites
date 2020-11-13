import { useState } from 'react';

export default () => {
  const [counter, setCounter] = useState(0);

  const forceUpdate = () => {
    setCounter(counter + 1);
  };

  return { forceUpdate };
};
