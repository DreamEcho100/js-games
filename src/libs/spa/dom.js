/**
 * @namespace de100x
 */

import {
  setGeneralTagAttribute,
  setTagAttribute,
  setTagAttributeNS,
} from "./dom-signal";

/**
 *
 * @typedef {string|number|Node|undefined|null} de100x.ChildPrimitive
 * @typedef {de100x.ChildPrimitive|de100x.ChildPrimitive[]} de100x.Child
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const MathML_NS = "http://www.w3.org/1998/Math/MathML";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

/**
 * @typedef {typeof SVG_NS | typeof MathML_NS | typeof XHTML_NS} de100xNS
 */

/**
 * @typedef {HTMLElementTagNameMap} de100x.TagNameHTMLPropsMap
 * @typedef {HTMLElementEventMap} de100x.TagNameHTMLElementEventMap
 *
 * @typedef {SVGElementTagNameMap} de100x.TagNameSVGPropsMap
 * @typedef {SVGElementEventMap} de100x.TagNameSVGElementEventMap
 *
 * @typedef {MathMLElementTagNameMap} de100x.TagNameMathMLPropsMap
 * @typedef {MathMLElementEventMap} de100x.TagNameMathMLElementEventMap
 *
 * @typedef {HTMLElementTagNameMap} de100x.TagNameXHTMLPropsMap
 * @typedef {de100x.TagNameHTMLPropsMap | de100x.TagNameSVGPropsMap | de100x.TagNameMathMLPropsMap | de100x.TagNameXHTMLPropsMap} de100x.TagName2ElementMap
 */

/**
 * @template {de100xNS} TNS
 * @typedef {TNS extends typeof SVG_NS ? keyof de100x.TagNameSVGPropsMap : TNS extends typeof MathML_NS ? keyof de100x.TagNameMathMLPropsMap : TNS extends typeof XHTML_NS ? keyof de100x.TagNameXHTMLPropsMap : never} de100x.GetNSElementTagNameMapByNS
 */

/**
 * @template {de100xNS} TNS
 * @typedef {TNS extends typeof SVG_NS ? SVGElementTagNameMap :
 *  TNS extends typeof MathML_NS ? MathMLElementTagNameMap :
 *  TNS extends typeof XHTML_NS ? HTMLElementTagNameMap :
 *  never
 * } de100x.GetNSElementByNS<TNS>
 */

/**
 * @typedef {de100x.TagNameHTMLPropsMap[keyof de100x.TagNameHTMLPropsMap]} de100x.HTMLElement
 * @typedef {de100x.TagNameSVGPropsMap[keyof de100x.TagNameSVGPropsMap]} de100x.SVGElement
 * @typedef {de100x.TagNameMathMLPropsMap[keyof de100x.TagNameMathMLPropsMap]} de100x.MathMLElement
 * @typedef {de100x.TagNameXHTMLPropsMap[keyof de100x.TagNameXHTMLPropsMap]} de100x.XHTMLElement
 * @typedef {de100x.SVGElement | de100x.MathMLElement | de100x.XHTMLElement} de100x.ElementNS
 * @typedef {de100x.ElementNS | de100x.HTMLElement} de100x.Element
 */

/**
 * @template TValue
 * @typedef {TValue | null | undefined} de100x.Nullable
 */
/**
 * @template TValueOrCb
 * @typedef {de100x.Nullable<TValueOrCb> | (() => de100x.Nullable<TValueOrCb>)} de100x.NullableOrCb
 */

/**
 * @template {Element} Elem
 *
 * @typedef {{
 * 	dangerouslySetInnerHTML?: { __html: string };
 *  dataSet?: de100x.NullableOrCb<({ [key: string]: de100x.NullableOrCb<string> })>;
 *  ariaSet?: de100x.NullableOrCb<({ [key in keyof ARIAMixin]: de100x.NullableOrCb<ARIAMixin[key]> })>;
 *  style?: de100x.NullableOrCb<({ [key in keyof de100x.HTMLElement["style"]]?: de100x.NullableOrCb<de100x.HTMLElement["style"][key]> })>;
 *  ref?: { current: Elem } | ((element: Elem) => void);
 *  [`data-*`]?: de100x.NullableOrCb<string>;
 *  [`aria-*`]?: de100x.NullableOrCb<string>;
 * }} de100x.SharedAttributes
 */

