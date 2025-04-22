/**
 * @namespace XSPA
 */

/**
 *
 * @typedef {string|number|Node|undefined|null} ChildPrimitive
 * @typedef {ChildPrimitive|ChildPrimitive[]} Child
 */

// - [ ] svg, "http://www.w3.org/2000/svg", HTMLCollectionOf<SVGElement>;
// - [ ] xhtml, "http://www.w3.org/1999/xhtml", HTMLCollectionOf<XSPA.HTMLElement>;
// - [ ] math, "http://www.w3.org/1998/Math/MathML", HTMLCollectionOf<MathMLElement>;

// HTMLProps
// SVGProps
// MathMLProps
// XHTMLProps

const SVG_NS = "http://www.w3.org/2000/svg";
const MathML_NS = "http://www.w3.org/1998/Math/MathML";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

/**
 * @typedef {typeof SVG_NS | typeof MathML_NS | typeof XHTML_NS} NS
 */

/**
 * @typedef {HTMLElementTagNameMap} XSPA.TagNameHTMLPropsMap
 * @typedef {HTMLElementEventMap} XSPA.TagNameHTMLElementEventMap
 *
 * @typedef {SVGElementTagNameMap} XSPA.TagNameSVGPropsMap
 * @typedef {SVGElementEventMap} XSPA.TagNameSVGElementEventMap
 *
 * @typedef {MathMLElementTagNameMap} XSPA.TagNameMathMLPropsMap
 * @typedef {MathMLElementEventMap} XSPA.TagNameMathMLElementEventMap
 *
 * @typedef {HTMLElementTagNameMap} XSPA.TagNameXHTMLPropsMap
 * @typedef {XSPA.TagNameHTMLPropsMap | XSPA.TagNameSVGPropsMap | XSPA.TagNameMathMLPropsMap | XSPA.TagNameXHTMLPropsMap} XSPA.TagName2ElementMap
 */
// * @typedef {XSPA.TagNameHTMLElementEventMap | XSPA.TagNameSVGElementEventMap | XSPA.TagNameMathMLElementEventMap} XSPA.TagName2ElementEventMap

/**
 * @template {NS} TNS
 * @typedef {TNS extends typeof SVG_NS ? keyof XSPA.TagNameSVGPropsMap : TNS extends typeof MathML_NS ? keyof XSPA.TagNameMathMLPropsMap : TNS extends typeof XHTML_NS ? keyof XSPA.TagNameXHTMLPropsMap : never} XSPA.GetNSElementTagNameMapByNS
 */
/**
 * @template {NS} TNS
 * @template {string} TTagName
 * @typedef {TNS extends typeof SVG_NS ? keyof XSPA.TagNameSVGPropsMap : TNS extends typeof MathML_NS ? keyof XSPA.TagNameMathMLPropsMap : TNS extends typeof XHTML_NS ? keyof XSPA.TagNameXHTMLPropsMap : never} XSPA.GetNSElementByNS
 */

/**
 * @typedef {XSPA.TagNameHTMLPropsMap[keyof XSPA.TagNameHTMLPropsMap]} XSPA.HTMLElement
 * @typedef {XSPA.TagNameSVGPropsMap[keyof XSPA.TagNameSVGPropsMap]} XSPA.SVGElement
 * @typedef {XSPA.TagNameMathMLPropsMap[keyof XSPA.TagNameMathMLPropsMap]} XSPA.MathMLElement
 * @typedef {XSPA.TagNameXHTMLPropsMap[keyof XSPA.TagNameXHTMLPropsMap]} XSPA.XHTMLElement
 * @typedef {XSPA.SVGElement | XSPA.MathMLElement | XSPA.XHTMLElement} XSPA.ElementNS
 * @typedef {XSPA.ElementNS | XSPA.HTMLElement} XSPA.Element
 */

/**
 * @typedef {XSPA.TagNameHTMLPropsMap | XSPA.TagNameSVGPropsMap | XSPA.TagNameMathMLPropsMap | XSPA.TagNameXHTMLPropsMap} ElementTagName
 */

/**
 * @typedef {"style"|"toString"} XSPA.OmittedAttributes
 */

