class StateTransition {
  trigger;
  priorState;
  newState;
  callback;

  constructor(priorState, trigger, newState, callback) {
    this.priorState = priorState;
    this.trigger = trigger;
    this.newState = newState;
    this.callback = callback;
  }

  invoke() {
    if (this.callback) {
      this.callback();
    }
  }
}

class State {
  name;
  transitions = {};

  constructor(name) {
    this.name = name;
  }
}

export default class StateMachine {
  start;
  state;

  constructor() {
    this.start = new State("start");
    this.state = this.start;
  }

  addState(name) {
    return new State(name);
  }

  registerTransition(priorState, trigger, newState, callback) {
    if (trigger in priorState.transitions) {
      throw `transition already registered from ${priorState.name} via ${trigger}`;
    }

    const result = new StateTransition(priorState, trigger, newState, callback);
    priorState.transitions[trigger] = result;

    return result;
  }

  unregisterTransition(transition) {
    delete transition.priorState.transitions[transition.trigger];
  }

  transition(trigger) {
    const transition = this.state.transitions[trigger];
    if (!transition) {
      return false;
    }

    transition.invoke();
    this.state = transition.newState;
  }
}
