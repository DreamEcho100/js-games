/* eslint-disable @typescript-eslint/no-explicit-any */

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

// ========== ATTRIBUTE HANDLING ==========

/**
 * 🧩 Processes special element attributes/properties
 *
 * Handles attributes that need special treatment beyond simple setAttribute:
 * - style (as string or object)
 * - className
 * - value
 * - dataSet
 * - ariaSet
 * - dangerouslySetInnerHTML
 * - ref
 * - event handlers (on*)
 *
 * @param element - DOM element to modify
 * @param attributeName - Name of the attribute/property
 * @param valueOrReactive - Value or reactive getter function
 * @returns True if attribute was handled, false if it should use standard setAttribute
 */
export function setSpecialElementAttribute(
  element: Element,
  attributeName: string,
  valueOrReactive: unknown,
): boolean;

/**
 * 🧩 Sets a standard attribute on an element
 *
 * Handles both static and reactive attribute values, with special
 * handling for boolean attributes.
 *
 * @param element - DOM element to modify
 * @param attributeName - Name of the attribute
 * @param valueOrReactive - Value or reactive getter function
 * @returns Always returns true (for consistent API)
 */
export function setStandardAttribute(
  element: Element,
  attributeName: string,
  valueOrReactive: unknown,
): boolean;

/**
 * 🧩 Sets a namespaced attribute on an element
 *
 * Used for attributes in XML namespaces like SVG and MathML.
 *
 * @param namespace - Attribute namespace URI
 * @param element - DOM element to modify
 * @param attributeName - Name of the attribute
 * @param valueOrReactive - Value or reactive getter function
 */
export function setNamespacedAttribute(
  namespace: string,
  element: Element,
  attributeName: string,
  valueOrReactive: unknown,
): void;

/**
 * 🌳 Appends multiple children to a parent element
 *
 * Processes each child with the appendChild function.
 *
 * @param element - Element to append to
 * @param children - Children to append
 */
export function appendChildren(
  element: Element | DocumentFragment,
  children: Child[],
): void;

// ========== COMPONENT HELPERS ==========

/**
 * 🧩 Renders a reactive list with efficient updates
 *
 * Creates a dynamic list from an array signal, efficiently reusing DOM nodes
 * when items move or change, based on their keys.
 *
 * @template TValue - Array type
 * @param list - Signal containing array data
 * @param key - Function to generate a unique key for each item
 * @param renderItem - Function to render an item
 * @returns A placeholder node that anchors the list
 *
 * @example
 * // Render a dynamic list of todo items
 * const todos = $signal([
 *   { id: 1, text: 'Learn signals', done: false },
 *   { id: 2, text: 'Build app', done: false }
 * ]);
 *
 * const todoList = $list(
 *   todos,
 *   todo => todo.id,
 *   (todo, index) => t.li(
 *     { className: () => todo().done ? 'completed' : '' },
 *     t.span({}, () => todo().text),
 *     t.button({ onclick: () => markDone(index) }, 'Complete')
 *   )
 * );
 */

export function $list<TValue extends any[]>(
  list: SignalValue<TValue> | MemoValue<TValue>,
  key: (item: TValue[number], index: number, items: TValue) => string | number,
  renderItem: (
    item: SignalValue<TValue[number]>,
    index: number,
    items: TValue,
  ) => ChildPrimitive | ChildPrimitive[],
): ChildPrimitive;

/**
 * 🧩 Renders content conditionally based on a signal
 *
 * Shows or hides content based on a boolean signal value.
 * Efficiently mounts/unmounts content when the condition changes.
 *
 * @param condition - Signal that determines visibility
 * @param renderContent - Function to render the content when visible
 * @param options - Configuration options
 * @returns A placeholder node that anchors the content
 *
 * @example
 * // Show a loading indicator
 * const isLoading = $signal(true);
 *
 * // In your component:
 * return t.div({},
 *   $toggle(
 *     () => isLoading(),
 *     () => t.div({ className: 'loading-spinner' }, 'Loading...')
 *   ),
 *   $toggle(
 *     () => !isLoading(),
 *     () => t.div({}, 'Content loaded!')
 *   )
 * );
 */
export function $toggle(
  condition: () => boolean | undefined | null,
  renderContent: () => ChildPrimitive | ChildPrimitive[],
  options?: {
    behaviorOnUnmount?: "remove" | "keep";
  },
): ChildPrimitive;

/**
 * 🧩 Renders different content based on a signal value
 *
 * Like a switch statement for reactive UI rendering.
 *
 * @template TKey - Type of case keys (string or number)
 * @param cases - Functions to render for each case
 * @param condition - Signal that determines which case to render
 * @param options - Configuration options
 * @returns A placeholder node that anchors the content
 *
 * @example
 * // Render different UI states
 * const status = $signal('loading');
 *
 * // In your component:
 * return $switch(
 *   {
 *     'loading': () => t.div({}, 'Loading...'),
 *     'error': () => t.div({ className: 'error' }, 'An error occurred!'),
 *     'success': () => t.div({}, 'Data loaded successfully!')
 *   },
 *   status,
 *   { defaultCase: () => t.div({}, 'Unknown state') }
 * );
 */
export function $switch<TKey extends string | number>(
  cases: { [Key in TKey]: () => ChildPrimitive | ChildPrimitive[] },
  condition: SignalValue<TKey> | MemoValue<TKey>,
  options?: {
    behaviorOnUnmount?: "remove" | "keep";
    defaultCase?: () => ChildPrimitive | ChildPrimitive[];
  },
): ChildPrimitive;