/**
 * @template {Element} Elem
 *
 * @typedef {{
 * 	dangerouslySetInnerHTML?: { __html: string };
 *  dataSet?: { [key: string]: string };
 *  ariaSet?: { [key: string]: string };
 *  style?: { [key in keyof XSPA.HTMLElement["style"]]?: XSPA.HTMLElement["style"][key] };
 *  ref?: { current: Elem } | ((element: Elem) => void);
 * }} XSPA.SharedAttributes
 */

/**
 * @template {Record<string, any>} TElemMap
 * @template {Record<string, any>} TElementEventMap
 * @template {keyof TElemMap} TTagName
 * @template {string} TOmittedAttributes
 * @typedef {{
 *   [Key in keyof (TOmittedAttributes extends string ? Omit<TElemMap[TTagName], XSPA.OmittedAttributes> : TElemMap[TTagName])]?:
 *     Key extends `on${infer E}`
 *       ? (event: TElementEventMap[E & keyof TElementEventMap] & { target: TElemMap[TTagName] } ) => void
 *       : TElemMap[TTagName][Key]
 * } & XSPA.SharedAttributes<TElemMap[TTagName]>} XSPA.GetAttrsForTag
 */

/**
 * @template {keyof XSPA.TagNameHTMLPropsMap} TTagName
 * @typedef {XSPA.GetAttrsForTag<XSPA.TagNameHTMLPropsMap, XSPA.TagNameHTMLElementEventMap, TTagName, XSPA.OmittedAttributes>} XSPA.AttrsForHTMLTag
 */
/**
 * @template {keyof XSPA.TagNameSVGPropsMap} TTagName
 * @typedef {XSPA.GetAttrsForTag<XSPA.TagNameSVGPropsMap, XSPA.TagNameSVGElementEventMap, TTagName, XSPA.OmittedAttributes>} XSPA.AttrsForSvgTag
 */
/**
 * @template {keyof XSPA.TagNameMathMLPropsMap} TTagName
 * @typedef {XSPA.GetAttrsForTag<XSPA.TagNameMathMLPropsMap, XSPA.TagNameMathMLElementEventMap, TTagName, XSPA.OmittedAttributes>} XSPA.AttrsForMathMLTag
 */

/**
 * @template {keyof XSPA.TagNameXHTMLPropsMap} TTagName
 * @typedef {XSPA.GetAttrsForTag<XSPA.TagNameXHTMLPropsMap, XSPA.TagNameXHTMLPropsMap, TTagName, XSPA.OmittedAttributes>} XSPA.AttrsForXHTMLTag
 */

// XSPA.GetNSAttr
/**
 * @template {NS} TNS
 * @template {keyof XSPA.TagName2ElementMap} TTagName
 * @typedef {TNS extends typeof SVG_NS ? TTagName extends keyof XSPA.TagNameSVGPropsMap ? XSPA.GetAttrsForTag<XSPA.TagNameSVGPropsMap, XSPA.TagNameSVGElementEventMap, TTagName, XSPA.OmittedAttributes> : never : TNS extends typeof MathML_NS ? TTagName extends keyof XSPA.TagNameMathMLPropsMap ? XSPA.GetAttrsForTag<XSPA.TagNameMathMLPropsMap, XSPA.TagNameMathMLElementEventMap, TTagName, XSPA.OmittedAttributes> : never : TNS extends typeof XHTML_NS ? TTagName extends keyof XSPA.TagNameXHTMLPropsMap ? XSPA.GetAttrsForTag<XSPA.TagNameXHTMLPropsMap, XSPA.TagNameXHTMLPropsMap, TTagName, XSPA.OmittedAttributes> : never : never} XSPA.AttrsForNSElement
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
// CSSStyleDeclaration
//
//
//
// Attr

// /**
//  * @template {ElementTagName} TTagName
//  * @typedef {TTagName extends keyof HTMLElementTagNameMap
//  *   ? AttrsForHTMLTag<TTagName>
//  *   : TTagName extends keyof NSElementTagNameMap
//  *   ? AttrsForSvgTag<TTagName>
//  *   : never
//  * } AttrsForTag
//  */

