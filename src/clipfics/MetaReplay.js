import React, { useEffect, useContext } from 'react';
import { useClipfics } from 'tasks.js';
import TitledBox from 'common/TitledBox';
import { splitAssignment } from './cookiesynth/common.js';
import { Typography } from '@material-ui/core';
import useForceUpdate from 'common/useForceUpdate.js';
import { ThemeContext } from 'theme.js';

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

  /**
   * TODO: balance this tree
   */
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

    const comparisonResult = this.comparisonMethod(key, this.rootKey);
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

    return;
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

    return new SortedTreeMapIterator(lowerReference, upperReference, true);
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

  priorReference() {
    if (this.preReference) {
      // get the right-most of the left child
      let result = this.preReference;
      while (result.postReference) {
        result = result.postReference;
      }
      return result;
    }

    if (!this.parentReference) {
      return;
    }

    if (this === this.parentReference.postReference) {
      return this.parentReference;
    }

    // this must be a pre-reference... look for the first pre parent
    let result = this;

    do {
      if (!result.parentReference) {
        return;
      }

      if (result === result.parentReference.postReference) {
        return result.parentReference;
      }

      result = result.parentReference;
    } while (true);
  }
}

class SortedTreeMapIterator {
  bound;
  currentReference;
  reverse;

  constructor(lowerBound, upperBound, reverse) {
    this.reverse = reverse;
    this.currentReference = reverse ? upperBound : lowerBound;
    this.bound = reverse ? lowerBound : upperBound;

    this[Symbol.iterator] = () => this;
  }

  next() {
    if (this.currentReference === this.bound) {
      return { done: true };
    }

    const result = this.currentReference;
    this.currentReference = this.reverse
      ? this.currentReference.priorReference()
      : this.currentReference.nextReference();

    if (!result.rootKey) {
      return this.next();
    }

    return { done: false, value: result };
  }
}

const compareRanges = (pre, post) => {
  return pre.compareBoundaryPoints(Range.START_TO_START, post);
};

export class MetaReplay {
  // range => (set of transitions, metastate cache)
  cachedMetaStates = new SortedTreeMap(compareRanges);
  #onUpdateCallbacks = [];

  constructor() {
    this.cachedMetaStates.rootValue = [[], new Meta()];
  }

  registerOnUpdate(callback) {
    this.#onUpdateCallbacks.push(callback);
  }

  unregisterOnUpdate(callback) {
    this.#onUpdateCallbacks = this.#onUpdateCallbacks.filter((x) => x !== callback);
  }

  /**
   * Specify that a meta update should happen at a given point.
   *
   * @param range Location from which to apply the meta update
   * @param transition Map of { target => {prop => value} } updates to apply
   */
  add(range, meta) {
    if (meta.targets.size === 0) {
      return;
    }

    const rangeReference = this.cachedMetaStates.getReference(range);

    if (rangeReference.rootKey) {
      // already have a cached state for this... just update it
      const [cachedTransitions, cachedState] = rangeReference.rootValue;
      cachedTransitions.add(meta);
      Meta.assign(cachedState, meta);
    } else {
      // need to create a new cached state for this

      // start by cloning the prior one
      const priorStateReference = rangeReference.getPriorValues().next().value;
      const priorMeta = priorStateReference && priorStateReference.rootValue[1];
      const newState = Meta.assign(new Meta(), priorMeta);
      Meta.assign(newState, meta);

      // remember the meta transitions created at this point
      const cachedTransitions = new Set();
      cachedTransitions.add(meta);

      // set the value for the current position
      rangeReference.set(range, [cachedTransitions, newState]);
    }

    // updated all subsequent cached states
    const remainingUpdates = Meta.assign(new Meta(), meta);
    for (let next of rangeReference.nextReference().getPostValues()) {
      const [cachedTransitions, cachedState] = next.rootValue;

      // check if any updates are overridden
      for (let overrideTransition of cachedTransitions) {
        for (let [overrideTargetKey, overrideAssignProp] of overrideTransition) {
          // don't update overridden meta values
          remainingUpdates.delete(overrideTargetKey, overrideAssignProp);
        }
      }

      // add in the non-overridden values
      if (remainingUpdates.targets.size === 0) {
        break;
      }
      Meta.assign(cachedState, remainingUpdates);
    }

    this.#onUpdateCallbacks.forEach((f) => f());
  }

  remove(range, meta) {
    const rangeReference = this.cachedMetaStates.getReference(range);
    const [cachedTransitions, cachedState] = rangeReference.rootValue;

    // remove the meta from the tree
    cachedTransitions.delete(meta);

    // figure out what the new current state should be
    const reverseIterator = rangeReference.getPriorValues();
    reverseIterator.next(); // current value
    const priorReference = reverseIterator.next().value;
    const priorMeta = priorReference && priorReference.rootValue[1];

    const newMeta = Meta.assign(new Meta(), priorMeta);
    for (let remainingTransition of cachedTransitions) {
      Meta.assign(newMeta, remainingTransition);
    }

    // add it to the tree
    Meta.replace(cachedState, newMeta);

    // forward propagate the changes

    // these are the values that need to be replaced
    // once these are all overridden, we can stop updating future meta values
    const remainingUpdates = Meta.assign(new Meta(), meta);
    const runningMeta = Meta.assign(new Meta(), cachedState);

    for (let next of rangeReference.nextReference().getPostValues()) {
      // figure out what updates were applied at this point
      const [cachedTransitions] = next.rootValue;

      // apply those updates to the runnning state
      for (let overrideTransition of cachedTransitions) {
        Meta.assign(runningMeta, overrideTransition);
        for (let [overrideTargetKey, overrideAssignProp] of overrideTransition) {
          // keep track of how many updates are still relevant
          remainingUpdates.delete(overrideTargetKey, overrideAssignProp);
        }
      }

      // apply the updates to the current node
      next.rootValue = [cachedTransitions, Meta.assign(new Meta(), runningMeta)];

      // we can stop once there are no more relevant updates
      if (remainingUpdates.targets.size === 0) {
        break;
      }
    }

    this.#onUpdateCallbacks.forEach((f) => f());
  }

