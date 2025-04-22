# 🧠 Build a Reactive System from Scratch in JavaScript

This is a focused, step-by-step guide to building a full reactive system from scratch using plain JavaScript — no dependencies, no frameworks. This guide is **code-first**, teaching each core part through direct implementation.

---

## 📦 1. Signals: `createSignal`

```js
function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const get = () => {
    if (activeEffect) activeEffect.deps.add(subscribers);
    return value;
  };

  const set = (nextValue) => {
    if (Object.is(value, nextValue)) return;
    value = nextValue;
    for (const sub of [...subscribers]) sub();
  };

  return [get, set];
}
```

### ✅ Usage

```js
const [count, setCount] = createSignal(0);
console.log(count()); // 0
setCount(1);
console.log(count()); // 1
```

---

## ⚙️ 2. Effects: `createEffect`

```js
let activeEffect = null;

function createEffect(fn) {
  const effect = () => {
    cleanupEffect(effect);
    activeEffect = effect;
    fn();
    activeEffect = null;
  };
  effect.deps = new Set();
  effect();
}

function cleanupEffect(effect) {
  for (const dep of effect.deps) dep.delete(effect);
  effect.deps.clear();
}
```

### ✅ Usage

```js
createEffect(() => {
  console.log("Count changed to", count());
});
```

---

## 🧠 3. Computed Values: `createComputed`

```js
function createComputed(fn) {
  let cached;
  createEffect(() => {
    cached = fn();
  });
  return () => cached;
}
```

### ✅ Usage

```js
const double = createComputed(() => count() * 2);
console.log(double()); // 2 if count is 1
```

---

## ⏱️ 4. Batching: `batch` and `createBatchedSignals`

```js
let isBatching = false;
const pending = new Set();

function batch(fn) {
  isBatching = true;
  fn();
  isBatching = false;
  for (const sub of [...pending]) sub();
  pending.clear();
}

function createBatchedSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const get = () => {
    if (activeEffect) activeEffect.deps.add(subscribers);
    return value;
  };

  const set = (nextValue) => {
    if (Object.is(value, nextValue)) return;
    value = nextValue;
    if (isBatching) {
      pending.add(() => {
        for (const sub of [...subscribers]) sub();
      });
    } else {
      for (const sub of [...subscribers]) sub();
    }
  };

  return [get, set];
}
```

### ✅ Usage

```js
const [a, setA] = createBatchedSignal(1);
const [b, setB] = createBatchedSignal(2);

createEffect(() => {
  console.log("Sum:", a() + b());
});

batch(() => {
  setA(3);
  setB(4);
});
```

---

## 🧹 5. Cleanup and Scoped Disposal

```js
function createScopedEffect(fn) {
  const cleanups = [];

  const effect = () => {
    cleanupEffect(effect);
    activeEffect = effect;
    const cleanup = fn(() => {
      for (const c of cleanups) c();
      cleanups.length = 0;
    });
    if (typeof cleanup === 'function') cleanups.push(cleanup);
    activeEffect = null;
  };

  effect.deps = new Set();
  effect();

  return () => {
    cleanupEffect(effect);
    for (const c of cleanups) c();
  };
}
```

---

## 🧭 6. DOM Bindings

Simple integration for reactive updates:

```js
function bindText(el, signal) {
  createEffect(() => {
    el.textContent = signal();
  });
}
```

### ✅ Usage

```js
const [greeting, setGreeting] = createSignal("Hello!");
const el = document.createElement("p");
bindText(el, greeting);
document.body.append(el);
setTimeout(() => setGreeting("Hi again!"), 1000);
```

---

## 🎉 Done

You now have a fully functional reactive core:

- ✅ Signals
- ✅ Effects
- ✅ Computeds
- ✅ Batching
- ✅ Cleanups
- ✅ DOM bindings

You can expand from here:

- Add keyed list rendering
- Create custom components
- Build routing or file-system rendering

Want to go deeper into templates or compile-time JSX transforms next? Let me know!