function setTagAttribute(
  /** @type {XSPA.HTMLElement} */ element,
  /** @type {string} */ key,
  /** @type {unknown} */ value,
) {
  switch (key) {
    case "style": {
      if (typeof value === "string") {
        element.setAttribute(key, value);
        break;
      }
      const _value =
        /** @type {{ [Key in keyof XSPA.HTMLElement['style']]: XSPA.HTMLElement['style'][Key] }} */ (
          value
        );
      // let styleString = "";

      for (const key in _value) {
        if (Object.prototype.hasOwnProperty.call(_value, key)) {
          const value = _value[key];
          if (typeof value === "string") {
            element.style[key] = value;
          }
        }
      }
      break;
    }
    case "dataSet": {
      const _dataSet = /** @type {{ [Key in string]: string }} */ (value);
      for (const key in _dataSet) {
        if (Object.prototype.hasOwnProperty.call(_dataSet, key)) {
          const value = _dataSet[key];
          if (typeof value === "string") {
            element.dataset[key] = value;
          }
        }
      }
      break;
    }
    case "ariaSet": {
      const _ariaSet = /** @type {{ [Key in string]: string }} */ (value);
      for (const key in _ariaSet) {
        if (Object.prototype.hasOwnProperty.call(_ariaSet, key)) {
          const value = _ariaSet[key];
          if (typeof value === "string") {
            element.setAttribute(`aria-${key}`, value);
          }
        }
      }
      break;
    }
    case "dangerouslySetInnerHTML": {
      const _value = /** @type {{ __html: string }} */ (value);
      element.innerHTML = _value.__html;

      break;
    }
    case "ref": {
      const _value =
        /** @type {{ current: Element }|((element: Element) => void) } */ (
          value
        );

      if (typeof _value === "function") {
        _value(element);
      } else if (_value instanceof HTMLElement) {
        _value.current = element;
      }
      break;
    }
    default: {
      if (key.startsWith("on")) {
        element.addEventListener(
          key.slice(2).toLowerCase(),
          /** @type {EventListener} */ (value),
        );
        return;
      }

      if (typeof value === "boolean") {
        if (value) return element.setAttribute(key, "");
      }

      element.setAttribute(key, /** @type {string} */ (value));
    }
  }
}
function setTagAttributeNS(
  /** @type {string} */
  namespace,
  /** @type {XSPA.ElementNS} */ element,
  /** @type {string} */ key,
  /** @type {unknown} */ value,
) {
  switch (key) {
    case "style": {
      if (typeof value === "string") {
        element.setAttributeNS(namespace, key, value);
        break;
      }
      const _value =
        /** @type {{ [Key in keyof XSPA.HTMLElement['style']]: XSPA.HTMLElement['style'][Key] }} */ (
          value
        );
      let styleString = "";

      for (const key in _value) {
        if (Object.prototype.hasOwnProperty.call(_value, key)) {
          const value = _value[key];
          if (typeof value === "string") {
            styleString += `${key}:${value};`;
          }
        }
      }

      element.setAttributeNS(namespace, key, styleString);
      break;
    }
    case "dataSet": {
      const _dataSet = /** @type {{ [Key in string]: string }} */ (value);
      for (const key in _dataSet) {
        if (Object.prototype.hasOwnProperty.call(_dataSet, key)) {
          const value = _dataSet[key];
          if (typeof value === "string") {
            element.dataset[key] = value;
          }
        }
      }
      break;
    }
    case "ariaSet": {
      const _ariaSet = /** @type {{ [Key in string]: string }} */ (value);
      for (const key in _ariaSet) {
        if (Object.prototype.hasOwnProperty.call(_ariaSet, key)) {
          const value = _ariaSet[key];
          if (typeof value === "string") {
            element.setAttributeNS(namespace, `aria-${key}`, value);
          }
        }
      }
      break;
    }
    case "dangerouslySetInnerHTML": {
      const _value = /** @type {{ __html: string }} */ (value);
      element.innerHTML = _value.__html;

      break;
    }
    case "ref": {
      const _value =
        /** @type {{ current: Element }|((element: Element) => void) } */ (
          value
        );

      if (typeof _value === "function") {
        _value(element);
      } else if (_value instanceof HTMLElement) {
        _value.current = element;
      }
      break;
    }
    default: {
      if (key.startsWith("on")) {
        element.addEventListener(
          key.slice(2).toLowerCase(),
          /** @type {EventListener} */ (value),
        );
        return;
      }

      if (typeof value === "boolean") {
        if (value) return element.setAttributeNS(namespace, key, "");
      }

      element.setAttributeNS(namespace, key, /** @type {string} */ (value));
    }
  }
}

