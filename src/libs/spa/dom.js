// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./dom.d.ts" />

/**
 * @import {
 *  TagNameHTMLPropsMap,
 *  AttrsForHTMLTag,
 *  TChild,
 *  NS,
 *  TagName2ElementMap,
 *  AttrsForNSElement,
 *  GetNSElementByNS,
 *  TElementNS,
 *  TagNameSVGPropsMap,
 *  TagNameMathMLPropsMap,
 *  TagNameXHTMLPropsMap,
 *  TagsHTMLProxy,
 *  TagSVGMapProxy,
 *  TagMathMLMapProxy,
 *  TagXHTMLMapProxy,
 *  TagsProxy,
 * } from "./dom.ts";
 */
/** @export * from "./dom.d.ts"; */

import {
  appendChildren,
  setSpecialElementAttribute,
  setStandardAttribute,
  setNamespacedAttribute,
} from "./dom-signals.js";

/**
 * Returns an element with namespace namespace. Its namespace prefix will be everything before ":" (U+003E) in qualifiedName or null. Its local name will be everything after ":" (U+003E) in qualifiedName or qualifiedName.
 *
 * If localName does not match the Name production an "InvalidCharacterError" DOMException will be thrown.
 *
 * If one of the following conditions is true a "NamespaceError" DOMException will be thrown:
 *
 * localName does not match the QName production.
 * Namespace prefix is not null and namespace is the empty string.
 * Namespace prefix is "xml" and namespace is not the XML namespace.
 * qualifiedName or namespace prefix is "xmlns" and namespace is not the XMLNS namespace.
 * namespace is the XMLNS namespace and neither qualifiedName nor namespace prefix is "xmlns".
 *
 * When supplied, options's is can be used to create a customized built-in element.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createElementNS)
 */

// XML namespace constants
const SVG_NS = "http://www.w3.org/2000/svg";
const MathML_NS = "http://www.w3.org/1998/Math/MathML";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

/**
 * Creates an HTML element with attributes and children
 *
 * @template {keyof TagNameHTMLPropsMap} TTagName
 * @param {TTagName} tagName - HTML tag name (e.g., 'div', 'span')
 * @param {AttrsForHTMLTag<TTagName>} [attributes] - Element attributes and event handlers
 * @param {...TChild} children - TChild content (elements, text, or reactive functions)
 * @returns {HTMLElementTagNameMap[TTagName]} The created DOM element
 *
 * @description
 * Core function for creating HTML elements with proper attribute handling and
 * automatic children appending. Similar to React.createElement but for vanilla JS.
 *
 * - Handles standard HTML attributes, event handlers, and special properties
 * - Sets up reactive bindings for signal-based attributes
 * - Normalizes and appends all children with appropriate DOM operations
 *
 * For better developer experience, use element factory functions (t.div, t.span, etc.)
 * instead of calling this directly.
 */
function createHTMLElement(tagName, attributes, ...children) {
  // 1. Create the element
  const element = document.createElement(tagName);

  // 2. Assign props/attributes
  if (attributes) {
    for (const key in attributes) {
      if (
        !Object.prototype.hasOwnProperty.call(attributes, key) ||
        setSpecialElementAttribute(
          element,
          key,
          attributes[/** @type {keyof AttrsForHTMLTag<TTagName>} */ (key)],
        )
      ) {
        continue;
      }
      setStandardAttribute(
        element,
        /** @type {string} */ (key),
        attributes[/** @type {keyof AttrsForHTMLTag<TTagName>} */ (key)],
      );
    }
  }

  // 3. Append children
  appendChildren(element, children);

  return element;
}

/**
 * Creates a factory function for a specific HTML element type
 *
 * @template {keyof HTMLElementTagNameMap} TTagName
 * @param {TTagName} tagName - The HTML tag to create a factory for
 * @returns {(attributes?: AttrsForHTMLTag<TTagName>, ...children: TChild[]) => HTMLElementTagNameMap[TTagName]}
 *
 * @description
 * Returns a specialized function for creating a specific element type, offering:
 *
 * - More concise element creation syntax (t.div() vs createHTMLElement('div'))
 * - Better type inference for element-specific attributes
 * - Consistent API with less repetition in component code
 *
 * These factories are automatically created and cached by the tag proxy system.
 *
 * @example
 * const divFactory = htmlElementFactory('div');
 * const container = divFactory({className: 'container'}, 'Hello world');
 */
function htmlElementFactory(tagName) {
  return function (attributes, ...children) {
    return createHTMLElement(tagName, attributes, ...children);
  };
}

