// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./dom-signals.d.ts" />

/**
 * @import de100x from "./dom.js";
 * @import { SignalValue, MemoValue, ScopeResult } from "./signals.js";
 */

/**
 * DOM Reactivity Integration
 *
 * This module connects the reactive signal system to DOM operations,
 * enabling:
 * - Reactive DOM attributes and properties
 * - Automatic DOM updates when signal values change
 * - Efficient child element reconciliation
 * - Component-like patterns for lists, toggles, and conditional rendering
 */

import {
  cancelIdleCallbackPolyfill,
  requestIdleCallbackPolyfill,
} from "./polyfills.js";
import {
  $effect,
  onScopeCleanup,
  getScopeId,
  createScope,
  $signal,
  $memo,
} from "./signals.js";

/**
 * 🔄 Handles potentially reactive values or value maps
 *
 * Process flow:
 * ├─ If value is a function (reactive getter)
 * │   ├─ Create effect to track changes
 * │   ├─ If result is an object
 * │   │   ├─ Process each key-value pair
 * │   │   │   ├─ If value is function → create nested effect
 * │   │   │   └─ Otherwise → apply directly via onValueMap
 * │   └─ If result is not an object → apply via onValue
 * └─ If value is an object
 *     ├─ Process each key-value pair
 *     │   ├─ If value is function → create nested effect
 *     │   └─ Otherwise → apply directly via onValueMap
 *     └─ If value is not an object → apply via onValue
 *
 * @param {unknown} valueOrReactive - Static value or reactive getter function
 * @param {(value: string|number|null|undefined) => void} onValue - Handler for simple values
 * @param {(key: string, value: string|number|null|undefined) => void} onValueMap - Handler for object properties
 * @returns {void}
 */
function handleReactiveValueOrMap(valueOrReactive, onValue, onValueMap) {
  // Handle reactive functions (signal getters)
  if (typeof valueOrReactive === "function") {
    $effect(() => {
      const resolvedValue = valueOrReactive();

      // Handle object values (like style objects)
      if (typeof resolvedValue === "object" && resolvedValue !== null) {
        for (const key in resolvedValue) {
          if (Object.prototype.hasOwnProperty.call(resolvedValue, key)) {
            const propertyValue = resolvedValue[key];

            // Handle nested reactive properties
            if (typeof propertyValue === "function") {
              $effect(() => {
                const resolvedPropertyValue = propertyValue();
                onValueMap(key, resolvedPropertyValue);
              });
            } else {
              // Handle static properties
              onValueMap(key, propertyValue);
            }
          }
        }
        return;
      }

      // Handle primitive values
      onValue(resolvedValue);
    });
    return;
  }

  // Handle static object values
  if (typeof valueOrReactive === "object" && valueOrReactive !== null) {
    for (const key in valueOrReactive) {
      if (Object.prototype.hasOwnProperty.call(valueOrReactive, key)) {
        const propertyValue = /** @type {Record<String, any>} */ (
          valueOrReactive
        )[key];

        // Handle reactive property values
        if (typeof propertyValue === "function") {
          $effect(() => {
            const resolvedPropertyValue = propertyValue();
            onValueMap(key, resolvedPropertyValue);
          });
        } else {
          // Handle static property values
          onValueMap(key, propertyValue);
        }
      }
    }
    return;
  }

  // Handle static primitive values
  onValue(/** @type {any} */ (valueOrReactive));
}

/**
 * 🔄 Handles potentially reactive simple values
 *
 * Simpler version of handleReactiveValueOrMap for when we only
 * need to handle a single value, not an object map.
 *
 * @param {unknown} valueOrReactive - Static value or reactive getter function
 * @param {(value: string|number|null|undefined) => void} onValue - Handler for the value
 * @returns {void}
 */
function handleReactiveValue(valueOrReactive, onValue) {
  // Handle reactive getter functions
  if (typeof valueOrReactive === "function") {
    $effect(() => {
      const resolvedValue = valueOrReactive();
      onValue(resolvedValue);
    });
    return;
  }

  // Handle static values
  onValue(/** @type {any} */ (valueOrReactive));
}

/**
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} input
 * @param {*} newValue
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateInputValuePreservingSelection(input, newValue) {
  if (document.activeElement === input) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const direction = input.selectionDirection ?? "none";

    input.value = newValue == null ? "" : newValue;

    if (document.activeElement === input) {
      input.setSelectionRange(start, end, direction);
    }
  } else {
    input.value = newValue == null ? "" : newValue;
  }
}

/**
 * @param {de100x.TElement} element - DOM element to modify
 * @param {string} attributeName - Name of the attribute/property
 * @param {unknown} valueOrReactive - Value or reactive getter function
 * @returns {boolean} True if attribute was handled, false if it should use standard setAttribute
 */
