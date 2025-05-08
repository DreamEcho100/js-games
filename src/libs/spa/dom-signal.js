/**
 * @import { de100x } from "./dom.js";
 * @import { SignalValue, MemoValue, ScopeResult } from "./signals.js";
 */

import {
  createEffect,
  onScopeCleanup,
  getScopeId,
  createScope,
  createSignal,
  createMemo,
} from "./signals.js";

/*
valueOrCB
├─ function
│   ├─ createEffect(() => get value)
│   ├─ value is object
│   │   ├─ for each key
│   │   │   ├─ value is function → nested createEffect
│   │   │   └─ value is static → call onValueMap
│   └─ value is not object → call onValue
└─ object
    ├─ for each key
    │   ├─ value is function → nested createEffect
    │   └─ value is static → call onValueMap
    └─ value is not object → call onValue

*/

/**
 * @param {unknown} valueOrCB
 * @param {(value: string|number|null|undefined) => void} onValue
 * @param {(key: string, value: string|number|null|undefined) => void} onValueMap
 * @returns {void}
 */
function handleValueOrValueMap(valueOrCB, onValue, onValueMap) {
  if (typeof valueOrCB === "function") {
    createEffect(() => {
      const value = valueOrCB();
      if (typeof value === "object" && value !== null) {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            const _mapValue = value[key];
            if (typeof _mapValue === "function") {
              createEffect(() => {
                const mapValue = _mapValue();
                onValueMap(key, mapValue);
              });
            } else {
              onValueMap(key, _mapValue);
            }
          }
        }
        return;
      }

      onValue(value);
    });
    return;
  }

  if (typeof valueOrCB === "object" && valueOrCB !== null) {
    for (const key in valueOrCB) {
      if (Object.prototype.hasOwnProperty.call(valueOrCB, key)) {
        const _mapValue = /** @type {Record<String, any>} */ (valueOrCB)[key];
        if (typeof _mapValue === "function") {
          createEffect(() => {
            const mapValue = _mapValue();
            onValueMap(key, mapValue);
          });
        } else {
          onValueMap(key, _mapValue);
        }
      }
    }
    return;
  }

  onValue(/** @type {any} */ (valueOrCB));
}

/**
 * @param {unknown} valueOrCB
 * @param {(value: string|number|null|undefined) => void} onValue
 * @returns {void}
 */
function handleValueOrCb(valueOrCB, onValue) {
  if (typeof valueOrCB === "function") {
    createEffect(() => {
      const value = valueOrCB();
      onValue(value);
    });
    return;
  }

  onValue(/** @type {any} */ (valueOrCB));
}