/**
 * @template {Record<string, any>} TElemMap
 * @template {Record<string, any>} TEventMap
 * @template {keyof TElemMap} TTagName
 * @typedef {{
 *   [K in keyof TEventMap as `on${K & string}`]?:
 * 		((event: TEventMap[K] & { target: TElemMap[TTagName] }) => void) |
 * 		[(event: TEventMap[K] & { target: TElemMap[TTagName] }) => void,
 * 	   boolean | AddEventListenerOptions | { onAdd: boolean | AddEventListenerOptions; onRemove: boolean | EventListenerOptions | AddEventListenerOptions}
 * 		];
 * }} de100x.GetEventMapForTag
 */

/**
 * @template {Record<string, any>} TElemMap
 * @template {Record<string, any>} TEventMap
 * @template {keyof TElemMap} TTagName
 * @typedef {{
 *   [Key in keyof TElemMap[TTagName] as (
 *     NonNullable<TElemMap[TTagName][Key]> extends (object | ((...params: any[]) => any)) ? never :
 *     Key
 *   )]?:  TElemMap[TTagName][Key] | (() => TElemMap[TTagName][Key]);
 * }
 * & de100x.GetEventMapForTag<TElemMap, TEventMap, TTagName>
 * & de100x.SharedAttributes<TElemMap[TTagName]>} de100x.GetAttrsForTag
 */

/**
 * @template {keyof de100x.TagNameHTMLPropsMap} TTagName
 * @typedef {de100x.GetAttrsForTag<de100x.TagNameHTMLPropsMap, de100x.TagNameHTMLElementEventMap, TTagName>} de100x.AttrsForHTMLTag
 */
/**
 * @template {keyof de100x.TagNameSVGPropsMap} TTagName
 * @typedef {de100x.GetAttrsForTag<de100x.TagNameSVGPropsMap, de100x.TagNameSVGElementEventMap, TTagName>} de100x.AttrsForSvgTag
 */
/**
 * @template {keyof de100x.TagNameMathMLPropsMap} TTagName
 * @typedef {de100x.GetAttrsForTag<de100x.TagNameMathMLPropsMap, de100x.TagNameMathMLElementEventMap, TTagName>} de100x.AttrsForMathMLTag
 */

/**
 * @template {keyof de100x.TagNameXHTMLPropsMap} TTagName
 * @typedef {de100x.GetAttrsForTag<de100x.TagNameXHTMLPropsMap, de100x.TagNameXHTMLPropsMap, TTagName>} de100x.AttrsForXHTMLTag
 */

// de100x.GetNSAttr
/**
 * @template {de100xNS} TNS
 * @template {keyof de100x.TagName2ElementMap} TTagName
 * @typedef {TNS extends typeof SVG_NS ? TTagName extends keyof de100x.TagNameSVGPropsMap ? de100x.GetAttrsForTag<de100x.TagNameSVGPropsMap, de100x.TagNameSVGElementEventMap, TTagName> : never : TNS extends typeof MathML_NS ? TTagName extends keyof de100x.TagNameMathMLPropsMap ? de100x.GetAttrsForTag<de100x.TagNameMathMLPropsMap, de100x.TagNameMathMLElementEventMap, TTagName> : never : TNS extends typeof XHTML_NS ? TTagName extends keyof de100x.TagNameXHTMLPropsMap ? de100x.GetAttrsForTag<de100x.TagNameXHTMLPropsMap, de100x.TagNameXHTMLPropsMap, TTagName> : never : never} de100x.AttrsForNSElement
 */

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

/**
 * @param {Element} element
 * @param {de100x.Child[]} children
 */
function appendChildren(element, children) {
  const childrenCopy = [...children];
  for (let child of childrenCopy) {
    if (child == null) continue;
    if (Array.isArray(child)) {
      appendChildren(element, child);
      continue;
    }
    element.append(
      typeof child === "string" || typeof child === "number"
        ? document.createTextNode(String(child))
        : child,
    );
  }
}

