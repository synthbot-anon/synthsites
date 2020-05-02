import SortedTreeMap from './SortedTreeMap.js';

const compareRangeStarts = (pre, post) => {
  return pre.compareBoundaryPoints(Range.START_TO_START, post);
};

const compareRangeEnds = (pre, post) => {
  return pre.compareBoundaryPoints(Range.END_TO_END, post);
};

export default class RangeTreeMap {
  startTreeMap;
  endTreeMap;

  constructor() {
    this.startTreeMap = new SortedTreeMap(compareRangeStarts);
    this.endTreeMap = new SortedTreeMap(compareRangeEnds);
  }

  add(range, value) {
    addToMap(this.startTreeMap, range, value);
    addToMap(this.endTreeMap, range, value);
  }

  remove(range, value) {
    removeFromMap(this.startTreeMap, range, value);
    removeFromMap(this.endTreeMap, range, value);
  }

  getAll(range) {
    const startBefore = [];
    const endAfter = new Set();

    const startReference = this.startTreeMap.getReference(range);
    for (let priorReference of startReference.getPriorValues()) {
      priorReference.rootValue.forEach((x) => startBefore.push(x));
    }

    const endReference = this.endTreeMap.getReference(range);
    for (let postReference of endReference.getPostValues()) {
      postReference.rootValue.forEach((x) => endAfter.add(x));
    }

    const intersection = startBefore.filter((x) => endAfter.has(x));
    return intersection;
  }
}

const addToMap = (map, range, value) => {
  const reference = map.getReference(range);
  if (reference.rootKey) {
    const knownValues = reference.rootValue;
    knownValues.add(value);
  } else {
    const valueSet = new Set();
    valueSet.add(value);
    reference.set(range, valueSet);
  }
}

const removeFromMap = (map, range, value) => {
  const reference = map.getReference(range);
  const knownValues = reference.rootValue;
  knownValues.delete(value);
}