function setGeneralTagAttribute(
  /** @type {de100x.Element} */ element,
  /** @type {string} */ key,
  /** @type {unknown} */ valueOrCB,
) {
  switch (key) {
    case "style": {
      handleValueOrValueMap(
        valueOrCB,
        (value) => {
          if (value == null) {
            element.style.cssText = "";
            return;
          }

          element.style.cssText = /** @type {string} */ (value);
        },
        (key, value) => {
          if (value == null) {
            element.style[/** @type {*} */ (key)] = "";
            return;
          }

          element.style[/** @type {*} */ (key)] = /** @type {string} */ (value);
        },
      );
      return true;
    }
    case "className": {
      handleValueOrCb(valueOrCB, (value) => {
        if (value == null) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          element.className = "";
          return;
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        element.className = /** @type {string} */ (value);
      });
      return true;
    }
    case "value": {
      handleValueOrCb(valueOrCB, (value) => {
        if (value == null) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          element.value = "";
          return;
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        element.value = /** @type {string} */ (value);
      });
      return true;
    }
    case "dataSet": {
      handleValueOrValueMap(
        valueOrCB,
        (value) => {
          if (value == null) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            element.dataset = {};
            return;
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          element.dataset = /** @type {Record<string, string>} */ (value);
        },
        (key, value) => {
          if (value == null) {
            element.dataset[key] = "";
            return;
          }

          element.dataset[key] = /** @type {string} */ (value);
        },
      );
      return true;
    }
    case "ariaSet": {
      /** @typedef {{ [Key in (keyof Element) & `aria${string}`]: Element[Key] }} AriaMap */
      /** @typedef {keyof AriaMap} AriaKey */

      /** @type {Set<AriaKey>} */
      let usedAriaKeys = new Set();

      handleValueOrValueMap(
        valueOrCB,
        /** @param {any} value  */
        (value) => {
          if (value == null) {
            if (usedAriaKeys.size > 0) {
              for (const key of usedAriaKeys) {
                element[/** @type {AriaKey} */ (key)] = "";
              }
            }
            usedAriaKeys.clear();
            return;
          }

          for (const key in value) {
            const ariaKey = /** @type {AriaKey} */ (key);
            const subValue = value[key];

            if (subValue == null) {
              element[/** @type {AriaKey} */ (key)] = "";
              return;
            }

            usedAriaKeys.add(ariaKey);
            element[/** @type {AriaKey} */ (key)] = /** @type {string} */ (
              subValue
            );
          }
        },
        (key, value) => {
          if (value == null) {
            element[/** @type {AriaKey} */ (key)] = "";
            return;
          }
          element[/** @type {AriaKey} */ (key)] = /** @type {string} */ (value);
        },
      );
      onScopeCleanup(() => {
        usedAriaKeys.clear();
      });
      return true;
    }
    case "dangerouslySetInnerHTML": {
      handleValueOrCb(valueOrCB, (value) => {
        // document.startViewTransition(() => {
        if (value == null) {
          element.innerHTML = "";
          return;
        }

        element.innerHTML = /** @type {string} */ (value);
        // });
      });

      return true;
    }
    case "ref": {
      const _value =
        /** @type {{ current: Element }|((element: Element) => void) } */ (
          valueOrCB
        );

      document.startViewTransition(() => {
        if (typeof _value === "function") {
          _value(element);
        } else if (
          _value &&
          typeof _value === "object" &&
          "current" in _value
        ) {
          _value.current = element;
        }
        return true;
      });
    }
  }

  if (key.startsWith("on")) {
    const listener = key.slice(2).toLowerCase();
    /** @type {undefined | boolean | AddEventListenerOptions} */
    /** @type {(event: Event) => void} */
    let value = /** @type {any} */ (valueOrCB);
    let addOptions;
    /** @type {undefined | boolean | AddEventListenerOptions | EventListenerOptions} */
    let removeOptions;

    if (Array.isArray(valueOrCB)) {
      value = valueOrCB[0];
      if (typeof valueOrCB[1] === "boolean") {
        addOptions = valueOrCB[1];
        removeOptions = valueOrCB[1];
      } else if (typeof valueOrCB[1] === "object") {
        addOptions = valueOrCB[1].onAdd;
        removeOptions = valueOrCB[1].onRemove;
      }
    } else {
      value = /** @type {any} */ (valueOrCB);
    }

    element.addEventListener(listener, value, addOptions);
    onScopeCleanup(() => {
      element.removeEventListener(listener, value, removeOptions);
    });
    return true;
  }

  return false;
}

function setTagAttribute(
  /** @type {de100x.Element} */ element,
  /** @type {string} */ key,
  /** @type {unknown} */ valueOrCB,
) {
  handleValueOrCb(valueOrCB, (value) => {
    if (typeof value === "boolean") {
      if (value) element.setAttribute(key, "");
      else element.removeAttribute(key);
      return;
    }

    element.setAttribute(key, /** @type {string} */ (value));
  });
  return true;
}
function setTagAttributeNS(
  /** @type {string} */
  namespace,
  /** @type {de100x.ElementNS} */ element,
  /** @type {string} */ key,
  /** @type {unknown} */ valueOrCB,
) {
  handleValueOrCb(valueOrCB, (value) => {
    if (typeof value === "boolean") {
      if (value) element.setAttributeNS(namespace, key, "");
      else element.removeAttributeNS(namespace, key);
      return;
    }

    element.setAttributeNS(namespace, key, /** @type {string} */ (value));
  });
}

// TODO: Should handle scopes too

/**
 * @param {Element} element
 * @param {de100x.Child} child
 */
function appendChild(element, child) {
  if (child == null) return;
  if (Array.isArray(child)) {
    appendChildren(element, child);
    return;
  }

  if (typeof child === "function") {
    /** @type {Element|Text|null|undefined} */
    let oldChild;

    createEffect(() => {
      const newChild = child();

      if (Array.isArray(newChild)) {
        return appendChildren(element, newChild);
      }

      if (typeof newChild === "function") {
        return appendChild(element, newChild);
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
          element.append(elementToBeInserted);
        }
        oldChild = elementToBeInserted;
      }
    });
    return;
  }

  element.append(
    typeof child === "string" || typeof child === "number"
      ? document.createTextNode(String(child))
      : child,
  );
}

/**
 * @param {Element} element
 * @param {de100x.Child[]} children
 */
function appendChildren(element, children) {
  for (let child of children) {
    appendChild(element, child);
  }
}