function setSpecialElementAttribute(element, attributeName, valueOrReactive) {
  switch (attributeName) {
    // Handle style object or string
    case "style": {
      handleReactiveValueOrMap(
        valueOrReactive,
        // Handle style as string
        (value) => {
          element.style.cssText =
            value == null ? "" : /** @type {string} */ (value);
        },
        // Handle style as object with properties
        (propertyName, propertyValue) => {
          if (propertyValue == null) {
            element.style[/** @type {*} */ (propertyName)] = "";
            return;
          }
          element.style[/** @type {*} */ (propertyName)] =
            /** @type {string} */ (propertyValue);
        },
      );
      return true;
    }

    /*
      # DOM Properties vs Attributes: Why Direct Assignment Matters

      The special handling for element properties like `value`, `checked`, and others in your code is necessary due to a fundamental distinction in how browsers handle DOM attributes versus DOM properties.

      ## The Attribute-Property Gap

      When working with DOM elements, there are two parallel systems:

      1. **HTML Attributes** - The string values you declare in HTML markup
        ```html
        <input type="text" value="initial value">
        ```

      2. **DOM Properties** - The JavaScript object properties on DOM element objects
        ```javascript
        element.value = "updated value";
        ```

      While these often seem connected, they don't always stay synchronized, which creates these problems:

      ## Why Direct Assignment Is Required

      Take the `value` property as an example:

      ```javascript
      // This updates what the user SEES in the field
      inputElement.value = "New text";

      // This only updates the attribute, NOT necessarily what the user sees
      inputElement.setAttribute("value", "New text");
      ```

      This difference exists because:

      1. **Initial vs Current State**: Attributes generally represent the *initial state* from HTML, while properties represent the *current state* including user interactions.

      2. **Type Differences**: Attributes are always strings, while properties can be booleans, numbers, objects, etc.

      ## Common Problem Cases

      | Property | Problem with setAttribute |
      |----------|--------------------------|
      | `value` | Doesn't update the visible input value after user interaction |
      | `checked` | Doesn't toggle checkboxes visually |
      | `selectedIndex` | Won't change the visible selected option |
      | `disabled` | May not disable the element properly |
      | `indeterminate` | Has no attribute equivalent at all |

      ## How Browsers Handle Them

      When a browser parses HTML:
      1. It creates the HTML element from attributes
      2. It initializes corresponding DOM properties from attributes
      3. After that, properties and attributes can diverge:
        - User interactions update properties, not attributes
        - Some properties never sync back to attributes

      By directly setting properties, your library ensures that both the internal state and the visible UI state stay synchronized, which is critical for a reactive framework that needs to reliably update what users see.
      */

    // Handle more properties that need direct assignment
    case "className":
    case "tabIndex":
    case "scrollTop":
    case "scrollLeft":
    case "defaultValue":
    case "defaultChecked":
    case "contentDocument":
    case "selectedIndex":
    case "readOnly":
    case "indeterminate":
    case "htmlFor":
    case "textContent":
    case "volume":
    case "currentTime":
    case "playbackRate":
    case "value":
    case "checked": {
      handleReactiveValue(valueOrReactive, (value) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        element[attributeName] =
          value == null ? "" : /** @type {string} */ (value);
      });
      return true;
    }

    // Handle more properties that need direct assignment
    case "selected":
    case "disabled":
    case "muted": {
      handleReactiveValue(valueOrReactive, (value) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        element[attributeName] = value == null ? false : value;
      });
      return true;
    }

    // Handle data-* attributes via dataset
    case "dataSet": {
      handleReactiveValueOrMap(
        valueOrReactive,
        // Handle dataset as complete object
        (value) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          element.dataset =
            value == null
              ? {}
              : /** @type {Record<string, string>} */ (
                  /**  @type {unknown} */ (value)
                );
        },
        // Handle individual dataset properties
        (key, value) => {
          element.dataset[key] =
            value == null ? "" : /** @type {string} */ (value);
        },
      );
      return true;
    }

    // Handle aria-* attributes
    case "ariaSet": {
      /** @typedef {{ [Key in (keyof Element) & `aria${string}`]: Element[Key] }} AriaMap */
      /** @typedef {keyof AriaMap} AriaKey */

      /** @type {Set<AriaKey>} */
      let usedAriaKeys = new Set();

      handleReactiveValueOrMap(
        valueOrReactive,
        /** @param {any} value */
        (value) => {
          // Clear all aria attributes when value is null
          if (value == null) {
            if (usedAriaKeys.size > 0) {
              for (const key of usedAriaKeys) {
                element[/** @type {AriaKey} */ (key)] = "";
              }
            }
            usedAriaKeys.clear();
            return;
          }

          // Set each aria attribute from the object
          for (const key in value) {
            const ariaKey = /** @type {AriaKey} */ (key);
            const attrValue = value[key];

            if (attrValue == null) {
              element[/** @type {AriaKey} */ (key)] = "";
              return;
            }

            usedAriaKeys.add(ariaKey);
            element[/** @type {AriaKey} */ (key)] = /** @type {string} */ (
              attrValue
            );
          }
        },
        // Handle individual aria attributes
        (key, value) => {
          element[/** @type {AriaKey} */ (key)] =
            value == null ? "" : /** @type {string} */ (value);
        },
      );

      // Clean up tracked aria keys when scope is disposed
      onScopeCleanup(() => {
        usedAriaKeys.clear();
      });
      return true;
    }

    // Handle innerHTML with security warning
    case "dangerouslySetInnerHTML": {
      handleReactiveValue(valueOrReactive, (value) => {
        element.innerHTML = value == null ? "" : /** @type {string} */ (value);
      });
      return true;
    }

    // Handle element references
    case "ref": {
      const refValue =
        /** @type {{ current: Element }|((element: Element) => void) } */ (
          valueOrReactive
        );

      // document.startViewTransition(() => {
      if (typeof refValue === "function") {
        refValue(element);
      } else if (
        refValue &&
        typeof refValue === "object" &&
        "current" in refValue
      ) {
        refValue.current = element;
      }
      return true;
      // });
      // return true;
    }
  }

  // Handle event handlers (onclick, onchange, etc.)
  if (attributeName.startsWith("on")) {
    const eventName = attributeName.slice(2).toLowerCase();
    /** @type {(event: Event) => void} */
    let handler = /** @type {any} */ (valueOrReactive);
    /** @type {undefined | boolean | AddEventListenerOptions} */
    let addOptions;
    /** @type {undefined | boolean | AddEventListenerOptions | EventListenerOptions} */
    let removeOptions;

    // Handle [handler, options] format
    if (Array.isArray(valueOrReactive)) {
      handler = valueOrReactive[0];
      if (typeof valueOrReactive[1] === "boolean") {
        addOptions = valueOrReactive[1];
        removeOptions = valueOrReactive[1];
      } else if (typeof valueOrReactive[1] === "object") {
        addOptions = valueOrReactive[1].onAdd;
        removeOptions = valueOrReactive[1].onRemove;
      }
    }

    // Add event listener
    element.addEventListener(eventName, handler, addOptions);

    // Ensure event listener is removed when scope is disposed
    onScopeCleanup(() => {
      element.removeEventListener(eventName, handler, removeOptions);
    });
    return true;
  }

  // Not a special attribute, should use standard setAttribute
  return false;
}