/**
 * Create an element with the given tag name, attributes, and children.
 *
 * @template {keyof de100x.TagNameHTMLPropsMap} TTagName
 *
 * @param {TTagName} tagName - The name of the element to create.
 * @param {de100x.AttrsForHTMLTag<TTagName>} [attributes] - An object containing attributes to set on the element.
 * @param {...de100x.Child} children - An array of child elements or text nodes to append to the created element.
 * @returns {HTMLElementTagNameMap[TTagName]} The created element.
 */
function tag(tagName, attributes, ...children) {
  // 1. Create the element
  const element = document.createElement(tagName);

  // 2. Assign props/attributes
  if (attributes) {
    for (const key in attributes) {
      if (
        !Object.prototype.hasOwnProperty.call(attributes, key) ||
        setGeneralTagAttribute(
          element,
          key,
          attributes[
            /** @type {keyof de100x.AttrsForHTMLTag<TTagName>} */ (key)
          ],
        )
      ) {
        continue;
      }
      setTagAttribute(
        element,
        /** @type {string} */ (key),
        attributes[/** @type {keyof de100x.AttrsForHTMLTag<TTagName>} */ (key)],
      );
    }
  }

  // 3. Append children
  appendChildren(element, children);

  return element;
}
/**
 * Takes a tag name and returns a function _(`tag`)_ that creates elements of that type.
 * This is useful for creating custom elements with specific attributes and children.
 *
 * @template {keyof HTMLElementTagNameMap} TTagName
 * @param {TTagName} tagName - The name of the element to create.
 * @returns {(attributes?: de100x.AttrsForHTMLTag<TTagName>, ...children: de100x.Child[]) => HTMLElementTagNameMap[TTagName]} A function that creates an element of the specified type.
 */
function tagFactory(tagName) {
  return function (attributes, ...children) {
    return tag(tagName, attributes, ...children);
  };
}
/**
 * Create an element with the given tag name, attributes, and children.
 *
 * @template {de100xNS} TNS
 * @template {keyof de100x.TagName2ElementMap} TTagName
 *
 * @param {TNS} namespace - The namespace URI for the element.
 * @param {TTagName} tagName - The name of the element to create.
 * @param {de100x.AttrsForNSElement<TNS, TTagName>} [attributes] - An object containing attributes to set on the element.
 * @param {...de100x.Child} children - An array of child elements or text nodes to append to the created element.
 * @returns {de100x.GetNSElementByNS<TNS>[TTagName]} The created element.
 */
function tagNS(namespace, tagName, attributes, ...children) {
  // 1. Create the element
  const element = document.createElementNS(namespace, tagName);

  // 2. Assign props/attributes
  if (attributes) {
    for (const key in attributes) {
      if (
        !Object.prototype.hasOwnProperty.call(attributes, key) ||
        setGeneralTagAttribute(
          /** @type {de100x.ElementNS} */ (element),
          key,
          attributes[
            /** @type {keyof de100x.AttrsForNSElement<TNS, TTagName>} */ (key)
          ],
        )
      ) {
        continue;
      }

      setTagAttributeNS(
        namespace,
        /** @type {de100x.ElementNS} */ (element),
        key,
        attributes[
          /** @type {keyof de100x.AttrsForNSElement<TNS, TTagName>} */ (key)
        ],
      );
    }
  }

  // 3. Append children
  appendChildren(element, children);

  return /** @type {de100x.GetNSElementByNS<TNS>[TTagName]} */ (
    /** @type {unknown} */ (element)
  );
}
/**
 * Takes a tag name and returns a function _(`tag`)_ that creates elements of that type.
 * This is useful for creating custom elements with specific attributes and children.
 *
 * @template {de100xNS} TNS
 * @template {TNS extends typeof SVG_NS ? keyof de100x.TagNameSVGPropsMap : TNS extends typeof MathML_NS ? keyof de100x.TagNameMathMLPropsMap : TNS extends typeof XHTML_NS ? keyof de100x.TagNameXHTMLPropsMap : never} TTagName
 *
 * @param {TNS} namespace - The namespace URI for the element.
 * @param {TTagName} tagName - The name of the element to create.
 * @returns {(attributes?: de100x.AttrsForNSElement<TNS,TTagName>, ...children: de100x.Child[]) => de100x.GetNSElementByNS<TNS>[TTagName]} A function that creates an element of the specified type.
 */