export {
  setGeneralTagAttribute,
  setTagAttribute,
  setTagAttributeNS,
  appendChildren,
};

/**
 * @param {{
 *  child: de100x.Child;
 *  isLastRenderedChild: boolean;
 *  onNormalize?: (options: {
 * 		elementToBeInserted: Element|Text,
 * 		originalChild: de100x.Child,
 * 		counter: number,
 * 		isLastRenderedChild: boolean,
 * 	}) => void;
 *  fragment: DocumentFragment;
 *  nodeKey?: string|number
 * }} options
 * @param {number} [counter]
 * @returns {number}
 */
function normalizeChild(options, counter = 0) {
  const child = options.child;
  if (child instanceof Node) {
    if (options.nodeKey) {
      /** @type {HTMLElement} */ (child).dataset.trackId = String(
        options.nodeKey,
      );
    }
    options.onNormalize?.({
      elementToBeInserted: /** @type {Element} */ (child),
      originalChild: child,
      counter: counter++,
      isLastRenderedChild: options.isLastRenderedChild,
    });
    options.fragment.appendChild(child);
  } else if (Array.isArray(child)) {
    counter = normalizeChildren({ ...options, children: child }, counter);
  } else {
    const textNode = document.createTextNode(
      child == null ? "" : String(child),
    );
    options.onNormalize?.({
      elementToBeInserted: textNode,
      originalChild: child,
      counter: counter++,
      isLastRenderedChild: options.isLastRenderedChild,
    });
    options.fragment.appendChild(textNode);
  }
  return counter;
}

/**
 * @param {{
 *  children: de100x.Child[];
 *  onNormalize?: (options: {
 * 		elementToBeInserted: Element|Text,
 * 		originalChild: de100x.Child,
 * 		counter: number,
 * 		isLastRenderedChild: boolean,
 * 	}) => void;
 *  fragment: DocumentFragment;
 *  nodeKey?: string|number
 * }} options
 * @param {number} [counter]
 * @returns {number}
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

/**
 * 🧩 List component
 * t
 * @template {any[]} TValue
 * @param {SignalValue<TValue>|MemoValue<TValue>} list - Signal value to iterate over
 * @param {(item: TValue[number], index: number, items: TValue) => string|number} key - Function to generate a unique key for each item
 * @param {(item: SignalValue<TValue[number]>, index: number, items: TValue) => de100x.ChildPrimitive | de100x.ChildPrimitive[]} fn - Function to generate elements for each item
 * @returns {de100x.ChildPrimitive}
 * @description
 * Creates a list of elements based on a signal value.
 * The `key` function is used to identify each item in the list.
 * The `fn` function is called for each item in the list to generate the corresponding DOM elements.
 */
//
// In a sense when an item signal on $list, is it disposed properly?
// and I don't think the prev result on a valid change for the `$toggle` and the `$switch`, need a way to clear the scope dependencies not without the scope it self, before adding new
//