/**
 * @param {de100x.TElement} element - DOM element to modify
 * @param {string} attributeName - Name of the attribute
 * @param {unknown} valueOrReactive - Value or reactive getter function
 * @returns {boolean} Always returns true (for consistent API)
 */
function setStandardAttribute(element, attributeName, valueOrReactive) {
  handleReactiveValue(valueOrReactive, (value) => {
    // Special handling for boolean attributes (present/absent)
    if (typeof value === "boolean") {
      if (value) {
        element.setAttribute(attributeName, "");
      } else {
        element.removeAttribute(attributeName);
      }
      return;
    }

    // Standard string attributes
    element.setAttribute(attributeName, /** @type {string} */ (value));
  });
  return true;
}

/**
 * @param {string} namespace - Attribute namespace URI
 * @param {de100x.TElementNS} element - DOM element to modify
 * @param {string} attributeName - Name of the attribute
 * @param {unknown} valueOrReactive - Value or reactive getter function
 */
function setNamespacedAttribute(
  namespace,
  element,
  attributeName,
  valueOrReactive,
) {
  handleReactiveValue(valueOrReactive, (value) => {
    // Special handling for boolean attributes (present/absent)
    if (typeof value === "boolean") {
      if (value) {
        element.setAttributeNS(namespace, attributeName, "");
      } else {
        element.removeAttributeNS(namespace, attributeName);
      }
      return;
    }

    // Standard string attributes with namespace
    element.setAttributeNS(
      namespace,
      attributeName,
      /** @type {string} */ (value),
    );
  });
}

/**
 * 🌳 Appends a child to a parent element
 *
 * Handles various child types:
 * - DOM nodes (appended directly)
 * - Primitives (converted to text nodes)
 * - Arrays (processed recursively)
 * - Functions (processed reactively)
 *
 * @param {Element|DocumentFragment} parentElement - Element to append to
 * @param {de100x.TChild} child - Child to append
 */
