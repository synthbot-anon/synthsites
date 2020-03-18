import { useState } from 'react';

/**
 * Follow a UI flow that loops over an array. Expected usage:
 * 
 * Declare the control flow functions at the top of the parent React component:
 *   const { currentItem, hasNext, begin, moveToNext, terminate } = useLoopControls();
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
  let [currentArray, setCurrentArray] = useState();
  let [currentIndex, setCurrentIndex] = useState();
  let [currentItem, setCurrentItem] = useState();
  let [hasNext, setHasNext] = useState(false);

  let [resolveArray, setResolveArray] = useState();
  let [rejectArray, setRejectArray] = useState();

  const begin = (array) => {
    return new Promise((resolve, reject) => {
      if (array.length === 0) {
        resolve();
        return;
      }

      // retain callbacks for when the loop is complete
      resolveArray = resolve;
      setResolveArray(() => resolveArray);
      rejectArray = reject;
      setRejectArray(() => rejectArray);

      // initialize the loop
      setCurrentArray(currentArray = array);
      setHasNext(hasNext = true);
      setCurrentIndex(currentIndex = 0);
      setCurrentItem(currentItem = currentArray[0]);
    });
  }

  /**
   * Complete the loop with an error.
   */
  const terminate = () => {
    setHasNext(hasNext = false);
    rejectArray && rejectArray();
  }

  /**
   * Move to the next loop iteration.
   */
  const moveToNext = () => {
    if (!hasNext) {
      throw new Error('attempted to iterate past the end of the loop');
    }

    let newIndex = currentIndex + 1;

    if (newIndex >= currentArray.length) {
      // terminate the loop successfully
      setHasNext(hasNext = false);
      setCurrentIndex(currentIndex = newIndex);
      setCurrentItem(currentItem = null);
      resolveArray();
      return;
    }

    setCurrentIndex(currentIndex = newIndex);
    setCurrentItem(currentItem = currentArray[newIndex]);
  }

  return { currentItem, hasNext, begin, moveToNext, terminate };
}