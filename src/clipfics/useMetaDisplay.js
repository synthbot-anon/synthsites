class SortedTreeMap {
  rootKey;
  rootValue;
  preReference;
  postReference;
  comparisonMethod;
  parentReference;

  constructor(comparisonMethod, parent) {
    this.comparisonMethod = comparisonMethod;
    this.parentReference = parent;
  }

  set(key, value) {
    if (!this.rootKey) {
      this.rootKey = key;
      this.rootValue = value;
      this.preReference = new SortedTreeMap(this.comparisonMethod, this);
      this.postReference = new SortedTreeMap(this.comparisonMethod, this);
      return value;
    }

    const comparisonResult = this.comparisonMethod(this.rootKey, key);
    if (comparisonResult < 0) {
      return this.preReference.set(key, value);
    } else if (comparisonResult > 0) {
      return this.postReference.set(key, value);
    } else {
      const result = this.rootValue;
      this.rootValue = value;
      return result;
    }
  }

  getReference(key) {
    if (!this.rootKey) {
      return this;
    }

    const comparisonResult = this.comparisonMethod(this.rootKey, key);
    if (comparisonResult < 0) {
      return this.preReference.getReference(key);
    } else if (comparisonResult > 0) {
      return this.postReference.getReference(key);
    } else {
      return this;
    }
  }

  get(key) {
    const resultReference = this.getReference(key);
    return resultReference.rootValue;
  }

  getInfimumReference() {
    if (this.rootKey) {
      return this;
    }

    if (!this.parentReference) {
      // we're at the root, which is defined if anything is defined
      return this;
    }

    if (this === this.parentReference.postReference) {
      // we're the right child... return the left parent
      return this.parentReference;
    }

    // we're the left child... get the first left uncle
    let upperBound = this;
    while (upperBound.parentReference) {
      if (upperBound !== upperBound.parentReference.preReference) {
        return upperBound.parentReference;
      }

      upperBound = upperBound.parentReference;
    }

    return upperBound;
  }

  getPriorValues() {
    const upperReference = this;
    let lowerReference = this;

    // navigate to root
    while (lowerReference.parentReference) {
      lowerReference = lowerReference.parentReference;
    }

    // navigate to lowest child
    while (lowerReference.preReference) {
      lowerReference = lowerReference.preReference;
    }

    return new SortedTreeMapIterator(lowerReference, upperReference);
  }

  getPostValues() {
    const lowerReference = this;
    let upperReference = this;

    // navigate to root
    while (upperReference.parentReference) {
      upperReference = upperReference.parentReference;
    }

    // navigate to highest child
    while (upperReference.postReference) {
      upperReference = upperReference.postReference;
    }

    return new SortedTreeMapIterator(lowerReference, upperReference);
  }

  nextReference() {
    if (this.postReference) {
      // get the left-most of the right child
      let result = this.postReference;
      while (result.preReference) {
        result = result.preReference;
      }
      return result;
    }

    if (!this.parentReference) {
      // we've hit the root and have no next children
      return;
    }

    if (this === this.parentReference.preReference) {
      return this.parentReference;
    }

    // this must be a post-reference... look for the first post parent
    let result = this;

    do {
      if (!result.parentReference) {
        // hit the root without finding a post parent
        return;
      }

      if (result === result.parentReference.preReference) {
        // we're the left child, so the parent is next
        return result.parentReference;
      }

      // we're the post child, so keep looking for the post parent
      result = result.parentReference;
    } while (true);
  }
}

const compareRanges = (pre, post) => {
  //return pre.compareBoundaryPoints(Range.START_TO_START, post);
  return post - pre;
};

class MetaReplay {
  // range => (set of transitions, metastate cache)
  cachedMetaStates = new SortedTreeMap(compareRanges);

  constructor() {
    this.cachedMetaStates.rootValue = [[], new Map()];
  }

  set(range, transition) {
    if (transition.size === 0) {
      return;
    }

    const rangeReference = this.cachedMetaStates.getReference(range);

    if (rangeReference.rootKey) {
      // already have a cached state for this... just update it
      const [cachedTransitions, cachedState] = rangeReference.rootValue;
      cachedTransitions.add(transition);
      metaAssign(cachedState, transition);
    } else {
      // need to create a new cached state for this

      // start by cloning the prior one
      const priorStateReference = rangeReference.getInfimumReference();
      const newState = metaAssign(new Map(), priorStateReference.rootValue[1]);
      metaAssign(newState, transition);

      // remember the transitions created at this point
      const cachedTransitions = new Set();
      cachedTransitions.add(transition);

      // set the value for the current position
      rangeReference.set(range, [cachedTransitions, newState]);
    }

    // updated all subsequent cached states
    const remainingUpdates = metaAssign(new Map(), transition);
    for (let next of rangeReference.nextReference().getPostValues()) {
      const [cachedTransitions, cachedState] = next;

      // check if any updates are overridden
      for (let overrideTransition of cachedTransitions) {
        for (let [overrideTargetKey, overrideAssignmentKey] of metaTargetAssignments(
          overrideTransition,
        )) {
          if (
            !metaHasAssignment(
              remainingUpdates,
              overrideTargetKey,
              overrideAssignmentKey,
            )
          ) {
            continue;
          }

          // don't update overridden meta values
          remainingUpdates.get(overrideTargetKey).delete(overrideAssignmentKey);
          if (remainingUpdates.get(overrideTargetKey).size === 0) {
            remainingUpdates.delete(overrideTargetKey);
          }
        }
      }

      // add in the non-overridden values
      if (remainingUpdates.size === 0) {
        break;
      }
      metaAssign(cachedState, remainingUpdates);
    }
  }

  get(range) {
    const reference = this.cachedMetaStates.getReference(range).getInfimumReference();
    const [, metaState] = reference.rootValue;
    return metaState;
  }
}

const metaAssign = (priorState, transition) => {
  if (!transition) {
    return priorState;
  }

  for (let target of transition.keys()) {
    priorState.set(target, priorState.get(target) || new Map());
    const assignTarget = priorState.get(target);

    for (let [assignment, value] of transition.get(target)) {
      assignTarget.set(assignment, value);
    }
  }

  return priorState;
};

const metaHasAssignment = (meta, transitionKey, assignmentKey) => {
  if (!meta.has(transitionKey)) {
    return false;
  }

  if (!meta.get(transitionKey).has(assignmentKey)) {
    return false;
  }

  return true;
};

const metaTargetAssignments = (meta) => {
  const result = [];
  for (let [targetKey, targetValue] of meta) {
    for (let assignmentKey of targetValue.keys()) {
      result.push([targetKey, assignmentKey]);
    }
  }

  return result;
};

class SortedTreeMapIterator {
  lowerBound;
  upperBound;
  currentReference;

  constructor(lowerBound, upperBound) {
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.currentReference = lowerBound;

    this[Symbol.iterator] = () => this;
  }

  next() {
    if (this.currentReference === this.upperBound) {
      return { done: true };
    }

    const result = this.currentReference;
    this.currentReference = this.currentReference.nextReference();

    if (!result.rootKey) {
      return this.next();
    }

    return { done: false, value: result.rootValue };
  }
}

const ten = new Map()
  .set('hello', new Map().set('first', 'ten'))
  .set('world', new Map().set('first', 'ten'));
const eleven = new Map().set('hello', new Map().set('first', 'eleven'));
const nine = new Map().set(
  'hello',
  new Map().set('first', 'nine').set('second', 'nine'),
);

const replay = new MetaReplay();
replay.set(10, ten);
replay.set(11, eleven);
replay.set(9, nine);
console.log(replay.get(11));