function appendChild(parentElement, child) {
  // Skip null/undefined children
  if (child == null) return;

  // Handle array of children
  if (Array.isArray(child)) {
    appendChildren(parentElement, child);
    return;
  }

  // Handle reactive children (functions)
  if (typeof child === "function") {
    /** @type {Element|Text|null|undefined} */
    let oldChild;

    // Simple version (will be replaced by scope version below)
    $effect(() => {
      const newChild = child();

      if (Array.isArray(newChild)) {
        return appendChildren(parentElement, newChild);
      }

      if (typeof newChild === "function") {
        return appendChild(parentElement, newChild);
      }

      const elementToBeInserted = /** @type {Element} */ (
        typeof newChild === "string" || typeof newChild === "number"
          ? document.createTextNode(String(newChild))
          : newChild
      );

      if (oldChild) {
        if (elementToBeInserted) {
          oldChild.parentNode?.insertBefore(elementToBeInserted, oldChild);
        }

        oldChild.remove();
        oldChild = elementToBeInserted;
      } else {
        if (newChild) {
          parentElement.append(elementToBeInserted);
        }
        oldChild = elementToBeInserted;
      }
    });

    // More sophisticated two-tier scope structure for proper cleanup
    const outerScope = createScope(() => {
      /** @type {HTMLCollection|(Element|Text)[]|Element|Text|null|undefined} */
      let prevChild;

      /**
       * Creates a scope for rendering a specific child value
       *
       * The flow here is:
       * - A two tier scope structure
       * - The outer scope is for the child function, to manage the lifecycle of the child if it happens to have a signal
       * - The inner scope is for the child rendering, it
       *   - It will try to append the child to the parent element if there is no previous child/children
       *   - If there is a previous child/children, it will append the new child before the previous child/children, then remove the previous child/children
       *   - In case it's an array, it will create a document fragment and append the children to it using appendChildren which will keep calling recursively between it and the appendChild function until it's done
       *   - Then it will append the document fragment to the parent element, and remove the previous child/children
       *
       * @param {de100x.TChild} newChild
       */
      const createInnerScope = (newChild) => {
        return createScope(() => {
          // Handle array of children
          if (Array.isArray(newChild)) {
            return appendChildren(parentElement, newChild);
          }

          /** @type {Element|DocumentFragment} */
          let elementToBeInserted;

          // Handle reactive function child
          if (typeof newChild === "function") {
            elementToBeInserted = document.createDocumentFragment();
            appendChildren(
              elementToBeInserted,
              /** @type {de100x.TChild[]} */ (newChild()),
            );
          } else {
            // Handle primitive or element child
            elementToBeInserted = /** @type {Element} */ (
              typeof newChild === "string" || typeof newChild === "number"
                ? document.createTextNode(String(newChild))
                : newChild
            );
          }

          // Handle document fragment special case
          if (elementToBeInserted instanceof DocumentFragment) {
            prevChild = elementToBeInserted.children;
            parentElement.append(elementToBeInserted);
          }
          // Handle replacing existing children
          else if (prevChild) {
            if (
              Array.isArray(prevChild) ||
              prevChild instanceof HTMLCollection
            ) {
              prevChild[0].parentNode?.insertBefore(
                elementToBeInserted,
                prevChild[0],
              );
              for (const elem of prevChild) elem.remove();
            } else {
              prevChild.parentNode?.insertBefore(
                elementToBeInserted,
                prevChild,
              );
              prevChild.remove();
            }

            prevChild = elementToBeInserted;
          }
          // Handle document fragment parent
          else if (parentElement instanceof DocumentFragment) {
            parentElement.append(elementToBeInserted);
          }
          // Handle normal element parent with no previous children
          else {
            parentElement.appendChild(elementToBeInserted);
            prevChild = elementToBeInserted;
          }
        });
      };

      /** @type {ScopeResult<void>|undefined} */
      let innerScope;

      // React to changes in the child function's result
      $effect(() => {
        const newChild = child();

        // Clean up previous render
        innerScope?.dispose();

        // Render new child
        innerScope = createInnerScope(newChild);

        // Clean up orphaned elements (should be redundant with dispose, but just in case)
        if (Array.isArray(prevChild) || prevChild instanceof HTMLCollection)
          for (const elem of prevChild) elem.remove();
        else if (prevChild) prevChild.remove();
      });

      // Clean up on scope disposal
      onScopeCleanup(() => {
        innerScope?.dispose();

        if (Array.isArray(prevChild) || prevChild instanceof HTMLCollection)
          for (const elem of prevChild) elem.remove();
        else if (prevChild) prevChild.remove();
      });
    });

    // Clean up outer scope when parent is disposed
    onScopeCleanup(() => outerScope.dispose());
    return;
  }

  // Handle direct DOM nodes and primitives
  parentElement.append(
    typeof child === "string" || typeof child === "number"
      ? document.createTextNode(String(child))
      : child,
  );
}

/**
 * @param {Element|DocumentFragment} element - Element to append to
 * @param {de100x.TChild[]} children - Children to append
 */
function appendChildren(element, children) {
  for (let child of children) {
    appendChild(element, child);
  }
}

/**
 * 🧪 Normalizes a child into a DOM node
 *
 * Converts different child types into DOM nodes:
 * - DOM nodes are used directly
 * - Arrays are processed recursively
 * - Primitives are converted to text nodes
 *
 * @param {{
 *  child: de100x.TChild;
 *  isLastRenderedChild: boolean;
 *  onNormalize?: (options: {
 * 		elementToBeInserted: Element|Text,
 * 		originalChild: de100x.TChild,
 * 		counter: number,
 * 		isLastRenderedChild: boolean,
 * 	}) => void;
 *  fragment: DocumentFragment;
 *  nodeKey?: string|number
 * }} options - Normalization options
 * @param {number} [counter] - Current child index
 * @returns {number} Updated counter
 */
