/**
 * @typedef {null|(() => void)} CleanupItem
 */
export class CleanupManager {
  /** @type {CleanupItem[]} */
  cleanupItems = [];

  cleanup() {
    for (const item of this.cleanupItems) {
      item?.();
    }

    this.cleanupItems.length = 0;
  }

  /** @param {() => void} cb  */
  register(cb) {
    return this.cleanupItems.push(cb);
  }

  /**
   *
   */

  /**
   * @template {keyof HTMLElementEventMap} TEventName
   * @template {Element} TElem
   *
   * @param {{
   * 	elem?: TElem | null;
   * 	type: TEventName;
   * 	listener: (this: Element, ev: HTMLElementEventMap[TEventName]) => any;
   * 	options?: boolean | EventListenerOptions
   * 	silent?: boolean
   * }} options
   */
  registerEventListener(options) {
    if (!options.elem) {
      if (options.silent) {
        console.error("Element is required");
        return () => {
          console.error("Element is required");
        };
      }
      throw new Error("Element is required");
    }

    /** @type {HTMLElement}*/ (
      /** @type {unknown}*/ (options.elem)
    ).addEventListener(options.type, options.listener, options.options);

    const cleanup = () => {
      /** @type {HTMLElement}*/ (
        /** @type {unknown}*/ (options.elem)
      ).removeEventListener(options.type, options.listener, options.options);
    };
    this.register(cleanup);

    return cleanup;
  }

  /**
   * @template {keyof WindowEventMap} TEventName
   *
   * @param {{
   * 	type: TEventName;
   * 	listener: (this: Window, ev: WindowEventMap[TEventName]) => any;
   * 	options?: boolean | EventListenerOptions
   * 	silent?: boolean
   * }} options
   */
  registerWindowEventListener(options) {
    window.addEventListener(options.type, options.listener, options.options);
    const cleanup = () => {
      window.removeEventListener(
        options.type,
        options.listener,
        options.options,
      );
    };
    this.register(cleanup);
  }
}
