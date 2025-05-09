# The DreamEcho100 Custom Vanilla SPA Framework

A lightweight, type-safe reactive framework for creating Single Page Applications with pure JavaScript. This framework provides fine-grained reactivity without any build steps or external dependencies, leveraging modern browser APIs and TypeScript definitions while maintaining vanilla JavaScript compatibility through JSDoc annotations.

## Why This Framework?

- **Zero Dependencies**: Works directly in the browser with no build step or external libraries
- **Fine-grained Reactivity**: Updates only what changes, similar to SolidJS and Svelte
- **Type Safety**: Full TypeScript support with JSDoc for pure JavaScript projects
- **Modern Component Patterns**: Function-based components with hooks-like behavior
- **Standards-Based**: Built directly on browser APIs, not abstractions
- **Performance**: avoiding unnecessary features or providing alternative
- **Simplicity**: clear mental model for users
- **Flexibility**: letting users implement specialized behaviors that can easily work with the current system

## Core Architecture

The framework consists of three interconnected modules:

### 1. **Reactivity System** (`signals.js`)

This module provides a fine-grained reactivity system with automatic dependency tracking:

```javascript
// Create a reactive state container
const count = createSignal(0);

// Read the value
console.log(count()); // 0

// Update the value (automatically notifies dependents)
count.set(5);
// or
count.update(n => n + 1);

// Create a computed value that automatically updates
const doubled = createMemo(() => count() * 2);

// Create an effect that runs when dependencies change
createEffect(() => {
  document.title = `Count: ${count()}`;
});

// Batch multiple updates for efficiency
batchSignals(() => {
  firstName.set("John");
  lastName.set("Doe");
});

// Create a scope for lifecycle management
const scope = createScope(() => {
  // Component setup with automatic cleanup
  const timer = setInterval(() => count.update(n => n + 1), 1000);
  onScopeCleanup(() => clearInterval(timer));
  
  return someElement;
});

// Later: scope.dispose() for cleanup
```

### 2. **DOM Creation Library** (`dom.js`)

Create DOM elements with a clean, concise syntax:

```javascript
// HTML elements
const button = t.button(
  {
    className: "btn primary",
    disabled: true,
    onclick: (e) => handleClick(e)
  },
  "Click me",
  t.span({ className: "icon" }, "👍")
);

// SVG elements with proper namespace handling
const svgIcon = t.svg(
  { width: 24, height: 24, viewBox: "0 0 24 24" },
  t(SVG_NS).path({ 
    d: "M10 10 H 90 V 90 H 10 Z",
    fill: "none",
    stroke: "currentColor"
  })
);

// Special attribute handling
const form = t.div(
  {
    // Object styles with TypeScript validation
    style: { display: 'flex', flexDirection: 'column' },
    
    // Type-safe event handling
    onclick: [handleClick, { capture: true }],
    
    // Dynamic class names with reactive updates
    className: () => isActive() ? "active container" : "container",
    
    // Data attributes
    dataSet: { testId: "login-form" },
    
    // ARIA attributes
    ariaSet: { label: "Login Form" },
    
    // Get a reference to the element
    ref: (el) => formRef = el
  },
  "Child content"
);
```

### 3. **Reactive DOM Integration** (`dom-signals.js`)

Connect your reactive state to the DOM with automatic updates:

```javascript
// Reactive content
t.div({}, () => `Count: ${count()}`);

// Reactive attributes
t.input({ 
  value: () => inputText(),
  oninput: (e) => inputText.set(e.target.value)
});

// Efficient list rendering with key-based reconciliation
$list(
  todos,                           // Signal or memo containing array
  todo => todo.id,                 // Key function for identity
  (todo, index) => t.li(          // Render function
    { 
      className: () => todo().completed ? "completed" : "" 
    },
    t.span({}, () => todo().text),
    t.button({ 
      onclick: () => removeTodo(todo().id) 
    }, "Delete")
  )
);

// Conditional rendering
$toggle(
  () => isLoading(),
  () => t.div({ className: "spinner" }, "Loading...")
);

// Switch rendering for multiple states
$switch(
  {
    "loading": () => t.div({}, "Loading..."),
    "error": () => t.div({ className: "error" }, "Error occurred!"),
    "success": () => t.div({}, "Data loaded successfully!")
  },
  status,
  { defaultCase: () => t.div({}, "Unknown state") }
);
```

## Function-Based Component Pattern

Components are simple functions that accept props and return DOM elements:

```javascript
function TodoItem({ todo, onToggle, onDelete }) {
  // Component-local state
  const isEditing = createSignal(false);
  const editText = createSignal(todo().text);
  
  // Event handlers
  function handleSubmit(e) {
    e.preventDefault();
    todo.update(t => ({ ...t, text: editText() }));
    isEditing.set(false);
  }
  
  // Component rendering
  return t.li(
    { className: () => `todo-item ${todo().completed ? "completed" : ""}` },
    $toggle(
      () => !isEditing(), 
      () => [
        t.input({
          type: "checkbox",
          checked: () => todo().completed,
          onchange: () => onToggle(todo().id)
        }),
        t.span(
          { ondblclick: () => isEditing.set(true) },
          () => todo().text
        ),
        t.button({ 
          onclick: () => onDelete(todo().id),
          className: "delete-btn"
        }, "×")
      ]
    ),
    $toggle(
      isEditing,
      () => t.form(
        { onsubmit: handleSubmit },
        t.input({
          value: editText,
          oninput: (e) => editText.set(e.target.value),
          onblur: handleSubmit,
          ref: el => setTimeout(() => el.focus(), 0)
        })
      )
    )
  );
}

function TodoApp() {
  const todos = createSignal([
    { id: 1, text: "Learn this framework", completed: false }
  ]);
  
  function addTodo(text) {
    todos.update(list => [
      ...list,
      { id: Date.now(), text, completed: false }
    ]);
  }
  
  function toggleTodo(id) {
    todos.update(list => list.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }
  
  function deleteTodo(id) {
    todos.update(list => list.filter(todo => todo.id !== id));
  }
  
  return t.div(
    { className: "todo-app" },
    t.h1({}, "Todo App"),
    t.form(
      { 
        onsubmit: e => {
          e.preventDefault();
          const input = e.target.querySelector("input");
          addTodo(input.value);
          input.value = "";
        }
      },
      t.input({ placeholder: "What needs to be done?" }),
      t.button({}, "Add")
    ),
    $list(
      todos,
      todo => todo.id,
      todo => TodoItem({
        todo,
        onToggle: toggleTodo,
        onDelete: deleteTodo
      })
    )
  );
}
```

## Key Characteristics

- **TypeScript-First**: Extensive type definitions ensure type safety
- **Performance-Focused**: Fine-grained updates minimize DOM operations
- **Functional Approach**: Compose with functions, not class hierarchies
- **Developer Experience**: Descriptive errors and consistent patterns
- **Zero Dependencies**: No runtime dependencies or build requirements
- **Web Standards**: Built on standard DOM APIs without abstraction layers

## Best Practices

1. **Localize State**: Keep state close to where it's used
2. **Use Memos**: Cache expensive computations with `createMemo`
3. **Clean Up Resources**: Register cleanup functions with `onScopeCleanup`
4. **Batch Updates**: Use `batchSignals` for multiple related state changes
5. **Leverage TypeScript**: Use type annotations for better tooling and safety

## Roadmap

- [x] Fine-grained reactivity system with automatic dependency tracking
- [x] DOM creation with simple element factory functions
- [x] Reactive bindings for automatic DOM updates
- [x] Scope-based lifecycle management and cleanup
- [x] Event handling with options support
- [x] Special attribute handling (style, className, data-*, aria-*)
- [x] Reference system to get DOM element instances
- [x] Efficient list rendering with key-based reconciliation
- [x] Conditional rendering with `$toggle`
- [x] Switch-based rendering with `$switch`
- [x] Context system for value propagation
- [x] Namespace support (SVG, MathML, XHTML)
- [ ] Input Cursor Preservation
- [ ] Error boundaries for isolated error handling
- [ ] View Transition API integration for smooth UI transitions
- [ ] Fragment support for more efficient component composition

  ```javascript
  // Special attribute approach
  case "valuePreserveSelection": {
    handleReactiveValue(valueOrReactive, (value) => {
      if (value == null) return;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        updateInputValuePreservingSelection(element, value);
      }
    });
    return true;
  }
  ```

- [ ] Expand on handling `ref`
- [ ] Expand on handling `behaviorOnUnmount="keep"` on the `$toggle` and `switch` functions to
  - Keep elements in DOM but hide them with CSS vs removing them from the dom, cach, and reusing them when needed.
  - Allow animation state to persist?
  - Provide memory/performance options to users
- [ ] Generic element support for any tag name
- [ ] Proper namespace attribute handling
- [ ] Web Component Handling?
- [ ] Additional reactive components:
  - [ ] `$portal` - Render content outside the DOM hierarchy
  - [ ] `$errorBoundary` - Isolate and handle UI errors
  - [ ] `$resource` - Handle async data loading states
  - [ ] `$form` - Manage form state and validation
  - [ ] `$transition` - Animate element changes
  - [ ] `$router` - SPA navigation components
  - [ ] `$lazyComponent` - Code splitting support
  - [ ] `$contextConsumer` - Simplified context access
  - [ ] `$debounce` - Performance optimization for reactive code

## Technical Considerations

- Signal functions are callable objects with additional methods
- Effects run synchronously but batch updates through microtasks
- DOM updates occur directly without a virtual DOM
- Component encapsulation happens through function closures
- Type safety is provided via TypeScript or JSDoc annotations
- Reactive tracking occurs automatically during render

## Getting Started

Simply import the library and start building:

```javascript
import { createSignal, createEffect } from './libs/spa/signals.js';
import { t } from './libs/spa/dom.js';
import { $toggle, $list } from './libs/spa/dom-signals.js';

// Your application code here
const app = YourApp();
document.body.appendChild(app);
