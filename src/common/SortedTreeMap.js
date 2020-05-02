// TODO: replace this with a modified version of https://github.com/mourner/rbush

export default class SortedTreeMap {
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