/**
 * Creates an element with a specific XML namespace
 *
 * @template {NS} TNS
 * @template {keyof TagName2ElementMap} TTagName
 * @param {TNS} namespace - XML namespace URI (SVG_NS, MathML_NS, XHTML_NS)
 * @param {TTagName} tagName - Element tag name
 * @param {AttrsForNSElement<TNS, TTagName>} [attributes] - Element attributes
 * @param {...TChild} children - TChild content
 * @returns {GetNSElementByNS<TNS>[TTagName]} The namespaced element
 *
 * @description
 * Creates elements in non-HTML namespaces like SVG, MathML, and XHTML.
 * Properly handles namespace-specific attributes and ensures correct
 * element creation with createElementNS.
 *
 * This is essential for:
 * - SVG graphics (paths, circles, etc.)
 * - MathML for mathematical notation
 * - XML-based documents with mixed namespaces
 *
 * For better developer experience, use t(SVG_NS).path() syntax instead
 * of calling this directly.
 */
function createNamespacedElement(namespace, tagName, attributes, ...children) {
  // 1. Create the element
  const element = document.createElementNS(namespace, tagName);

  // 2. Assign props/attributes
  if (attributes) {
    for (const key in attributes) {
      if (
        !Object.prototype.hasOwnProperty.call(attributes, key) ||
        setSpecialElementAttribute(
          /** @type {TElementNS} */ (element),
          key,
          attributes[
            /** @type {keyof AttrsForNSElement<TNS, TTagName>} */ (key)
          ],
        )
      ) {
        continue;
      }

      setNamespacedAttribute(
        namespace,
        /** @type {TElementNS} */ (element),
        key,
        attributes[/** @type {keyof AttrsForNSElement<TNS, TTagName>} */ (key)],
      );
    }
  }

  // 3. Append children
  appendChildren(element, children);

  return /** @type {GetNSElementByNS<TNS>[TTagName]} */ (
    /** @type {unknown} */ (element)
  );
}

/**
 * Creates a factory function for a specific namespaced element type
 *
 * @template {NS} TNS
 * @template {TNS extends typeof SVG_NS ? keyof TagNameSVGPropsMap : TNS extends typeof MathML_NS ? keyof TagNameMathMLPropsMap : TNS extends typeof XHTML_NS ? keyof TagNameXHTMLPropsMap : never} TTagName
 * @param {TNS} namespace - XML namespace URI (SVG_NS, MathML_NS, XHTML_NS)
 * @param {TTagName} tagName - Element tag name in the specified namespace
 * @returns {(attributes?: AttrsForNSElement<TNS,TTagName>, ...children: TChild[]) => GetNSElementByNS<TNS>[TTagName]}
 *
 * @description
 * Returns a specialized function for creating elements of a specific type
 * within a specific namespace. This enables concise and type-safe creation
 * of namespaced elements like SVG shapes.
 *
 * These factories are automatically created and cached by the namespace-specific
 * proxy systems.
 *
 * @example
 * const svgPathFactory = namespacedElementFactory(SVG_NS, 'path');
 * const path = svgPathFactory({d: 'M10 10 H 90 V 90 H 10 Z', fill: 'none', stroke: 'black'});
 */
function namespacedElementFactory(namespace, tagName) {
  return function (attributes, ...children) {
    if (typeof tagName !== "string") {
      throw new Error(`Invalid tag name: ${tagName}`);
    }
    return createNamespacedElement(
      namespace,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      tagName,
      attributes,
      ...children,
    );
  };
}

/** @type {Record<string, any>} */
const _htmlElementCache = {};
/** @type {TagsHTMLProxy} */
const htmlElementsProxy = new Proxy(
  /** @type {TagsHTMLProxy} */ (_htmlElementCache),
  {
    /**
     * @template {keyof HTMLElementTagNameMap} TTagName
     * @param {TagsHTMLProxy} _target - The target object, used for caching
     * @param {TTagName} tagName - HTML tag name to create factory for
     * @returns {(attributes?: AttrsForHTMLTag<TTagName>, ...children: TChild[]) => HTMLElementTagNameMap[TTagName]}
     */
    get(_target, tagName) {
      if (!(tagName in _htmlElementCache)) {
        /** @type {Record<string,any>} */ (_htmlElementCache)[tagName] =
          htmlElementFactory(tagName);
      }

      return _htmlElementCache[tagName];
    },
  },
);

/** @type {Record<string, any>} */
const _svgElementsCache = {};
/** @type {TagSVGMapProxy} */
const svgElementsProxy = new Proxy(
  /** @type {TagSVGMapProxy} */ (_svgElementsCache),
  {
    /**
     * @template {keyof TagNameSVGPropsMap} TTagName
     * @param {TagSVGMapProxy} _target - The target object, used for caching
     * @param {TTagName} tagName - SVG tag name to create factory for
     */
    get(_target, tagName) {
      if (!(tagName in _svgElementsCache)) {
        /** @type {Record<string,any>} */ (_svgElementsCache)[tagName] =
          namespacedElementFactory(SVG_NS, tagName);
      }

      return _svgElementsCache[tagName];
    },
  },
);

