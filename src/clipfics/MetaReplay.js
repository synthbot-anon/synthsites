import React, { useEffect, useContext } from 'react';
import { useClipfics } from 'tasks.js';
import TitledBox from 'common/TitledBox';
import { splitAssignment } from './cookiesynth/common.js';
import { Typography, Link } from '@material-ui/core';
import useForceUpdate from 'common/useForceUpdate.js';
import { ThemeContext } from 'theme.js';
import SortedTreeMap from 'common/SortedTreeMap.js';


const compareRanges = (pre, post) => {
  return pre.compareBoundaryPoints(Range.START_TO_START, post);
};

export default class MetaReplay {
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

  getAssignmentRange(range, prop) {
    const reference = this.cachedMetaStates.getReference(range);
    for (const priorReference of reference.getPriorValues()) {
      const range = priorReference.rootKey;
      const [transitions] = priorReference.rootValue

      for (let transitionMeta of transitions) {
        Meta.dump('checking transition', transitionMeta);
        if (transitionMeta.targets.has(prop)) {
          return range;
        }
      }
    }
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

    const bumpRelevantLog = () => {
      const relevantRange = clipfics.metaReplay.getAssignmentRange(range, targetKey);
      clipfics.onLabelClicked.getAll(relevantRange).forEach((f) => f());
    }

    data.forEach((value, prop) => {
      requiredData.push(
        <Typography className={classes['c-metareplay-box__assignment']} key={prop}>
          <Link href="#" onClick={bumpRelevantLog} color="inherit">
          {value} | {prop}
          </Link>
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
