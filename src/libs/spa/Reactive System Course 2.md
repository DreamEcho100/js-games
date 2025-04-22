# 🧠 Build Your Own Reactive System in JavaScript

Welcome to the **"Build Your Own Reactive System"** course! In this follow-along tutorial, we'll go from zero to expert in building a **complete, production-ready reactive system** in JavaScript, just like Solid.js or Vue.js under the hood.

This is for developers who:

- Know basic JavaScript
- Want to understand reactivity from scratch
- Crave performance, memory safety, and full control

By the end, you’ll be able to: ✅ Create a reactive graph of signals, computed values, and effects\
✅ Optimize updates with batching and microtasks\
✅ Prevent cycles, leaks, and unneeded re-computations\
✅ Build a dev-friendly API with `peek()`, `untrack()`, and more

---

## 📘 Table of Contents

1. [🏗️ Step 1: What is a Reactive System?](#step-1)
2. [🧱 Step 2: Build the Core Graph (Signals and Effects)](#step-2)
3. [🔁 Step 3: Dependency Tracking and Updates](#step-3)
4. [📦 Step 4: Computed Values (Derived State)](#step-4)
5. [⚙️ Step 5: Effects and Batched Updates](#step-5)
6. [🚀 Step 6: Microtasks for Async Flush](#step-6)
7. [🛡️ Step 7: Cycle Detection and Error Handling](#step-7)
8. [🔬 Step 8: Advanced Features (peek, untrack, batch)](#step-8)
9. [🧼 Step 9: Cleanup and Memory Safety](#step-9)
10. [📚 Step 10: Bonus - createMemo, createBatchedSignals, createScope](#step-10)

---

## 🏗️ Step 1: What is a Reactive System?

A reactive system is one where **values update automatically when their dependencies change**.

```js
const count = createSignal(1);
const doubled = createComputed(() => count() * 2);

createEffect(() => {
  console.log("Doubled is", doubled());
});

count.set(2); // Logs: "Doubled is 4"
```

To implement this, we need:

- **Signals** – mutable values that trigger updates
- **Computed values** – values derived from signals
- **Effects** – side effects that re-run when dependencies change
- **Graph** – to track dependencies

---

## 🧱 Step 2: Build the Core Graph (Signals and Effects)

All reactive values are tracked as **ReactiveNodes**.

```ts
interface ReactiveNode {
  id: number;
  version: number;
  sources: WeakMap<ReactiveNode, number>;
  observers: Set<ReactiveNode>;
  compute?: () => any;
  value?: any;
  cleanup?: () => void;
  onDirty?: () => void;
  dirty?: boolean;
  error?: any;
  name?: string;
}
```

### `createSignal()`

A signal holds a value and notifies observers when it changes.

### `trackAccess()`

Records the active dependency while reading a value.

```ts
let activeObserver: ReactiveNode | null = null;
function trackAccess(source: ReactiveNode) {
  if (activeObserver) {
    activeObserver.sources.set(source, source.version);
    source.observers.add(activeObserver);
  }
}
```

---

## 🔁 Step 3: Dependency Tracking and Updates

We rerun a computation when a dependency changes.

### `runNode(node)`

```ts
function runNode(node: ReactiveNode) {
  computationStack.push(node);
  cleanupSources(node);
  activeObserver = node;
  // run compute, assign value, handle cleanup...
  computationStack.pop();
  activeObserver = prevObserver;
}
```

- Avoid infinite loops with a `computationStack`
- Store values and trigger updates if the value changed

### `notifyObservers(node)`

Marks all dependent nodes as dirty and schedules updates

---

## 📦 Step 4: Computed Values (Derived State)

```ts
export function createComputed<T>(fn: () => T) {
  const node = createNode<T>(undefined);
  node.compute = fn;
  runNode(node);
  return () => {
    updateIfNecessary(node);
    trackAccess(node);
    return node.value;
  };
}
```

---

## ⚙️ Step 5: Effects and Batched Updates

Effects are special computed values with no return. They rerun when signals change.

```ts
export function createEffect(fn: () => void) {
  const node = createNode();
  node.compute = fn;
  node.onDirty = () => scheduleMicrotask();
  runNode(node);
  return () => cleanupSources(node);
}
```

Batching prevents unnecessary recalculations:

```ts
function startBatch() { batchDepth++; }
function endBatch() { if (--batchDepth === 0) scheduleMicrotask(); }
```

---

## 🚀 Step 6: Microtasks for Async Flush

```ts
let pendingEffects = new Set<ReactiveNode>();
let pendingMicrotask = false;

function scheduleMicrotask() {
  if (!pendingMicrotask && pendingEffects.size > 0) {
    pendingMicrotask = true;
    queueMicrotask(() => {
      pendingMicrotask = false;
      for (const effect of pendingEffects) runNode(effect);
    });
  }
}
```

---

## 🛡️ Step 7: Cycle Detection and Error Handling

Avoid infinite loops:

```ts
if (computationStack.includes(node)) {
  throw new Error("Cycle detected");
}
```

Handle errors gracefully inside `runNode()`

---

## 🔬 Step 8: Advanced Features (peek, untrack, batch)

```ts
signal.peek(); // read without tracking
disableTracking(() => { ... }); // like untrack
startBatch(); endBatch(); // wrap multiple updates
```

---

## 🧼 Step 9: Cleanup and Memory Safety

Effects and computed values may register cleanup functions:

```ts
if (typeof node.cleanup === 'function') node.cleanup();
```

Use `WeakMap` for sources so they can be GC’d when untracked

---

## 📚 Step 10: Bonus Features

### `createMemo(fn)`

Like computed, but cached with memoization

### `createBatchedSignals({ a, b, c })`

Create many named signals at once

### `untrack(fn)`

Disable tracking inside a function

---

## 🎓 Final Project

Build a reactive Todo App or Counter that uses all these features:

- Signals
- Computed
- Effect
- Cleanup
- Batched Updates
- Dev helpers (`peek`, `untrack`)

You now have a full understanding of a production-grade reactive system! 🚀
