import useForLoop from 'common/useForLoop.js';
import synthComponent from 'common/synthComponent.js';

export default () => {
  const { api, internal } = synthComponent();

  internal.forLoop = useForLoop().api;

  api.forEach = (array, fn) => {
    const result = internal.forLoop.begin(array);
    
    const moveToNext = () => {
      internal.forLoop.moveToNext();

      if (internal.forLoop.hasNext) {
        api.currentItem = internal.forLoop.currentItem;
        fn(moveToNext);
      }
    }

    if (internal.forLoop.hasNext) {
      api.currentItem = internal.forLoop.currentItem;
      fn(moveToNext);
    }

    return result;
  }

  api.terminate = internal.forLoop.terminate;
  return { api };
}