function $list(list, key, fn) {
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
  let isUnmounted = false;

  /**
   *
   * @param {{
   *  item: SignalValue<any>
   *  nodeKey: string|number
   *  oldEntry: NodeEntry
   *  prevAnchor: Node
   *  newNodes: Map<string|number, NodeEntry>
   * }} props
   */
  function updateNodeEntry(props) {
    // Reuse the old node if the signal value hasn't changed _(it has a dirty check eternally)_
    props.oldEntry.signal.set(props.item);
    props.prevAnchor = props.oldEntry.lastElementToBeInserted;
    props.newNodes.set(props.nodeKey, props.oldEntry);
  }

  /**
   * @param {{
   *  item: SignalValue<any>
   *  nodeKey: string | number
   *  i: number
   *  listValue: TValue
   *  prevAnchor: Node
   *  newNodes: Map<string|number, NodeEntry>
   * }} props
   */
  function generateScopedSignal(props) {
    const scope = createScope(() => {
      const signal = createSignal(props.item);
      signal();

      const elems = fn(signal, props.i, props.listValue);
      const memoizedElems = Array.isArray(elems) ? elems : [elems];

      /** @type {Map<de100x.Child, (Element|Text)>} */
      const childrenMemo = new Map();
      const fragment = document.createDocumentFragment();
      /** @type {Element|Text|undefined} */
      let lastElementToBeInserted;
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

      queueMicrotask(() => {
        if (isUnmounted) {
          return;
        }

        if (!lastElementToBeInserted) {
          scope.dispose();
          return;
        }

        props.prevAnchor.parentNode?.insertBefore(fragment, props.prevAnchor);
        props.newNodes.set(props.nodeKey, {
          signal,
          scope,
          lastElementToBeInserted,
        });
        props.prevAnchor = lastElementToBeInserted;
      });

      // // create an effect to update the elements when the signal changes
      // // Create and compare with the `childrenMemo` array
      // createEffect(() => {});

      // Cleanup the scope when the node is removed
      onScopeCleanup(() => {
        for (const [, elem] of childrenMemo) {
          elem.remove();
        }
        props.newNodes.delete(props.nodeKey);
      });
    });
  }

  /**
   * @param {{
   *  newNodes: Map<string|number, NodeEntry>
   * }} props
   */
  function removeLeftoverNodes(props) {
    for (const [oldKey, oldEntry] of prevEntries) {
      if (!props.newNodes.has(oldKey)) {
        oldEntry.scope.dispose();
      }
    }
  }

  createEffect(() => {
    /** @type {Map<string|number, NodeEntry>} */
    const newNodes = new Map();
    const listValue = list();
    const oldSize = prevEntries.size;
    const newSize = listValue.length;
    const maxLength = Math.max(oldSize, newSize);

    queueMicrotask(() => {
      if (isUnmounted) {
        return;
      }

      /** @type {Node} */
      let prevAnchor = placeholder;

      // Loop through the list and update or create DOM nodes as necessary
      for (let i = 0; i < maxLength; i++) {
        const item = listValue[i];
        const nodeKey =
          typeof item !== "undefined" ? key(item, i, listValue) : undefined;
        const oldEntry = nodeKey ? prevEntries.get(nodeKey) : undefined;

        if (!nodeKey) {
          // If the nodeKey is undefined, skip this iteration
          continue;
        }

        if (oldEntry) {
          // Reuse the old node if the signal value hasn't changed _(it has a dirty check eternally)_
          updateNodeEntry({
            item,
            newNodes,
            nodeKey,
            oldEntry,
            prevAnchor,
          });
          // Delete the old entry from the previous entries, so that the leftover nodes can be removed
          prevEntries.delete(nodeKey);
        } else {
          // Create a new node with a scope and memoized signal for the item
          generateScopedSignal({
            item,
            nodeKey,
            i,
            listValue,
            prevAnchor,
            newNodes,
          });
        }
      }

      // Remove leftover nodes not in the new list
      removeLeftoverNodes({ newNodes });

      prevEntries = newNodes;
    });
  });

  onScopeCleanup(() => {
    isUnmounted = true;
    for (const [, entry] of prevEntries) {
      entry.scope.dispose();
    }
    prevEntries.clear();
  });

  return placeholder;
}

/**
 * 🧩 Toggle component
 *
 * @param {() => boolean | undefined | null} condition - Signal value to determine visibility
 * @param {() => de100x.ChildPrimitive | de100x.ChildPrimitive[]} fn - Function to generate elements
 * @param {"remove"|"keep"} [behaviorOnUnmount] - Behavior on unmount _("remove" | "keep")_, not implemented for now
 * @returns {de100x.ChildPrimitive}
 * @description
 * Creates a toggle component that shows or hides elements based on a signal value.
 * The `fn` function is called to generate the elements to be shown or hidden.
 * The elements are removed from the DOM when not visible.
 */
