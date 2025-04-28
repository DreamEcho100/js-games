/**
 * @import { de100x } from "./dom.js";
 * @import { SignalValue } from "./signals.js";
 */

import { createEffect, onScopeCleanup, getScopeId } from "./signals.js";

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

      // document.startViewTransition(() => {
      if (typeof _value === "function") {
        _value(element);
      } else if (_value && typeof _value === "object" && "current" in _value) {
        _value.current = element;
      }
      return true;
      // });
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

export { setGeneralTagAttribute, setTagAttribute, setTagAttributeNS };

/*
In handleValueOrValueMap, when you check typeof _mapValue === "function", technically you could allow signals that are not functions but have .get() methods later (if you expand your reactive system).
Not needed now, but possible future expansion if you go there.

For events, you could normalize the event listener value to always be a function.
(If someone accidentally passed null or non-function, it might cause weird runtime error.)
*/

// ========== Reactive DOM Components ==========
// TODO: They should be able to
// - Take an element, valid primitive, or a scope
// - Check for transitions
/**
 * 🧩 List componen
 * t
 * @template {any[]} TValue
 * @param {SignalValue<TValue>} list - Signal value to iterate over
 * @param {(item: TValue[number], index: number, items: TValue) => string} key - Function to generate a unique key for each item
 * @param {(item: TValue[number], index: number, items: TValue) => de100x.ChildPrimitive | de100x.ChildPrimitive[]} fn - Function to generate elements for each item
 * @returns {de100x.ChildPrimitive}
 * @description
 * Creates a list of elements based on a signal value.
 * The `key` function is used to identify each item in the list.
 * The `fn` function is called for each item in the list to generate the corresponding DOM elements.
 */
function $list(list, key, fn) {
  const placeholder = document.createComment(`scope-${getScopeId()}list`);

  /** @typedef {{ value: TValue[number]; elems: (Element | Text)[] }} NodeEntry */

  /** @type {Map<string, NodeEntry>} */
  let nodes = new Map();

  createEffect(() => {
    /** @type {Map<string, NodeEntry>} */
    const newNodes = new Map();
    const listValue = list();
    const maxLength = Math.max(listValue.length, nodes.size);

    /** @type {Node} */
    let prevAnchor = placeholder;

    for (let i = 0; i < maxLength; i++) {
      const item = listValue[i];
      const nodeKey = key(item, i, listValue);
      const oldEntry = nodes.get(nodeKey);

      if (i < listValue.length && oldEntry && oldEntry.value === item) {
        // Reuse, but MOVE before previous anchor
        for (let j = oldEntry.elems.length - 1; j >= 0; j--) {
          const elem = oldEntry.elems[j];
          if (prevAnchor.parentNode) {
            prevAnchor.parentNode.insertBefore(elem, prevAnchor);
          }
        }
        newNodes.set(nodeKey, oldEntry);
      } else if (i < listValue.length) {
        // New node to add
        const _result = fn(item, i, listValue);
        const elems = Array.isArray(_result) ? _result : [_result];
        const normalizedElems = elems.map((elem) =>
          elem instanceof Node
            ? /** @type {Element} */ (elem)
            : document.createTextNode(elem == null ? "" : String(elem)),
        );

        for (let j = normalizedElems.length - 1; j >= 0; j--) {
          const elem = normalizedElems[j];
          prevAnchor.parentNode?.insertBefore(elem, prevAnchor);
        }

        newNodes.set(nodeKey, { value: item, elems: normalizedElems });
      }

      prevAnchor = newNodes.get(nodeKey)?.elems[0] ?? prevAnchor;
    }

    // Remove any leftover nodes not in new list
    for (const [oldKey, oldEntry] of nodes) {
      if (!newNodes.has(oldKey)) {
        for (const elem of oldEntry.elems) {
          elem.remove();
        }
      }
    }

    nodes = newNodes;
  });

  onScopeCleanup(() => {
    for (const { elems } of nodes.values()) {
      for (const elem of elems) {
        elem.remove();
      }
    }
    nodes.clear();
  });

  return placeholder;
}

/**
 * 🧩 Toggle component
 *
 * @template TValue
 * @param {SignalValue<TValue>} condition - Signal value to determine visibility
 * @param {() => de100x.ChildPrimitive | de100x.ChildPrimitive[]} fn - Function to generate elements
 * @returns {de100x.ChildPrimitive}
 * @description
 * Creates a toggle component that shows or hides elements based on a signal value.
 * The `fn` function is called to generate the elements to be shown or hidden.
 * The elements are removed from the DOM when not visible.
 */
function $toggle(condition, fn) {
  const placeholder = document.createComment(`scope-${getScopeId()}visible`);
  /** @type {(Element | Text)[]} */
  let currentElems = [];

  createEffect(() => {
    const shouldShow = condition();

    if (shouldShow) {
      const _result = fn();
      const elems = Array.isArray(_result) ? _result : [_result];
      currentElems = elems.map((elem) =>
        elem instanceof Node
          ? /** @type {Element} */ (elem)
          : document.createTextNode(elem == null ? "" : String(elem)),
      );

      for (const elem of currentElems) {
        placeholder.parentNode?.insertBefore(elem, placeholder);
      }
    } else {
      for (const elem of currentElems) {
        elem.remove();
      }
      currentElems = [];
    }
  });

  onScopeCleanup(() => {
    for (const elem of currentElems) {
      elem.remove();
    }
    currentElems = [];
  });

  return placeholder;
}

/**
 * 🧩 Switch component
 *
 * @template TValue
 * @param {SignalValue<TValue>} condition - Signal value to determine which case to show
 * @param {{ [key: string | number]: () => de100x.ChildPrimitive | de100x.ChildPrimitive[] }} cases - Object mapping case keys to functions that generate elements
 * @returns {de100x.ChildPrimitive}
 * @description
 * Creates a switch component that shows different elements based on a signal value.
 * The `cases` object maps case keys to functions that generate the elements to be shown.
 * The elements are removed from the DOM when not visible.
 */
function $switch(condition, cases) {
  const placeholder = document.createComment(`scope-${getScopeId()}switch`);
  /** @type {(Element | Text)[]} */
  let currentElems = [];
  /** @type {string | number | null | undefined} */
  let oldCase;

  createEffect(() => {
    const value = /** @type {keyof typeof cases} */ (condition());
    const caseFn = cases[value];
    if (oldCase === value) {
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
      currentElems = elems.map((elem) =>
        elem instanceof Node
          ? /** @type {Element} */ (elem)
          : document.createTextNode(elem == null ? "" : String(elem)),
      );

      for (const elem of currentElems) {
        placeholder.parentNode?.insertBefore(elem, placeholder);
      }
    }
  });

  onScopeCleanup(() => {
    for (const elem of currentElems) {
      elem.remove();
    }
    currentElems = [];
  });

  return placeholder;
}

export { $list, $toggle, $switch };