function normalizeChild(options, counter = 0) {
  const child = options.child;

  // Handle DOM nodes directly
  if (child instanceof Node) {
    // Add tracking ID if provided
    if (options.nodeKey) {
      /** @type {HTMLElement} */ (child).dataset.trackId = String(
        options.nodeKey,
      );
    }

    // Call normalization callback
    options.onNormalize?.({
      elementToBeInserted: /** @type {Element} */ (child),
      originalChild: child,
      counter: counter++,
      isLastRenderedChild: options.isLastRenderedChild,
    });

    // Add to fragment
    options.fragment.appendChild(child);
  }
  // Handle arrays recursively
  else if (Array.isArray(child)) {
    counter = normalizeChildren({ ...options, children: child }, counter);
  }
  // Handle primitives by creating text nodes
  else {
    const textNode = document.createTextNode(
      child == null ? "" : String(child),
    );

    // Call normalization callback
    options.onNormalize?.({
      elementToBeInserted: textNode,
      originalChild: child,
      counter: counter++,
      isLastRenderedChild: options.isLastRenderedChild,
    });

    // Add to fragment
    options.fragment.appendChild(textNode);
  }

  return counter;
}

/**
 * 🧪 Normalizes multiple children into DOM nodes
 *
 * Iterates through children array and normalizes each child.
 *
 * @param {{
 *  children: de100x.TChild[];
 *  onNormalize?: (options: {
 * 		elementToBeInserted: Element|Text,
 * 		originalChild: de100x.TChild,
 * 		counter: number,
 * 		isLastRenderedChild: boolean,
 * 	}) => void;
 *  fragment: DocumentFragment;
 *  nodeKey?: string|number
 * }} options - Normalization options
 * @param {number} [counter] - Starting counter value
 * @returns {number} Final counter value
 */
function normalizeChildren(options, counter = 0) {
  for (let i = 0; i < options.children.length; i++) {
    const child = options.children[i];

    counter = normalizeChild(
      {
        child,
        isLastRenderedChild: i === options.children.length - 1,
        onNormalize: options.onNormalize,
        fragment: options.fragment,
        nodeKey: options.nodeKey,
      },
      counter,
    );
  }
  return counter;
}

const pendingUpdates = new Map();
let nextUpdateUIId = 0;
/**
 * @param {() => void} cb
 * @param {'critical'|'visual'|'background'} priority
 */
function updateUI(cb, priority = "visual") {
  const updateId = nextUpdateUIId++;

  // Schedule new update
  let handle;

  switch (priority) {
    case "critical":
      queueMicrotask(() => {
        if (!pendingUpdates.has(updateId)) {
          return;
        }
        cb();
        pendingUpdates.delete(updateId);
      });
      break;
    case "visual":
      handle = requestAnimationFrame(() => {
        cb();
        pendingUpdates.delete(updateId);
      });
      break;
    case "background":
      handle = requestIdleCallbackPolyfill(
        () => {
          cb();
          pendingUpdates.delete(updateId);
        },
        { timeout: 2000 },
      );
      break;
  }

  pendingUpdates.set(updateId, { priority, handle });
  return updateId;
}

/** @param {number} id */
function cancelUpdateUI(id) {
  if (pendingUpdates.has(id)) {
    const { priority, handle } = pendingUpdates.get(id);
    if (priority === "visual") cancelAnimationFrame(handle);
    else if (priority === "background") cancelIdleCallbackPolyfill(handle);
    pendingUpdates.delete(id);
  }
}

/**
 * @template {any[]} TValue
 * @param {SignalValue<TValue>|MemoValue<TValue>} list - Signal containing array data
 * @param {(item: TValue[number], index: number, items: TValue) => string|number} key - Function to generate a unique key for each item
 * @param {(item: SignalValue<TValue[number]>, index: number, items: TValue) => de100x.TChildPrimitive | de100x.TChildPrimitive[]} renderItem - Function to render an item
 * @returns {de100x.TChildPrimitive} A placeholder node that anchors the list
 */