/** @type {Record<string, any>} */
const _mathMLElementsCache = {};
/** @type {TagMathMLMapProxy} */
const mathMLElementsProxy = new Proxy(
  /** @type {TagMathMLMapProxy} */ (_mathMLElementsCache),
  {
    /**
     * @template {keyof TagNameMathMLPropsMap} TTagName
     * @param {TagMathMLMapProxy} _target - The target object, used for caching
     * @param {TTagName} tagName - MathML tag name to create factory for
     */
    get(_target, tagName) {
      if (!(tagName in _mathMLElementsCache)) {
        /** @type {Record<string,any>} */ (_mathMLElementsCache)[tagName] =
          namespacedElementFactory(MathML_NS, tagName);
      }

      return _mathMLElementsCache[tagName];
    },
  },
);

/** @type {Record<string, any>} */
const _xhtmlElementsCache = {};
/** @type {TagXHTMLMapProxy} */
const xhtmlElementsProxy = new Proxy(
  /** @type {TagXHTMLMapProxy} */ (_xhtmlElementsCache),
  {
    /**
     * @template {keyof TagNameXHTMLPropsMap} TTagName
     * @param {TagXHTMLMapProxy} _target - The target object, used for caching
     * @param {TTagName} tagName - XHTML tag name to create factory for
     */
    get(_target, tagName) {
      if (!(tagName in _xhtmlElementsCache)) {
        /** @type {Record<string,any>} */ (_xhtmlElementsCache)[tagName] =
          namespacedElementFactory(XHTML_NS, tagName);
      }

      return _xhtmlElementsCache[tagName];
    },
  },
);

/**
 * The universal element creation proxy
 *
 * Provides a unified, elegant API for creating DOM elements across all namespaces.
 *
 * - HTML elements: t.div(), t.span(), etc.
 * - SVG elements: t(SVG_NS).path(), t(SVG_NS).circle(), etc.
 * - MathML elements: t(MathML_NS).math(), etc.
 * - XHTML elements: t(XHTML_NS).div(), etc.
 *
 * Benefits over direct DOM element creation:
 * - Cleaner, more readable syntax
 * - Automated attribute handling
 * - Type checking for element-specific attributes
 * - Proper namespace handling for mixed-namespace documents
 * - Efficient factory caching for better performance
 *
 * @type {TagsProxy}
 *
 * @example
 * // Creating a component with mixed HTML and SVG
 * function IconButton(props) {
 *   return t.button(
 *     { className: 'icon-button', onclick: props.onClick },
 *     t.span({}, props.label),
 *     t.svg({ width: 24, height: 24 },
 *       t(SVG_NS).path({ d: props.iconPath, fill: 'currentColor' })
 *     )
 *   );
 * }
 */
const elementCreator = new Proxy(
  /** @type {TagsProxy} */ (/** @type {unknown} */ (() => {})),
  {
    /**
     * Handles property access for HTML element factories (t.div, t.span, etc.)
     *
     * @template {keyof HTMLElementTagNameMap} TTagName
     * @param {any} _target - The target object (unused)
     * @param {TTagName} tagName - HTML tag name to create factory for
     * @returns {(attributes?: AttrsForHTMLTag<TTagName>, ...children: TChild[]) => HTMLElementTagNameMap[TTagName]}
     */
    get(_target, tagName) {
      if (tagName in _htmlElementCache) {
        return _htmlElementCache[tagName];
      }
      return htmlElementsProxy[tagName];
    },

    /**
     * Handles function calls to select a namespace (t(SVG_NS), etc.)
     *
     * @param {any} _target - The target object (unused)
     * @param {any} _thisArg - The this context (unused)
     * @param {any} argArray - The arguments array with namespace as first item
     * @returns {TagSVGMapProxy|TagMathMLMapProxy|TagXHTMLMapProxy} Namespace-specific proxy
     */
    apply(_target, _thisArg, argArray) {
      const namespaceURI = argArray[0];

      switch (namespaceURI) {
        case SVG_NS:
          return svgElementsProxy;
        case MathML_NS:
          return mathMLElementsProxy;
        case XHTML_NS:
          return xhtmlElementsProxy;
        default:
          if (typeof namespaceURI !== "string") {
            throw new Error(`Unsupported namespace URI: ${namespaceURI}`);
          }
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `Namespace URI "${namespaceURI}" is not supported. Defaulting to HTML namespace.`,
            );
          }

          return /** @type {ReturnType<TagsProxy>} */ (htmlElementsProxy);
      }
    },
  },
);

// We export as both the descriptive name and the concise name (t) for developer preference
export { elementCreator, elementCreator as t };