/**
 * @param {Element} element
 * @param {Child[]} children
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
 * @template {keyof XSPA.TagNameHTMLPropsMap} TTagName
 *
 * @param {TTagName} tagName - The name of the element to create.
 * @param {XSPA.AttrsForHTMLTag<TTagName>} [attributes] - An object containing attributes to set on the element.
 * @param {...Child} children - An array of child elements or text nodes to append to the created element.
 * @returns {HTMLElementTagNameMap[TTagName]} The created element.
 */
function tag(tagName, attributes, ...children) {
  // 1. Create the element
  const element = document.createElement(tagName);

  // 2. Assign props/attributes
  if (attributes) {
    for (const key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        setTagAttribute(
          element,
          /** @type {string} */ (key),
          attributes[/** @type {keyof XSPA.AttrsForHTMLTag<TTagName>} */ (key)],
        );
      }
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
 * @returns {(attributes?: XSPA.AttrsForHTMLTag<TTagName>, ...children: Child[]) => HTMLElementTagNameMap[TTagName]} A function that creates an element of the specified type.
 */
function tagFactory(tagName) {
  return function (attributes, ...children) {
    return tag(tagName, attributes, ...children);
  };
}
/**
 * Create an element with the given tag name, attributes, and children.
 *
 * @template {NS} TNS
 * @template {keyof XSPA.TagName2ElementMap} TTagName
 *
 * @param {TNS} namespace - The namespace URI for the element.
 * @param {TTagName} tagName - The name of the element to create.
 * @param {XSPA.AttrsForNSElement<TNS, TTagName>} [attributes] - An object containing attributes to set on the element.
 * @param {...Child} children - An array of child elements or text nodes to append to the created element.
 * @returns {XSPA.GetNSElementByNS<TNS, TTagName>} The created element.
 */
function tagNS(namespace, tagName, attributes, ...children) {
  // 1. Create the element
  const element = document.createElementNS(namespace, tagName);

  // 2. Assign props/attributes
  if (attributes) {
    for (const key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        setTagAttributeNS(
          namespace,
          /** @type {XSPA.ElementNS} */ (element),
          /** @type {string} */ (key),
          attributes[
            /** @type {keyof XSPA.AttrsForNSElement<TNS, TTagName>} */ (key)
          ],
        );
      }
    }
  }

  // 3. Append children
  appendChildren(element, children);

  return /** @type {XSPA.GetNSElementByNS<TNS, TTagName>} */ (
    /** @type {unknown} */ (element)
  );
}
/**
 * Takes a tag name and returns a function _(`tag`)_ that creates elements of that type.
 * This is useful for creating custom elements with specific attributes and children.
 *
 * @template {NS} TNS
 * @template {TNS extends typeof SVG_NS ? keyof XSPA.TagNameSVGPropsMap : TNS extends typeof MathML_NS ? keyof XSPA.TagNameMathMLPropsMap : TNS extends typeof XHTML_NS ? keyof XSPA.TagNameXHTMLPropsMap : never} TTagName
 *
 * @param {TNS} namespace - The namespace URI for the element.
 * @param {TTagName} tagName - The name of the element to create.
 * @returns {(attributes?: XSPA.AttrsForNSElement<TNS,TTagName>, ...children: Child[]) => XSPA.GetNSElementByNS<TNS,TTagName>} A function that creates an element of the specified type.
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

      return tagFactory(tagName);
    },
  },
);

// TODO: Make one for each ns for now
/**
 * @typedef {{ [TagName in keyof XSPA.TagNameSVGPropsMap]: ReturnType<typeof tagNSFactory<typeof SVG_NS, TagName>> }} TagSVGMapProxy
 */
/** @type {Record<string, any>} */
const _svgsTagsCache = {};
/**
 * @type {TagSVGMapProxy}
 */
const svgTagsProxy = new Proxy(/** @type {TagSVGMapProxy} */ (_svgsTagsCache), {
  /**
   * @template {keyof XSPA.TagName2ElementMap} TTagName
   *
   * @param {TagSVGMapProxy} target - The target object, used for caching.
   * @param {TTagName} tagName - The name of the element to create.
   * @returns
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
 * @typedef {{ [TagName in keyof XSPA.TagNameMathMLPropsMap]: ReturnType<typeof tagNSFactory<typeof MathML_NS, TagName>> }} TagMathMLMapProxy
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
     * @template {keyof XSPA.TagName2ElementMap} TTagName
     *
     * @param {TagMathMLMapProxy} target - The target object, used for caching.
     * @param {TTagName} tagName - The name of the element to create.
     * @returns
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
 * @typedef {{ [TagName in keyof XSPA.TagNameXHTMLPropsMap]: ReturnType<typeof tagNSFactory<typeof XHTML_NS, TagName>> }} TagXHTMLMapProxy
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
     * @template {keyof XSPA.TagName2ElementMap} TTagName
     *
     * @param {TagXHTMLMapProxy} target - The target object, used for caching.
     * @param {TTagName} tagName - The name of the element to create.
     * @returns
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
 * @typedef {TagsHTMLProxy & (<TNS extends NS>(namespaceURI: TNS) => TNS extends typeof SVG_NS ? TagSVGMapProxy : TNS extends typeof MathML_NS ? TagMathMLMapProxy : never)} TagsProxy
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
     * @param {*} target - The target object, used for caching.
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
     * @param {*} target - The target object, used for caching.
     * @param {*} _thisArg
     * @param {*} argArray - The arguments passed to the function.
     */
    apply(target, _thisArg, argArray) {
      const namespaceURI = argArray[0];

      if (namespaceURI === SVG_NS) {
        return svgTagsProxy;
      }

      if (namespaceURI === MathML_NS) {
        return mathMLTagsProxy;
      }

      if (namespaceURI === XHTML_NS) {
        return xhtmlTagsProxy;
      }

      if (typeof namespaceURI !== "string") {
        throw new Error(`Unsupported namespace URI: ${namespaceURI}`);
      }
    },
  },
);

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
	- [ ] xhtml, "http://www.w3.org/1999/xhtml", HTMLCollectionOf<XSPA.HTMLElement>;
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

- [ ] Fragment Support, to create a document fragment?
- [ ] `key` to identify elements in a list?
- [ ] Portal Support?
- [ ] Custom Components (Function-based Elements)?
- [ ] Dynamic Tag Factories (tag("my-tag"))?


Give a list of other ideas for now
*/

const h = tagsProxy;
const svg = tagsProxy(SVG_NS);
const math = tagsProxy(MathML_NS);
const xhtml = tagsProxy(XHTML_NS);

console.log(h);
console.log(svg);

const element = h.div(
  {
    className: "bg-red-500",
    style: {
      color: "white",
      backgroundColor: "red",
    },
    onclick: () => {
      console.log("clicked");
    },
  },
  h.p({}, "Hello World"),
  h.input({
    oninput: (e) => console.log(e.target.value),
  }),
  h.a({ href: "#" }, "Link"),
  h.button({}, "Click me"),
);
console.log(element);
// document.body.appendChild(element);

const svgElement = svg.svg(
  // Maybe make the props could either {attributes} be a 2 items tuple if [{attributes}, {attributesNS}]
  {
    width: "100",
    height: "100",
  },
  svg.path({
    d: "M10 10 H 90 V 90 H 10 L 10 10",
    fill: "none",
    stroke: "black",
  }),
);
console.log(svgElement);
// document.body.appendChild(svgElement);

const mathElement = math.math(
  {
    xmlns: "http://www.w3.org/1998/Math/MathML",
  },
  math.mrow(
    {},
    math.mi({}, "x"),
    math.mo({}, "+"),
    math.mi({}, "y"),
    math.mo({}, "="),
    math.mi({}, "z"),
  ),
);
console.log(mathElement);
// document.body.appendChild(mathElement);