function tagNSFactory(namespace, tagName) {
  return function (attributes, ...children) {
    if (typeof tagName !== "string") {
      throw new Error(`Invalid tag name: ${tagName}`);
    }
    return tagNS(
      namespace,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      tagName,
      attributes,
      ...children,
    );
  };
}

/**
 * @typedef {{ [TagName in keyof HTMLElementTagNameMap]: ReturnType<typeof tagFactory<TagName>> }} TagsHTMLProxy
 */

/**
 * @type {Record<string, any>}
 */
const _basicTagsCache = {};
/**
 * @type {TagsHTMLProxy}
 */
const tagsHTMLProxy = new Proxy(
  /** @type {TagsHTMLProxy} */ (_basicTagsCache),
  {
    /**
     * @template {keyof HTMLElementTagNameMap} TTagName
     *
     * @param {TagsHTMLProxy} target - The target object, used for caching.
     * @param {TTagName} tagName - The name of the element to create.
     * @returns
     */
    get(target, tagName) {
      if (!(tagName in _basicTagsCache)) {
        /** @type {Record<string,any>} */ (_basicTagsCache)[tagName] =
          tagFactory(tagName);
      }

      return _basicTagsCache[tagName];
    },
  },
);

// TODO: Make one for each ns for now
/**
 * @typedef {{ [TagName in keyof de100x.TagNameSVGPropsMap]: ReturnType<typeof tagNSFactory<typeof SVG_NS, TagName>> }} TagSVGMapProxy
 */
/** @type {Record<string, any>} */
const _svgsTagsCache = {};
/**
 * @type {TagSVGMapProxy}
 */
const svgTagsProxy = new Proxy(/** @type {TagSVGMapProxy} */ (_svgsTagsCache), {
  /**
   * @template {keyof de100x.TagNameSVGPropsMap} TTagName
   *
   * @param {TagSVGMapProxy} target - The target object, used for caching.
   * @param {TTagName} tagName - The name of the element to create.
   */
  get(target, tagName) {
    if (!(tagName in _svgsTagsCache)) {
      /** @type {Record<string,any>} */ (_svgsTagsCache)[tagName] =
        tagNSFactory(SVG_NS, tagName);
    }

    return _svgsTagsCache[tagName];
  },
});
/**
 * @typedef {{ [TagName in keyof de100x.TagNameMathMLPropsMap]: ReturnType<typeof tagNSFactory<typeof MathML_NS, TagName>> }} TagMathMLMapProxy
 */
/** @type {Record<string, any>} */
const _mathMLsTagsCache = {};
/**
 * @type {TagMathMLMapProxy}
 */
const mathMLTagsProxy = new Proxy(
  /** @type {TagMathMLMapProxy} */ (_mathMLsTagsCache),
  {
    /**
     * @template {keyof de100x.TagNameMathMLPropsMap} TTagName
     *
     * @param {TagMathMLMapProxy} target - The target object, used for caching.
     * @param {TTagName} tagName - The name of the element to create.
     */
    get(target, tagName) {
      if (!(tagName in _mathMLsTagsCache)) {
        /** @type {Record<string,any>} */ (_mathMLsTagsCache)[tagName] =
          tagNSFactory(MathML_NS, tagName);
      }

      return _mathMLsTagsCache[tagName];
    },
  },
);
/**
 * @typedef {{ [TagName in keyof de100x.TagNameXHTMLPropsMap]: ReturnType<typeof tagNSFactory<typeof XHTML_NS, TagName>> }} TagXHTMLMapProxy
 */
/** @type {Record<string, any>} */
const _xhtmlsTagsCache = {};
/**
 * @type {TagXHTMLMapProxy}
 */
