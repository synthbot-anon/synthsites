import synthComponent, { synthSubscription } from 'common/synthComponent.js';

/**
 * Follow a UI flow that loops over an array. Expected usage:
 * 
 * Declare the control flow functions at the top of the parent React component:
 *   const { currentItem, hasNext, begin, moveToNext, terminate } = useForLoop();
 * Call begin() to begin the loop:
 *    begin(arrayItemsToLoopOver);
 * Use hasNext and currentItem to display the relevant UI:
 *    <SingleItemHandler visible={hasNext} value={currentItem} ... />
 * Once done with the current item, move to the next item with moveToNext():
 *    <SingleItemHandler ... onComplete={moveToNext} ... />
 * Abort the loop using terminate():
 *    <SingleItemHandler ... onError={terminate} />
 * Handle any final steps and cleanup with the promise returned from begin():
 *    begin(...).then(...).catch(...);
 */ 
export default () => {
  const { api, internal } = synthComponent();

  internal.resolveArray = null;
  internal.rejectArray = null;
  internal.subscription = synthSubscription();
  
  api.currentArray = null;
  api.currentIndex = null;
  api.currentItem = null;
  api.hasNext = false;
  api.useSubscription = internal.subscription.useSubscription;

  api.begin = (array) => {
    return new Promise((resolve, reject) => {
      if (array.length === 0) {
        resolve();
        internal.subscription.broadcast();
        return;
      }

      // retain callbacks for when the loop is complete
      internal.resolveArray = resolve;
      internal.rejectArray = reject;

      // initialize the loop
      api.currentArray = array;
      api.hasNext = true;
      api.currentIndex = 0;
      api.currentItem = array[0];
      internal.subscription.broadcast();

    });
  }

  /**
   * Complete the loop with an error.
   */
  api.terminate = (error) => {
    if (!api.hasNext) {
      return;
    }
    
    api.hasNext = false;
    internal.rejectArray && internal.rejectArray(error);
    internal.subscription.broadcast();
  }

  /**
   * Move to the next loop iteration.
   */
  api.moveToNext = () => {
    if (!api.hasNext) {
      throw new Error('attempted to iterate past the end of the loop');
    }

    let newIndex = api.currentIndex + 1;

    if (newIndex >= api.currentArray.length) {
      // terminate the loop successfully
      api.hasNext = false;
      api.currentIndex = newIndex;
      api.currentItem = null;
      internal.resolveArray();
      internal.subscription.broadcast();
      return;
    }

    api.currentIndex = newIndex;
    api.currentItem = api.currentArray[newIndex];
    internal.subscription.broadcast();
  }

  return { api };
}
