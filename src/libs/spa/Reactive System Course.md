# Mastering Reactive Systems from Scratch

> This course will take you from no knowledge of reactive systems to building a production-grade reactive core with performance optimizations, developer tooling, memory safety, and advanced features like batched updates and async effects.

---

## 📦 What You'll Build

You'll implement a **reactive system from scratch** in JavaScript, including:

- Signals, effects, and computed values
- Dependency graph tracking
- Batched updates and microtask scheduling
- Memory-safe cleanup and disposal
- Developer tools like named signals and `peek()`
- Async-safe effects and scoped cleanup

You'll become an expert by **building the core** first, then layering in advanced performance, ergonomics, and safety.

---

## 🧱 Prerequisites

- Basic JavaScript knowledge (functions, closures, arrays, objects)
- No Reactivity/Framework knowledge required

---

## 🧭 Course Roadmap

### 1. [Core Reactive Graph](#1-core-reactive-graph)

### 2. [Signals: Reactive Values](#2-signals-reactive-values)

### 3. [Effects: Responding to Changes](#3-effects-responding-to-changes)

### 4. [Computed: Derived Reactive Values](#4-computed-derived-reactive-values)

### 5. [Batching and Microtasks](#5-batching-and-microtasks)

### 6. [Memory Safety & Cleanup](#6-memory-safety--cleanup)

### 7. [Error Handling & Cycle Detection](#7-error-handling--cycle-detection)

### 8. [Developer Experience Helpers](#8-developer-experience-helpers)

### 9. [Advanced Features](#9-advanced-features)

---

## 1. Core Reactive Graph

**Goal:** Build the foundation of the system: the dependency tracking graph.

### 🔑 Concepts

- Every signal/effect/computed is a **ReactiveNode**
- Each node tracks its **sources** and **observers**
- Observers rerun when sources change

### ✅ Features to Implement

- `ReactiveNode` interface
- `createNode()` constructor
- Dependency tracking: `trackAccess()`
- Observer notifications: `notifyObservers()`

---

## 2. Signals: Reactive Values

**Goal:** Create primitive reactive values (`createSignal`).

### 🧠 What to Know

- Signals hold a value
- When read inside a computation, they're tracked
- When updated, they notify observers

### ✅ Features to Implement

- `createSignal(value)`
- `.set()` and `.update()`
- `.peek()` to read without tracking

---

## 3. Effects: Responding to Changes

**Goal:** Run functions when dependencies change (`createEffect`).

### 🧠 What to Know

- Effects track their dependencies
- When a dependency changes, the effect reruns
- Automatically cleaned up on rerun

### ✅ Features to Implement

- `createEffect(fn)`
- Cleanup via returned function

---

## 4. Computed: Derived Reactive Values

**Goal:** Values derived from other signals (`createComputed`).

### 🧠 What to Know

- Like `createSignal`, but value is calculated
- Tracks and reruns when dependencies change

### ✅ Features to Implement

- `createComputed(fn)`
- Internal caching and versioning
- Error handling in computed

---

## 5. Batching and Microtasks

**Goal:** Optimize performance by grouping updates.

### 🧠 What to Know

- Multiple updates in one tick should rerun once
- Microtasks allow deferment

### ✅ Features to Implement

- `startBatch()` and `endBatch()`
- `scheduleMicrotask()`
- `pendingEffects` queue

---

## 6. Memory Safety & Cleanup

**Goal:** Avoid memory leaks and manage lifecycles.

### 🧠 What to Know

- When an effect reruns, previous dependencies should be cleared
- WeakMaps prevent memory leaks

### ✅ Features to Implement

- `cleanupSources()`
- WeakMap for tracking sources
- `node.cleanup()` on rerun

---

## 7. Error Handling & Cycle Detection

**Goal:** Prevent crashes and infinite loops.

### 🧠 What to Know

- Cycles in dependencies should be detected
- Errors in compute functions shouldn't break the graph

### ✅ Features to Implement

- `computationStack` for cycle detection
- `node.error` and try/catch
- Pretty error messages with stack traces

---

## 8. Developer Experience Helpers

**Goal:** Make debugging and usage easier.

### 🧠 What to Know

- Signals should be named
- Sometimes you want to read without tracking

### ✅ Features to Implement

- Named signals with `name` option
- `untrack(fn)` helper
- `signal.peek()` for non-tracked reads

---

## 9. Advanced Features

### 🛠️ 9.1: `createBatchedSignals`

Create multiple signals at once with shared options.

### 🧰 9.2: `createMemo(fn)`

Memoize expensive computed functions.

### 🔄 9.3: `ref(domElement)`

Reactive bindings to DOM elements.

### 🧼 9.4: Scoped disposal

Clean up nodes when no longer needed.

### ⚙️ 9.5: Async-safe effects

Reactivity that can handle Promises safely.

---

## 🏁 Wrap-up and Real-World Use

- Integrate into UI frameworks (manual DOM, lit-html, etc)
- Debugging tools
- Production safety checks

---

## 🧪 Bonus: Challenges and Projects

- Signal-based counter
- Derived temperature converter (C ↔ F)
- Todo list with reactive filters
- UI bindings via `ref()`

---

## 🔗 Resources

- Solid.js source code (inspiration)
- MobX/Knockout/Reactivity patterns
- Your own devtools

---

You're now ready to **build reactive systems from scratch**. Happy hacking 🚀