const xhtmlTagsProxy = new Proxy(
  /** @type {TagXHTMLMapProxy} */ (_xhtmlsTagsCache),
  {
    /**
     * @template {keyof de100x.TagNameXHTMLPropsMap} TTagName
     *
     * @param {TagXHTMLMapProxy} target - The target object, used for caching.
     * @param {TTagName} tagName - The name of the element to create.
     */
    get(target, tagName) {
      if (!(tagName in _xhtmlsTagsCache)) {
        /** @type {Record<string,any>} */ (_xhtmlsTagsCache)[tagName] =
          tagNSFactory(XHTML_NS, tagName);
      }

      return _xhtmlsTagsCache[tagName];
    },
  },
);
/**
 * @typedef {TagsHTMLProxy & (<TNS extends de100xNS>(namespaceURI: TNS) => TNS extends typeof SVG_NS ? TagSVGMapProxy : TNS extends typeof MathML_NS ? TagMathMLMapProxy : TNS extends typeof XHTML_NS ? TagXHTMLMapProxy : never)} TagsProxy
 */

/**
 * @type {TagsProxy}
 */
const tagsProxy = new Proxy(
  /** @type {TagsProxy} */ (/** @type {unknown} */ (() => {})),
  {
    /**
     * @template {keyof HTMLElementTagNameMap} TTagName
     *
     * @param {any} target - The target object, used for caching.
     * @param {TTagName} tagName - The name of the element to create.
     * @returns
     */
    get(target, tagName) {
      if (tagName in _basicTagsCache) {
        return _basicTagsCache[tagName];
      }
      return tagsHTMLProxy[tagName];
    },
    /**
     * @param {any} target - The target object, used for caching.
     * @param {any} _thisArg
     * @param {any} argArray - The arguments passed to the function.
     */
    apply(target, _thisArg, argArray) {
      const namespaceURI = argArray[0];

      switch (namespaceURI) {
        case SVG_NS:
          return svgTagsProxy;
        case MathML_NS:
          return mathMLTagsProxy;
        case XHTML_NS:
          return xhtmlTagsProxy;
        default:
          if (typeof namespaceURI !== "string") {
            throw new Error(`Unsupported namespace URI: ${namespaceURI}`);
          }
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `Namespace URI "${namespaceURI}" is not supported. Defaulting to HTML namespace.`,
            );
          }

          return tagsHTMLProxy;
      }
    },
  },
);

export { tagsProxy };

/*
TODO:

Now, I'm thinking of adding other features, foe example

Marked with `?` at the end of the line needs further investigation and consideration.

- [x] `ref` _(object|function)_ to get a reference to the element
- [x] `style` _(object)_ to set CSS styles
- [x] `dataSet` _(object)_ to set data attributes
- [x] `ariaSet` _(object)_ to set ARIA attributes
- [x] `data-*` attributes
- [x] `aria-*` attributes
- [x] `dangerouslySetInnerHTML` to set inner HTML
- [ ] The implementation here could cause an issue for `setAttribute` vs `setAttributeNS` usage, needs to think of another way
- [x] `on*` attributes to set event listeners
- [ ] - Research the following, and how to implement their missing types
	- [ ] `setAttribute` vs `setAttributeNS`
	- [ ] svg, "http://www.w3.org/2000/svg", HTMLCollectionOf<SVGElement>;
	- [ ] xhtml, "http://www.w3.org/1999/xhtml", HTMLCollectionOf<de100x.HTMLElement>;
	- [ ] math, "http://www.w3.org/1998/Math/MathML", HTMLCollectionOf<MathMLElement>;
	- [ ] https://github.com/vanilla-extract-css/vanilla-extract/tree/master
	- [ ] https://github.com/nivekcode/svg-to-ts
	- [ ] https://github.com/nicojs/typed-html
	- [ ] https://github.com/falsandtru/typed-dom
- [ ] Bindings / Signal Integration
	- [ ] Creates a state management system with reactive bindings
	- [ ] Allows DOM creation and manipulation with a simple API
	- [ ] Provides a way to bind state to DOM elements
	- [ ] Tracks dependencies and automatically updates the DOM when state changes
- [ ] Garbage Collection
- [ ] Allow any tag name with a default type of HTMLElement or Element

- [ ] Fragment Support, to create a document fragment?
- [ ] `key` to identify elements in a list?
- [ ] Portal Support?
- [ ] Custom Components (Function-based Elements)?
- [ ] Dynamic Tag Factories (tag("my-tag"))?


Give a list of other ideas for now
*/
// {
// const h = tagsProxy;
// const svg = tagsProxy(SVG_NS);
// const math = tagsProxy(MathML_NS);
// const xhtml = tagsProxy(XHTML_NS);