function $list(list, key, renderItem) {
  // Create a placeholder comment to anchor the list in the DOM
  const placeholder = document.createComment(`scope-${getScopeId()}-list`);

  /**
   * @typedef {{
   *  signal: SignalValue<any>
   *  scope: ScopeResult<void>
   *  lastElementToBeInserted: Element|Text
   * }} NodeEntry
   */

  /** @type {Map<string|number, NodeEntry>} */
  let prevEntries = new Map();

  /**
   * Updates an existing node entry with new data but keeps the DOM nodes
   *
   * @param {{
   *  item: SignalValue<any>
   *  nodeKey: string|number
   *  oldEntry: NodeEntry
   *  prevAnchor: Node
   *  newNodes: Map<string|number, NodeEntry>
   *  i: number
   *  listValue: TValue
   * }} props - Update parameters
   */
  function updateExistingEntry(props) {
    // // Reuse the old node by updating the signal value
    // // Note: This leverages the signal's built-in equality check
    // props.oldEntry.signal.set(props.item);
    // props.prevAnchor = props.oldEntry.lastElementToBeInserted;
    // props.newNodes.set(props.nodeKey, props.oldEntry);
    // Reuse the old node by updating the signal value
    props.oldEntry.signal.set(props.item);

    // Get the element we need to reposition
    const element = props.oldEntry.lastElementToBeInserted;

    // First, check if this element needs repositioning
    // by looking at what should come after it
    /** @type {Element|Text|Comment|undefined} */
    let insertBefore = placeholder;

    // Check for next element in the updated array order
    if (props.listValue.length > props.i + 1) {
      for (let j = props.i + 1; j < props.listValue.length; j++) {
        const nextItem = props.listValue[j];
        const nextNodeKey =
          typeof nextItem !== "undefined"
            ? key(nextItem, j, props.listValue)
            : undefined;

        if (nextNodeKey && props.newNodes.has(nextNodeKey)) {
          // Found the next element in new array order
          insertBefore =
            props.newNodes.get(nextNodeKey)?.lastElementToBeInserted;
          if (insertBefore) {
            break;
          }
        }
      }
    }

    // Only reposition if the element isn't already in the right place
    // This is an optimization to avoid unnecessary DOM operations
    if (
      insertBefore != null &&
      element.nextSibling !== insertBefore &&
      element.parentNode
    ) {
      element.parentNode.insertBefore(element, insertBefore);
    }

    // Update the prevAnchor for next items
    props.prevAnchor = element;
    props.newNodes.set(props.nodeKey, props.oldEntry);
  }

  /**
   * Creates a new node entry with its own scope and signal
   *
   * @param {{
   *  item: SignalValue<any>
   *  nodeKey: string | number
   *  i: number
   *  listValue: TValue
   *  prevAnchor: Node
   *  newNodes: Map<string|number, NodeEntry>
   * }} props - Creation parameters
   */
  function createNewEntry(props) {
    const scope = createScope(() => {
      // Create a signal for this item that can be updated
      const signal = $signal(props.item);
      signal(); // Read to establish initial value

      // Render the item
      const elems = renderItem(signal, props.i, props.listValue);
      const memoizedElems = Array.isArray(elems) ? elems : [elems];

      // Prepare for DOM insertion
      /** @type {Map<de100x.TChild, (Element|Text)>} */
      const childrenMemo = new Map();
      const fragment = document.createDocumentFragment();
      /** @type {Element|Text|undefined} */
      let lastElementToBeInserted;

      // Normalize the children and track the last element
      normalizeChildren({
        children: memoizedElems,
        onNormalize: (options) => {
          childrenMemo.set(options.originalChild, options.elementToBeInserted);
          if (options.isLastRenderedChild) {
            lastElementToBeInserted = options.elementToBeInserted;
          }
        },
        fragment,
        nodeKey: props.nodeKey,
      });

      const prevAnchor = props.prevAnchor;

      // Ensure DOM operations happen after initial rendering
      const updateUIId = updateUI(() => {
        // If nothing was rendered, clean up and skip
        if (!lastElementToBeInserted) {
          scope.dispose();
          return;
        }

        // Insert the new content before the anchor
        prevAnchor.parentNode?.insertBefore(fragment, prevAnchor);

        // Track the new entry
        props.newNodes.set(props.nodeKey, {
          signal,
          scope,
          lastElementToBeInserted,
        });

        // Update the anchor for the next item
        props.prevAnchor = lastElementToBeInserted;
      });

      // Cleanup when this scope is disposed
      onScopeCleanup(() => {
        cancelUpdateUI(updateUIId);

        for (const [, elem] of childrenMemo) {
          elem.remove();
        }
        props.newNodes.delete(props.nodeKey);
      });
    });
  }

  /**
   * Removes entries that are no longer in the list
   *
   * @param {{
   *  newNodes: Map<string|number, NodeEntry>
   * }} props - Cleanup parameters
   */
  function removeStaleEntries(props) {
    for (const [oldKey, oldEntry] of prevEntries) {
      if (!props.newNodes.has(oldKey)) {
        oldEntry.scope.dispose();
      }
    }
  }

  /** @type {number} */
  let updateUIId;
  // Main effect that reacts to list changes
  $effect(() => {
    /** @type {Map<string|number, NodeEntry>} */
    const newNodes = new Map();
    const listValue = list();
    const oldSize = prevEntries.size;
    const newSize = listValue.length;
    const maxLength = Math.max(oldSize, newSize);

    // Use microtask to ensure DOM is ready

    updateUIId = updateUI(() => {
      /** @type {Node} */
      let prevAnchor = placeholder;

      // Process each item in the list
      for (let i = 0; i < maxLength; i++) {
        const item = listValue[i];
        const nodeKey =
          typeof item !== "undefined" ? key(item, i, listValue) : undefined;
        const oldEntry = nodeKey ? prevEntries.get(nodeKey) : undefined;

        // Skip undefined items (might happen when list shrinks)
        if (!nodeKey) {
          continue;
        }

        // Update existing entry if possible
        if (oldEntry) {
          updateExistingEntry({
            item,
            newNodes,
            nodeKey,
            oldEntry,
            prevAnchor,
            i,
            listValue,
          });
          // Track that we've processed this entry
          prevEntries.delete(nodeKey);
        } else {
          // Check for next existing element to insert properly, this should be working if there is `prevEntries`
          let hasNewNextElement = false;
          if (prevEntries.size > 0) {
            for (let j = i + 1; j < maxLength; j++) {
              const nextItem = listValue[j];
              const nextNodeKey =
                typeof nextItem !== "undefined"
                  ? key(nextItem, j, listValue)
                  : undefined;

              if (nextNodeKey && prevEntries.has(nextNodeKey)) {
                const nextElement =
                  prevEntries.get(nextNodeKey)?.lastElementToBeInserted;
                if (nextElement) {
                  prevAnchor = nextElement;
                  hasNewNextElement = true;
                  break;
                }
                // If element not found, continue searching in later positions
              }
            }
          }

          // If no new next element found, use the placeholder
          if (!hasNewNextElement) {
            prevAnchor = placeholder;
          }

          // There should be a batching mechanism to avoid the delay of the DOM, for create and remove and reordering
          // Create a new entry for this item
          createNewEntry({
            item,
            nodeKey,
            i,
            listValue,
            prevAnchor,
            newNodes,
          });
        }
      }

      // Remove any entries not in the new list
      removeStaleEntries({ newNodes });

      // Update the entries map for the next render
      prevEntries = newNodes;
    });
  });

  // Clean up all entries when unmounted
  onScopeCleanup(() => {
    cancelUpdateUI(updateUIId);
    for (const [, entry] of prevEntries) {
      entry.scope.dispose();
    }
    prevEntries.clear();
  });

  return placeholder;
}

