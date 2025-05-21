<!-- eslint-disable markdown/fenced-code-language -->
# JavaScript Timing Mechanisms: A Practical Guide for SPAs

When building a custom vanilla SPA like yours, choosing the right timing mechanism is crucial for performance and user experience. Let me break down each option and recommend when to use them in your architecture.

## Comparison of Timing Mechanisms

### 1. queueMicrotask

- **Timing**: Executes immediately after current JavaScript execution, before browser rendering
- **Priority**: Very high (runs before rendering, animations, setTimeout)
- **Use cases**: Batching UI updates, ensuring data consistency before rendering

### 2. requestAnimationFrame (rAF)

- **Timing**: Syncs with browser's display refresh rate (~60fps, every ~16.7ms)
- **Priority**: High (runs before painting but after microtasks)
- **Use cases**: Animations, visual transitions, DOM layout operations

### 3. setTimeout/setInterval

- **Timing**: At least the specified delay (but often longer, minimum ~4ms)
- **Priority**: Low (runs after microtasks and animation frames)
- **Use cases**: Delayed operations, polling, breaking up long tasks

### 4. requestIdleCallback

- **Timing**: When browser is idle between frames
- **Priority**: Lowest (runs only when browser has spare time)
- **Use cases**: Non-critical background work, preloading

```
Execution Order:
┌────────────┐     ┌─────────────────┐     ┌────────────────┐     ┌─────────────────┐
│ JavaScript │────▶│  queueMicrotask │────▶│ requestAnim... │────▶│ Browser Render  │
└────────────┘     └─────────────────┘     └────────────────┘     └─────────────────┘
                                                                           │
                   ┌─────────────────┐                            ┌────────▼────────┐
                   │ setTimeout/     │◀───────────────────────────│    Idle Time    │
                   │ setInterval     │                            │ requestIdleCall │
                   └─────────────────┘                            └─────────────────┘
```

## Recommendations for Your SPA Framework

### 1. Continue Using queueMicrotask for Signal Updates

Your current implementation in signals.js using `queueMicrotask` for batching is ideal:

```javascript
function scheduleMicrotask() {
  if (currentScope.pendingMicrotask || currentScope.pendingEffects.size === 0) {
    return;
  }

  currentScope.pendingMicrotask = true;
  queueMicrotask(() => {
    // Process effects after current execution
    currentScope.pendingMicrotask = false;
    flushPendingEffects(currentScope);
  });
}
```

This ensures your reactive updates are processed immediately after the current execution but before the browser paints - perfect for keeping UI in sync with state changes.

### 2. Use requestAnimationFrame for Visual DOM Updates

For DOM manipulations that affect layout or visual appearance:

```javascript
// Example: Smooth transitions when elements appear
function addWithTransition(element, parent) {
  // First insert with opacity 0
  element.style.opacity = '0';
  parent.appendChild(element);
  
  // Then animate in on next frame (after layout calculation)
  requestAnimationFrame(() => {
    element.style.transition = 'opacity 300ms';
    element.style.opacity = '1';
  });
}
```

### 3. Use setTimeout for

- Debouncing user input
- Implementing delays (like notification dismissal)
- Fallbacks for browsers without newer APIs

```javascript
// Example: Debounced search input
function createDebouncedSearch(delay = 300) {
  const searchQuery = $signal('');
  let timeoutId = null;
  
  function updateSearch(value) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      searchQuery.set(value);
    }, delay);
  }
  
  return { searchQuery, updateSearch };
}
```

### 4. Use requestIdleCallback for

- Progressive rendering of large lists
- Prefetching data or components
- Non-critical calculations

```javascript
function prefetchComponents() {
  const components = ['settings', 'profile', 'notifications'];
  let index = 0;
  
  function loadNext(deadline) {
    while (index < components.length && deadline.timeRemaining() > 5) {
      import(`./components/${components[index]}.js`);
      index++;
    }
    
    if (index < components.length) {
      requestIdleCallback(loadNext);
    }
  }
  
  // With fallback timeout of 2 seconds
  requestIdleCallback(loadNext, { timeout: 2000 });
}
```

## Specific Framework Component Recommendations

For your SPA framework, I recommend this allocation:

| Framework Feature | Recommended Timing Mechanism |
|-------------------|------------------------------|
| Signal updates | queueMicrotask (as current) |
| $list rendering | Initial: queueMicrotask, Animations: requestAnimationFrame |
| $toggle transitions | requestAnimationFrame |
| Route changes | queueMicrotask |
| Large data processing | Break up with setTimeout or requestIdleCallback |
| Form validation | debounce with setTimeout |
| Initial app load | Critical: queueMicrotask, Non-critical: requestIdleCallback |

## Browser Compatibility Consideration

`requestIdleCallback` has more limited browser support (notably absent in Safari). Consider this polyfill:

```javascript
// Simple polyfill for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || 
  function(callback) {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, 1);
  };
```

By using the right timing mechanism for each scenario, your vanilla SPA framework can achieve excellent performance while maintaining clean architecture and proper separation of concerns.

Similar code found with 4 license types
