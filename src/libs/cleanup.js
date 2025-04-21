/**
 * @typedef {null|(() => void)} CleanUpItem
 */
export class CleanUpManager {
  /** @type {CleanUpItem[]} */
  cleanUpItems = [];

  cleanUp() {
    for (const item of this.cleanUpItems) {
      item?.();
    }

    this.cleanUpItems.length = 0;
  }

  /** @param {() => void} cb  */
  register(cb) {
    return this.cleanUpItems.push(cb);
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
      // if (options.silent) {
      //   console.error("Element is required");
      //   return;
      // }
      // throw new Error("Element is required");
      return;
    }

    /** @type {HTMLElement}*/ (
      /** @type {unknown}*/ (options.elem)
    ).addEventListener(options.type, options.listener, options.options);

    this.register(() => {
      /** @type {HTMLElement}*/ (
        /** @type {unknown}*/ (options.elem)
      ).removeEventListener(options.type, options.listener, options.options);
    });
  }
}