/**
 * @param {() => boolean | undefined | null} condition - Signal that determines visibility
 * @param {() => de100x.TChildPrimitive | de100x.TChildPrimitive[]} renderContent - Function to render the content when visible
 * @param {object} [options] - Configuration options
 * @param {"remove"|"keep"} [options.behaviorOnUnmount="remove"] - What to do with DOM nodes when hidden
 * @returns {de100x.TChildPrimitive} A placeholder node that anchors the content
 */
function $toggle(
  condition,
  renderContent,
  { behaviorOnUnmount = "remove" } = {},
) {
  // Create a placeholder comment to anchor the conditional content
  const placeholder = document.createComment(`scope-${getScopeId()}-visible`);

  // Create outer scope to manage the conditional rendering
  const outerScope = createScope(() => {
    const shouldShowMemo = $memo(() => !!condition());
    /** @type {boolean|undefined} */
    let prevShouldShow;
    let shouldShow = false;

    /** @type {(Element|Text)[]} */
    let currentElements = [];

    /**
     * Removes all elements from the DOM
     */
    function clearCurrentElements() {
      if (behaviorOnUnmount === "remove") {
        for (const elem of currentElements) {
          elem.remove();
        }
        currentElements.length = 0;
      } else {
        throw new Error(
          "Behavior on unmount other than 'remove' is not implemented yet.",
        );
      }
    }

    /** @type {number} */
    let renderToDomUpdateUIId;

    /**
     * Renders content to the DOM
     *
     * @param {boolean} isVisible - Whether the content should be visible
     */
    function renderToDOM(isVisible) {
      // Always clear previous elements
      clearCurrentElements();

      // Get the content to render
      const content = renderContent();
      const elements = Array.isArray(content) ? content : [content];
      const fragment = document.createDocumentFragment();

      // Normalize elements and track them for later cleanup
      normalizeChildren({
        children: elements,
        onNormalize: (options) => {
          currentElements[options.counter] = options.elementToBeInserted;
        },
        fragment,
      });

      // Clear the temporary array to avoid memory leaks
      elements.length = 0;

      // Add to DOM after rendering is complete

      renderToDomUpdateUIId = updateUI(() => {
        if (isVisible) {
          placeholder.parentNode?.insertBefore(fragment, placeholder);
        } else {
          clearCurrentElements();
        }
      });
    }

    /**
     * Creates a scope for rendering content
     */
    function createContentScope() {
      return createScope(() => {
        renderToDOM(shouldShow);

        // Clean up when this scope is disposed
        onScopeCleanup(() => {
          cancelUpdateUI(renderToDomUpdateUIId);
          clearCurrentElements();
        });
      });
    }

    // Initial render
    let innerScope = createContentScope();

    /** @type {number} */
    let changeEffectUpdateUIId;

    // React to condition changes
    $effect(() => {
      shouldShow = shouldShowMemo();

      changeEffectUpdateUIId = updateUI(() => {
        if (prevShouldShow === shouldShowMemo.peek()) {
          return;
        }

        if (behaviorOnUnmount === "remove") {
          if (shouldShow) {
            // If showing, create a new scope to render content
            innerScope = createContentScope();
          } else {
            // If hiding, dispose the current scope
            innerScope.dispose();
          }
        } else {
          // For future "keep" implementation: cache elements instead of removing
          throw new Error(
            "Behavior on unmount other than 'remove' is not implemented yet.",
          );
        }

        prevShouldShow = shouldShow;
      });
    });

    // Clean up when outer scope is disposed
    onScopeCleanup(() => {
      cancelUpdateUI(changeEffectUpdateUIId);
      cancelUpdateUI(renderToDomUpdateUIId);
      innerScope.dispose();
    });
  });

  // Clean up outer scope when component is unmounted
  onScopeCleanup(() => {
    outerScope.dispose();
  });

  return placeholder;
}