// console.log(h);
// console.log(svg);

// const element = h.div(
//   {
//     className: "bg-red-500",
//     style: {
//       color: "white",
//       backgroundColor: "red",
//     },
//     onclick: () => {
//       console.log("clicked");
//     },
//   },
//   h.p({}, "Hello World"),
//   h.input({
//     oninput: (e) => console.log(e.target.value),
//   }),
//   h.a({ href: "#" }, "Link"),
//   h.button({}, "Click me"),
//   h.canvas({
//     width: 100,
//     height: 100,
//     style: {
//       backgroundColor: "blue",
//     },
//     onload: (e) => {
//       const ctx = /** @type {CanvasRenderingContext2D} */ (
//         e.target.getContext("2d")
//       );
//       if (!ctx) return;

//       const animate = () => {
//         ctx.clearRect(0, 0, 100, 100);
//         ctx.fillStyle = "red";
//         ctx.fillRect(0, 0, 100, 100);
//         requestAnimationFrame(animate);
//       };
//       animate();
//     },
//   }),
// );
// console.log(element);
// // document.body.appendChild(element);

// const svgElement = svg.svg(
//   // Maybe make the props could either {attributes} be a 2 items tuple if [{attributes}, {attributesNS}] or pass a special object `ns: object` on the attributes
//   {
//     width: "100",
//     height: "100",
//   },
//   svg.path({
//     d: "M10 10 H 90 V 90 H 10 L 10 10",
//     fill: "none",
//     stroke: "black",
//   }),
// );
// console.log(svgElement);
// // document.body.appendChild(svgElement);

// const mathElement = math.math(
//   {
//     style: {
//       color: "blue",
//       backgroundColor: "blue",
//     },
//     className: "bg-blue-500",
//   },
//   math.mrow(
//     {},
//     math.mi({}, "a"),
//     math.mo({}, "+"),
//     math.mi({}, "b"),
//     math.mo({}, "="),
//     math.mi({}, "c"),
//   ),
//   math.mrow(
//     {},
//     math.mi({}, "d"),
//     math.mo({}, "+"),
//     math.mi({}, "e"),
//     math.mo({}, "="),
//     math.mi({}, "f"),
//   ),
//   math.mrow(
//     {},
//     math.mi({}, "g"),
//     math.mo({}, "+"),
//     math.mi({}, "h"),
//     math.mo({}, "="),
//     math.mi({}, "i"),
//   ),
//   math.mrow(
//     {},
//     math.mi({}, "j"),
//     math.mo({}, "+"),
//     math.mi({}, "k"),
//     math.mo({}, "="),
//     math.mi({}, "l"),
//   ),
//   math.mrow(
//     {},
//     math.mi({}, "x"),
//     math.mo({}, "+"),
//     math.mi({}, "y"),
//     math.mo({}, "="),
//     math.mi({}, "z"),
//   ),
// );
// console.log(mathElement);
// // document.body.appendChild(mathElement);

// const xhtmlElement = xhtml.div(
//   {
//     className: "bg-blue-500",
//     style: {
//       color: "white",
//       backgroundColor: "blue",
//     },
//   },
//   xhtml.p({}, "Hello World"),
//   xhtml.input({
//     oninput: (e) => console.log(e.target.value),
//   }),
//   xhtml.a({ href: "#" }, "Link"),
//   xhtml.button({}, "Click me"),
// );
// console.log(xhtmlElement);
// // document.body.appendChild(xhtmlElement);
// }
