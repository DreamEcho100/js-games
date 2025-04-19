/*
// **
//  * Creates a reactive object where each property is a signal.
//  * @template {Record<string, any>} TObject
//  * @param {TObject} obj
//  * @returns {TObject}
//  *
export function reactive(obj) {
  const reactiveObj = {};

  Object.keys(obj).forEach((key) => {
    const [getValue, setValue] = createSignal(obj[key]);

    // Create getter and setter for each property
    Object.defineProperty(reactiveObj, key, {
      get() {
        return getValue();
      },
      set(newValue) {
        setValue(newValue);
      },
    });
  });

  return reactiveObj;
}

*/

/*
// **
//  * Creates a reactive object where each property is a signal.
//  * @template {Record<string, any>} TObject
//  * @param {TObject} obj
//  * @returns {TObject}
//  /
export function reactive(obj) {
  const reactiveObj = {};

  // Iterate over each property in the object
  Object.keys(obj).forEach((key) => {
    const [getValue, setValue] = createSignal(obj[key]);

    // Create getter and setter for each property
    Object.defineProperty(reactiveObj, key, {
      get() {
        return getValue();
      },
      set(newValue) {
        setValue(newValue);
      },
    });
  });

  return reactiveObj;
}


*/
// Add onCleanup() to effects
// Add computed().value with caching
// Add reactive() (object with reactive props)

// Batching DOM updates (e.g., on setTodos, if multiple effects run, group them via queueMicrotask or a flush() utility).

// Scoped disposal – make effects unregister if an element no longer exists (like auto-cleanup when navigating).

// **Reactive html\`` helper** like JSX-lite: html`<div>${signal}</div>`` auto-subscribes.

// Diffing todoList items by createdAt for keyed rendering so it doesn't blow away the whole list.

/**
 * @template TValue
 * @typedef {[
 *  () => TValue,
 *  (value: TValue) => void,
 * ]} SignalResult
 */

/** @type {(() => void)|null} */
let subscriber = null;
let batchingEnabled = false;
const batchedEffects = new Set();

/**
 * Other names: observable, atom, subject, ref, event-emitters, pull-model, etc.
 *
 * @template TValue
 * @param {TValue} value
 * @return {SignalResult<TValue>}
 */
export function createSignal(value) {
  /** @type {Set<(value: TValue) => void>} */
  const subscribers = new Set();

  function getValue() {
    if (subscriber) {
      subscribers.add(subscriber);
    }

    return value;
  }

  /** @param {TValue} newValue */
  function setValue(newValue) {
    if (Object.is(value, newValue)) return; // Avoid re-triggering

    value = newValue;

    if (batchingEnabled) {
      for (const subscriber of subscribers) {
        batchedEffects.add(() => subscriber(value));
      }
      return;
    }

    for (const subscriber of subscribers) {
      subscriber(value);
    }
  }

  return [getValue, setValue];
}

/** @param {() => void} fn */
export function createEffect(fn) {
  // subscriber = fn;
  // fn();
  // subscriber = null;

  const cleanupCallbacks = new Set();

  // Wrap the effect to allow cleanup before execution
  const effect = () => {
    // Cleanup previous effects
    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }

    // Reset cleanup callbacks for next execution
    cleanupCallbacks.clear();

    subscriber = effect;
    fn(); // Execute the effect

    subscriber = null;
  };

  // Return a function to register cleanup callbacks
  /** @param {() => void} callback */
  effect.onCleanup = (callback) => {
    cleanupCallbacks.add(callback);
  };

  effect(); // Initial execution
}

/**
 * @template TValue
 * @param {() => TValue} fn
 * @returns {SignalResult<TValue>}
 */
export function createComputed(fn) {
  const signalValue = createSignal(/** @type {TValue} */ (undefined));
  createEffect(() => {
    signalValue[1](fn());
  });
  return signalValue;
}

/**
 * Run all pending effects that were collected during batching
 */
function runBatchedEffects() {
  for (const effect of batchedEffects) {
    effect();
  }
  batchedEffects.clear();
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

      // Run batched effects regardless of previous batching state
      runBatchedEffects();

      // Restore previous batching state if needed
      batchingEnabled = wasBatching;
    }
  }
}