  get(range) {
    const reference = this.cachedMetaStates.getReference(range).getInfimumReference();
    if (!reference) {
      return;
    }

    const [, metaState] = reference.rootValue;
    return metaState;
  }

  getLabelValue(range, prop, value, relevantMeta, knownObjects) {
    if (!knownObjects) {
      knownObjects = new Map();
    }

    const assignmentKey = `${prop}="${value}"`;

    if (knownObjects.has(assignmentKey)) {
      return knownObjects.get(assignmentKey);
    }

    const result = new Map().set('id', value);
    knownObjects.set(assignmentKey, result);

    if (!relevantMeta) {
      relevantMeta = this.get(range);
    }

    if (relevantMeta.has(assignmentKey)) {
      for (let [, value] of relevantMeta.get(assignmentKey)) {
        result.set(
          prop,
          this.getLabelValue(range, prop, value, relevantMeta, knownObjects),
        );
      }
    }
  }
}

export class Meta {
  targets = new Map();

  constructor(assignments) {
    Meta.assignMap(this, assignments);
    this[Symbol.iterator] = this.iterator;
  }

  *iterator() {
    for (let [targetKey, assignments] of this.targets) {
      for (let [assignKey, assignment] of assignments) {
        yield [targetKey, assignKey, assignment];
      }
    }
  }

  /**
   * @param targetKey Assignment key specifying when the assignments apply
   * @param newAssigmnets iterable of Assignment objects
   */
  set(targetKey, prop, value) {
    let currentAssignments = this.targets.get(targetKey) || new Map();
    this.targets.set(targetKey, currentAssignments);
    currentAssignments.set(prop, value);
  }

  get(targetKey, prop) {
    if (!this.targets.has(targetKey)) {
      return;
    }

    return this.targets.get(targetKey).get(prop);
  }

  delete(targetKey, assignmentProp) {
    if (!this.hasAssignment(targetKey, assignmentProp)) {
      return;
    }

    this.targets.get(targetKey).delete(assignmentProp);
    if (this.targets.get(targetKey).size === 0) {
      this.targets.delete(targetKey);
    }
  }

  hasAssignment(targetKey, prop) {
    if (!this.targets.has(targetKey)) {
      return false;
    }

    if (!this.targets.get(targetKey).has(prop)) {
      return false;
    }

    return true;
  }

  static assign(prior, newMeta) {
    if (!newMeta) {
      return prior;
    }

    Meta.assignMap(prior, newMeta.targets);
    return prior;
  }

  static assignMap(prior, targets) {
    if (!targets) {
      return prior;
    }

    for (let newTargetKey of targets.keys()) {
      const assignTarget = prior.targets.get(newTargetKey) || new Map();
      prior.targets.set(newTargetKey, assignTarget);

      for (let [newAssignProp, newAssign] of targets.get(newTargetKey)) {
        assignTarget.set(newAssignProp, newAssign);
      }
    }

    return prior;
  }

  static replace(prior, newMeta) {
    prior.targets = new Map();
    Meta.assign(prior, newMeta);
  }

  static dump(tag, meta) {
    for (let [targetKey, assignProp, assignmentValue] of meta) {
      console.log(`${tag}:`, targetKey, assignProp, assignmentValue);
    }
  }
}

export const MetaDisplay = () => {
  const clipfics = useClipfics();
  const { forceUpdate } = useForceUpdate();
  const { classes } = useContext(ThemeContext);

  useEffect(() => {
    const onReplayUpdated = () => {
      forceUpdate();
    };
    clipfics.metaReplay.registerOnUpdate(onReplayUpdated);

    return () => {
      clipfics.metaReplay.unregisterOnUpdate(onReplayUpdated);
    };
  });

  const range = clipfics.selection.useRange();
  if (!range) {
    return <div className={classes['c-metareplay-box']} />;
  }

  const meta = clipfics.metaReplay.get(range);
  if (!meta) {
    return <div className={classes['c-metareplay-box']} />;
  }

  const sortedMetaData = new Map();
  for (let [targetKey, prop, value] of meta) {
    const targetMeta = sortedMetaData.get(targetKey) || new Map();
    sortedMetaData.set(targetKey, targetMeta);

    targetMeta.set(prop, value);
  }

  const requiredBoxes = [];
  sortedMetaData.forEach((data, targetKey) => {
    const [keyType, keyValue] = splitAssignment(targetKey);
    const requiredData = [];
    data.forEach((value, prop) => {
      requiredData.push(
        <Typography className={classes['c-metareplay-box__assignment']} key={prop}>
          {value} | {prop}
        </Typography>,
      );
    });

    requiredBoxes.push(
      <TitledBox
        className={classes['u-title-box--compact']}
        key={targetKey}
        title={`${keyValue} | ${keyType}`}
        children={requiredData}
      />,
    );
  });

  return <div className={classes['c-metareplay-box']} children={requiredBoxes} />;
};
