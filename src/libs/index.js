// A signal/ effect implementation

// signal works well with the following
// - effect/auto-run/watch: This is a function that runs when the signal changes.
// - computed/derived: This is a function that returns a value based on the signal.
//
// A signal/ effect implementation

/**
 * @template TValue
 * @typedef {[
 *  () => TValue,
 *  (value: TValue) => void,
 * ]} SignalResult
 */

/** @type {(() => void)[]} */
let subscriberStack = [];
// Batching settings
let batchingEnabled = false;
/** @type {Set<() => void>} */
let pendingEffects = new Set();
// Memory management
const effectDependencies = new WeakMap();

/**
 * Run all pending effects that were collected during batching
 */
function runPendingEffects() {
  for (const effect of pendingEffects) {
    effect();
  }
  pendingEffects.clear();
}

/**
 * Runs a function with batching enabled, then processes all pending effects
 * @param {() => void} fn - Function to run in batch mode
 */
export function createSignalsBatch(fn) {
  const wasBatching = batchingEnabled;
  batchingEnabled = true;
  try {
    fn();
  } finally {
    if (!wasBatching) {
      batchingEnabled = false;
      runPendingEffects();
    }
  }
}

/**
 * Other names: observable, atom, subject, ref, event-emitters, pull-model, etc.
 *
 * @template TValue
 * @param {TValue} value
 * @return {SignalResult<TValue>}
 */
export function createSignal(value) {
  let subscribers = new Set();

  function getValue() {
    if (subscriberStack.length > 0) {
      const currentEffect = subscriberStack[subscriberStack.length - 1];
      subscribers.add(currentEffect);

      // Track that this effect depends on this signal
      if (!effectDependencies.has(currentEffect)) {
        effectDependencies.set(currentEffect, new Set());
      }

      // Store the signal’s subscriber set as the dependency
      effectDependencies.get(currentEffect).add(subscribers);
    }
    return value;
  }

  /** @param {TValue} newValue */
  function setValue(newValue) {
    if (value === newValue) return; // Optional optimization
    value = newValue;

    if (batchingEnabled) {
      // Queue effects to run later
      for (const listener of subscribers) {
        pendingEffects.add(listener);
      }
    } else {
      // Run effects immediately
      for (const listener of subscribers) {
        listener();
      }
    }
  }

  return [getValue, setValue];
}

/**
 * @param {() => void} fn
 * @returns {() => void} Cleanup function
 */
export function createEffect(fn) {
  // Create a stable effect function reference that won't change
  const effectFn = () => {
    // Cleanup previous subscriptions
    const deps = effectDependencies.get(effectFn);
    if (deps) {
      for (const dep of deps) {
        dep.delete(effectFn); // remove this effect from each signal’s subscribers
      }
      deps.clear();
    }

    subscriberStack.push(effectFn);
    try {
      fn();
    } finally {
      subscriberStack.pop();
    }
  };

  // Initial execution
  effectFn();

  // Return cleanup function
  return () => {
    const deps = effectDependencies.get(effectFn);
    if (deps) {
      for (const dep of deps) {
        dep.delete(effectFn); // ✅ Correct cleanup
      }
      effectDependencies.delete(effectFn);
    }
  };
}

/**
 * @template TValue
 * @param {() => TValue} fn
 * @returns {[...SignalResult<TValue>, () => void]}
 */
export function createComputed(fn) {
  const signalValue = createSignal(/** @type {TValue} */ (undefined));
  const cleanup = createEffect(() => {
    signalValue[1](fn());
  });

  // Return getter, setter, and cleanup function
  return [signalValue[0], signalValue[1], cleanup];
}