/**
 * @template {string|number} TKey
 * @param {{ [Key in TKey]: () => de100x.TChildPrimitive | de100x.TChildPrimitive[] }} cases - Functions to render for each case
 * @param {SignalValue<TKey>|MemoValue<TKey>} condition - Signal that determines which case to render
 * @param {object} [options] - Configuration options
 * @param {"remove"|"keep"} [options.behaviorOnUnmount="remove"] - What to do with DOM nodes when switching cases
 * @param {() => de100x.TChildPrimitive | de100x.TChildPrimitive[]} [options.defaultCase] - Function to render if no case matches
 * @returns {de100x.TChildPrimitive} A placeholder node that anchors the content
 */
function $switch(
  cases,
  condition,
  { behaviorOnUnmount = "remove", defaultCase } = {},
) {
  // Create a placeholder comment to anchor the content
  const placeholder = document.createComment(`scope-${getScopeId()}-switch`);

  // Create outer scope to manage case rendering
  const outerScope = createScope(() => {
    const valueMemo = $memo(() => condition());

    /** @type {TKey|undefined} */
    let prevValue;
    /** @type {TKey} */
    let currentValue;

    /** @type {(Element|Text)[]} */
    let currentElements = [];

    /**
     * Removes all elements from the DOM
     */
    function clearCurrentElements() {
      if (behaviorOnUnmount === "remove") {
        for (const elem of currentElements) {
          elem.remove();
        }
        currentElements.length = 0;
      } else {
        throw new Error(
          "Behavior on unmount other than 'remove' is not implemented yet.",
        );
      }
    }

    /** @type {number} */
    let renderCaseUpdateUIId;
    /**
     * Renders the appropriate case to the DOM
     *
     * @param {TKey|undefined} caseValue - Which case to render
     */
    function renderCase(caseValue) {
      // Always clear previous elements
      clearCurrentElements();

      // Find the render function for this case
      const caseFn =
        caseValue != null ? cases[caseValue] ?? defaultCase : undefined;
      if (!caseFn) return;

      // Get the content to render
      const content = caseFn();
      const elements = Array.isArray(content) ? content : [content];
      const fragment = document.createDocumentFragment();

      // Normalize elements and track them for later cleanup
      normalizeChildren({
        children: elements,
        onNormalize: (options) => {
          currentElements[options.counter] = options.elementToBeInserted;
        },
        fragment,
      });

      // Clear the temporary array to avoid memory leaks
      elements.length = 0;

      // Add to DOM after rendering is complete

      renderCaseUpdateUIId = updateUI(() => {
        placeholder.parentNode?.insertBefore(fragment, placeholder);
      });
    }

    /**
     * Creates a scope for rendering a specific case
     *
     * @param {TKey|undefined} caseValue - Which case to render
     * @returns {ScopeResult<void>} The created scope
     */
    function createCaseScope(caseValue) {
      return createScope(() => {
        renderCase(caseValue);

        // Clean up when this scope is disposed
        onScopeCleanup(() => {
          cancelUpdateUI(renderCaseUpdateUIId);
          clearCurrentElements();
        });
      });
    }

    // Initial render
    let innerScope = createCaseScope(valueMemo.peek());

    /** @type {number} */
    let changeEffectUpdateUIId;

    // React to condition changes
    $effect(() => {
      currentValue = valueMemo();

      changeEffectUpdateUIId = updateUI(() => {
        if (prevValue === valueMemo.peek()) return;

        if (behaviorOnUnmount === "remove") {
          // Dispose previous case's scope
          innerScope.dispose();

          // Create a new scope for current case
          innerScope = createCaseScope(currentValue);
        } else {
          // For future "keep" implementation: cache elements instead of removing
          throw new Error(
            "Behavior on unmount other than 'remove' is not implemented yet.",
          );
        }

        prevValue = currentValue;
      });
    });

    // Clean up when outer scope is disposed
    onScopeCleanup(() => {
      cancelUpdateUI(changeEffectUpdateUIId);
      cancelUpdateUI(renderCaseUpdateUIId);
      innerScope.dispose();
    });
  });

  // Clean up outer scope when component is unmounted
  onScopeCleanup(() => {
    outerScope.dispose();
  });

  return placeholder;
}

// Export public API
export {
  setSpecialElementAttribute,
  setStandardAttribute,
  setNamespacedAttribute,
  appendChildren,
  $list,
  $toggle,
  $switch,
};