function $toggle(condition, fn, behaviorOnUnmount = "remove") {
  const placeholder = document.createComment(`scope-${getScopeId()}-visible`);

  const outerScope = createScope(() => {
    let isOuterUnmounted = false;
    const shouldShowMemo = createMemo(() => !!condition());
    /** @type {boolean|undefined} */
    let prevShouldShow;
    let shouldShow = false;

    /** @type {(Element|Text)[]} */
    let currentElems = [];

    // /** @type {DocumentFragment|null} */
    // let cachedFragment = null;

    function clearCurrentElems() {
      const shouldRemove = behaviorOnUnmount === "remove";

      if (shouldRemove) {
        for (const elem of currentElems) {
          elem.remove();
        }
        currentElems.length = 0;
      } else {
        throw new Error(
          "Behavior on unmount other than 'remove' is not implemented yet.",
        );
      }
    }

    /** @param {boolean} currentShouldShow  */
    function render(currentShouldShow) {
      clearCurrentElems();
      const _result = fn();
      const elems = Array.isArray(_result) ? _result : [_result];
      const fragment = document.createDocumentFragment();

      normalizeChildren({
        children: elems,
        onNormalize: (options) => {
          currentElems[options.counter] = options.elementToBeInserted;
        },
        fragment,
      });

      elems.length = 0;

      queueMicrotask(() => {
        if (isOuterUnmounted) {
          return;
        }

        if (currentShouldShow) {
          placeholder.parentNode?.insertBefore(fragment, placeholder);
        } else {
          clearCurrentElems();
        }
      });
    }

    function createInnerScope() {
      return createScope(() => {
        render(shouldShow);

        onScopeCleanup(() => {
          clearCurrentElems();
        });
      });
    }

    let innerScope = createInnerScope();

    function shouldOuterHaltInitUpdate() {
      return isOuterUnmounted || prevShouldShow === shouldShowMemo.peek();
    }

    createEffect(() => {
      shouldShow = shouldShowMemo();

      queueMicrotask(() => {
        if (shouldOuterHaltInitUpdate()) {
          return;
        }

        if (behaviorOnUnmount === "remove") {
          if (shouldShow) {
            innerScope = createInnerScope();
          } else {
            innerScope.dispose();
          }
        } else {
          // Needs to mark the scope effects and it's nested scopes effects as inactive/halted/stopped
          // and then remove the elements from the DOM while caching them if the condition is false
          // if (behaviorOnUnmount === "keep") {
          //   if (!shouldShow && currentElems.length > 0) {
          //     // Store elements in a cached fragment
          //     cachedFragment = document.createDocumentFragment();
          //     for (const elem of currentElems) {
          //       cachedFragment.appendChild(elem);
          //     }
          //   } else if (shouldShow && cachedFragment) {
          //     // Restore from cache
          //     placeholder.parentNode?.insertBefore(cachedFragment, placeholder);
          //     cachedFragment = null;
          //   }
          // }
          throw new Error(
            "Behavior on unmount other than 'remove' is not implemented yet.",
          );
        }

        prevShouldShow = shouldShow;
      });
    });

    onScopeCleanup(() => {
      isOuterUnmounted = true;
      innerScope.dispose();
    });
  });

  onScopeCleanup(() => {
    outerScope.dispose();
  });

  return placeholder;
}

/**
 * 🧩 Switch component
 *
 * @template TValue
 * @param {SignalValue<TValue>|MemoValue<TValue>} condition - Signal value to determine which case to show
 * @param {{ [key: string | number]: () => de100x.ChildPrimitive | de100x.ChildPrimitive[] }} cases - Object mapping case keys to functions that generate elements
 * @returns {de100x.ChildPrimitive}
 * @description
 * Creates a switch component that shows different elements based on a signal value.
 * The `cases` object maps case keys to functions that generate the elements to be shown.
 * The elements are removed from the DOM when not visible.
 */
function $switch(condition, cases) {
  const placeholder = document.createComment(`scope-${getScopeId()}-switch`);

  createScope(() => {
    /** @type {(Element|Text)[]} */
    let currentElems = [];
    /** @type {string | number | null | undefined} */
    let oldCase;
    let isUnmounted = false;

    createEffect(() => {
      const value = /** @type {keyof typeof cases} */ (condition());
      const caseFn = cases[value];
      if (oldCase === value) {
        return;
      }
      queueMicrotask(() => {
        if (isUnmounted) {
          return;
        }

        oldCase = value;

        for (const elem of currentElems) {
          elem.remove();
        }
        currentElems = [];

        if (caseFn) {
          const _result = caseFn();
          const elems = Array.isArray(_result) ? _result : [_result];
          const fragment = document.createDocumentFragment();

          normalizeChildren({
            children: elems,
            onNormalize: (options) => {
              currentElems[options.counter] = options.elementToBeInserted;
            },
            fragment,
          });

          elems.length = 0;
          placeholder.parentNode?.insertBefore(fragment, placeholder);
        }
      });
    });

    onScopeCleanup(() => {
      isUnmounted = true;
      for (const elem of currentElems) {
        elem.remove();
      }
      currentElems = [];
    });
  });

  return placeholder;
}

export { $list, $toggle, $switch };

// dom.js
// dom-signal.js
// signals.js

/*
In handleValueOrValueMap, when you check typeof _mapValue === "function", technically you could allow signals that are not functions but have .get() methods later (if you expand your reactive system).
Not needed now, but possible future expansion if you go there.

For events, you could normalize the event listener value to always be a function.
(If someone accidentally passed null or non-function, it might cause weird runtime error.)
*/

// TODO: They should be able to
// - Take an element, valid primitive, or a scope
// - Check for transitions
// ========== Reactive DOM Components ==========

//  * @param {de100x.Child[]} children
//  * @param {(child: Element|Text, counter: number) => void} onNormalize
//  * @param {DocumentFragment} fragment
//  * @param {number} [counter]
