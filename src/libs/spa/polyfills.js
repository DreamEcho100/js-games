// Warning: The following is polyfills for browser APIs that are not available in all browsers.
// Not fully compatible with the server for now

/**
 * @type {typeof window.document.startViewTransition}
 */
export const startViewTransition =
  window.document?.startViewTransition ??
  ((callbackOptions) => {
    callbackOptions?.();
    return {
      ready: Promise.resolve(void 0),
      finished: Promise.resolve(void 0),
      skipTransition: () => {},
      updateCallbackDone: Promise.resolve(void 0),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      types: new Set(),
    };
  });

export const requestIdleCallbackPolyfill =
  window.requestIdleCallback ??
  /**
   * @param {IdleRequestCallback} cb
   * @param {IdleRequestOptions|undefined} options
   * @returns {number}
   */
  function (cb, options) {
    const start = Date.now();
    return /** @type {number} */ (
      /** @type {unknown} */ (
        setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, options?.timeout ?? ("deviceMemory" in navigator && typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4 ? 200 : 50))
      )
    );
  };
export const cancelIdleCallbackPolyfill =
  window.cancelIdleCallback ?? window.clearTimeout;
