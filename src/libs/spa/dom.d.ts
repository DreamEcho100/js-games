/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * DOM creation and manipulation library with reactive capabilities
 *
 * This namespace provides a complete set of types and interfaces for working
 * with the DOM in a type-safe manner, with special support for:
 *
 * - HTML, SVG, MathML, and XHTML namespaces
 * - Event handling with proper typing
 * - Attribute management with reactive capabilities
 * - DOM creation with concise factory functions
 */
declare namespace de100x {
  namespace dom {
    /** Basic DOM content types that can be rendered */
    export type TChildPrimitive = string | number | Node | undefined | null;

    /**
     * Unified type for anything that can be rendered:
     * - Primitive values (text, numbers)
     * - DOM nodes (elements, text nodes)
     * - Arrays of renderable content
     * - Functions that return renderable content (for reactivity)
     */
    export type TChild = TChildPrimitive | TChildPrimitive[] | (() => TChild);

    /** Standard XML namespace URIs */
    export const SVG_NS: "http://www.w3.org/2000/svg";
    export const MathML_NS: "http://www.w3.org/1998/Math/MathML";
    export const XHTML_NS: "http://www.w3.org/1999/xhtml";

    /** Union type of all supported XML namespaces */
    export type NS = typeof SVG_NS | typeof MathML_NS | typeof XHTML_NS;

    /** Type mappings from tag names to element interfaces */
    export type TagNameHTMLPropsMap = HTMLElementTagNameMap;
    export type TagNameHTMLElementEventMap = HTMLElementEventMap;
    export type TagNameSVGPropsMap = SVGElementTagNameMap;
    export type TagNameSVGElementEventMap = SVGElementEventMap;
    export type TagNameMathMLPropsMap = MathMLElementTagNameMap;
    export type TagNameMathMLElementEventMap = MathMLElementEventMap;
    export type TagNameXHTMLPropsMap = HTMLElementTagNameMap;

    /** Union of all tag-to-element mappings across namespaces */
    export type TagName2ElementMap =
      | TagNameHTMLPropsMap
      | TagNameSVGPropsMap
      | TagNameMathMLPropsMap
      | TagNameXHTMLPropsMap;

    /**
     * Gets tag names available in a specific namespace
     *
     * This conditional type extracts the valid tag names for a given namespace,
     * enabling type-safe element creation in different XML contexts.
     */
    export type GetNSElementTagNameMapByNS<TNS extends NS> =
      TNS extends typeof SVG_NS
        ? keyof TagNameSVGPropsMap
        : TNS extends typeof MathML_NS
        ? keyof TagNameMathMLPropsMap
        : TNS extends typeof XHTML_NS
        ? keyof TagNameXHTMLPropsMap
        : never;

    /**
     * Gets the element map for a specific namespace
     *
     * This allows looking up the correct element interface for a tag
     * within a specific namespace.
     */
    export type GetNSElementByNS<TNS extends NS> = TNS extends typeof SVG_NS
      ? SVGElementTagNameMap
      : TNS extends typeof MathML_NS
      ? MathMLElementTagNameMap
      : TNS extends typeof XHTML_NS
      ? HTMLElementTagNameMap
      : never;

    /** Element type definitions for each namespace */
    export type THTMLElement = TagNameHTMLPropsMap[keyof TagNameHTMLPropsMap];
    export type TSVGElement = TagNameSVGPropsMap[keyof TagNameSVGPropsMap];
    export type TMathMLElement =
      TagNameMathMLPropsMap[keyof TagNameMathMLPropsMap];
    export type TXHTMLElement =
      TagNameXHTMLPropsMap[keyof TagNameXHTMLPropsMap];

    /** Type groupings for namespaced and all elements */
    export type TElementNS = TSVGElement | TMathMLElement | TXHTMLElement;
    export type TElement = TElementNS | THTMLElement;

    /** Helper types for nullable and callback-wrapped values */
    export type Nullable<TValue> = TValue | null | undefined;
    export type NullableOrCB<TValueOrCB> =
      | Nullable<TValueOrCB>
      | (() => Nullable<TValueOrCB>);

    /**
     * Shared attributes available on all elements
     *
     * These special attributes provide extra functionality beyond
     * standard DOM attributes:
     *
     * - dangerouslySetInnerHTML: Like React's equivalent for raw HTML insertion
     * - dataSet: For data-* attributes with proper typing
     * - ariaSet: For aria-* attributes with proper typing
     * - style: For CSS properties with reactive capabilities
     * - ref: For obtaining references to rendered elements
     */
    export interface SharedAttributes<Elem extends TElement> {
      dangerouslySetInnerHTML?: { __html: string };
      dataSet?: NullableOrCB<{ [key: string]: NullableOrCB<string> }>;
      ariaSet?: NullableOrCB<{
        [key in keyof ARIAMixin]: NullableOrCB<ARIAMixin[key]>;
      }>;
      style?: NullableOrCB<{
        [key in keyof THTMLElement["style"]]?: NullableOrCB<
          THTMLElement["style"][key]
        >;
      }>;
      ref?: { current: Elem } | ((element: Elem) => void);
      [key: `data-${string}`]: NullableOrCB<string>;
      [key: `aria-${string}`]: NullableOrCB<string>;
    }

    /**
     * Maps event names to handler types for a specific element
     *
     * This type extracts all event types for an element and creates properly
     * typed event handler properties (onclick, onmouseover, etc.)
     *
     * Handlers can be:
     * 1. Simple functions
     * 2. Tuples with function and options for addEventListener
     */
    export type GetEventMapForTag<
      TElemMap extends Record<string, any>,
      TEventMap extends Record<string, any>,
      TTagName extends keyof TElemMap,
    > = {
      [K in keyof TEventMap as `on${string & K}`]?:
        | ((event: TEventMap[K] & { target: TElemMap[TTagName] }) => void)
        | [
            (event: TEventMap[K] & { target: TElemMap[TTagName] }) => void,
            (
              | boolean
              | AddEventListenerOptions
              | {
                  onAdd: boolean | AddEventListenerOptions;
                  onRemove:
                    | boolean
                    | EventListenerOptions
                    | AddEventListenerOptions;
                }
            ),
          ];
    };

    /**
     * Creates a complete props type for an element tag
     *
     * This combines:
     * 1. All properties from the element interface (excluding methods and objects)
     * 2. Event handlers with proper typing
     * 3. Shared special attributes (ref, style, etc.)
     *
     * Properties can be either direct values or functions returning values (for reactivity)
     */
    export type GetAttrsForTag<
      TElemMap extends Record<string, any>,
      TEventMap extends Record<string, any>,
      TTagName extends keyof TElemMap,
    > = {
      [Key in keyof TElemMap[TTagName] as NonNullable<
        TElemMap[TTagName][Key]
      > extends object | ((...params: any[]) => any)
        ? never
        : Key]?: TElemMap[TTagName][Key] | (() => TElemMap[TTagName][Key]);
    } & GetEventMapForTag<TElemMap, TEventMap, TTagName> &
      SharedAttributes<TElemMap[TTagName]>;

    /** HTML-specific attribute types */
    export type AttrsForHTMLTag<TTagName extends keyof TagNameHTMLPropsMap> =
      GetAttrsForTag<TagNameHTMLPropsMap, TagNameHTMLElementEventMap, TTagName>;

    /** SVG-specific attribute types */
    export type AttrsForSvgTag<TTagName extends keyof TagNameSVGPropsMap> =
      GetAttrsForTag<TagNameSVGPropsMap, TagNameSVGElementEventMap, TTagName>;

    /** MathML-specific attribute types */
    export type AttrsForMathMLTag<
      TTagName extends keyof TagNameMathMLPropsMap,
    > = GetAttrsForTag<
      TagNameMathMLPropsMap,
      TagNameMathMLElementEventMap,
      TTagName
    >;

    /** XHTML-specific attribute types */
    export type AttrsForXHTMLTag<TTagName extends keyof TagNameXHTMLPropsMap> =
      GetAttrsForTag<TagNameXHTMLPropsMap, TagNameXHTMLPropsMap, TTagName>;

    /**
     * Gets the appropriate attribute type for a namespace/tag combination
     *
     * This conditional type ensures that only valid attributes for the
     * specific element in the specific namespace are allowed.
     */
    export type AttrsForNSElement<
      TNS extends NS,
      TTagName extends keyof TagName2ElementMap,
    > = TNS extends typeof SVG_NS
      ? TTagName extends keyof TagNameSVGPropsMap
        ? GetAttrsForTag<
            TagNameSVGPropsMap,
            TagNameSVGElementEventMap,
            TTagName
          >
        : never
      : TNS extends typeof MathML_NS
      ? TTagName extends keyof TagNameMathMLPropsMap
        ? GetAttrsForTag<
            TagNameMathMLPropsMap,
            TagNameMathMLElementEventMap,
            TTagName
          >
        : never
      : TNS extends typeof XHTML_NS
      ? TTagName extends keyof TagNameXHTMLPropsMap
        ? GetAttrsForTag<TagNameXHTMLPropsMap, TagNameXHTMLPropsMap, TTagName>
        : never
      : never;

    /**
     * Type for the HTML elements proxy
     *
     * This provides type-safe element creation for all HTML elements:
     * t.div(), t.span(), etc.
     */
    export type TagsHTMLProxy = {
      [TagName in keyof HTMLElementTagNameMap]: (
        attributes?: AttrsForHTMLTag<TagName>,
        ...children: TChild[]
      ) => HTMLElementTagNameMap[TagName];
    };

    /**
     * Type for the SVG elements proxy
     *
     * This provides type-safe element creation for all SVG elements:
     * t(SVG_NS).path(), t(SVG_NS).circle(), etc.
     */
    export type TagSVGMapProxy = {
      [TagName in keyof TagNameSVGPropsMap]: (
        attributes?: AttrsForSvgTag<TagName>,
        ...children: TChild[]
      ) => SVGElementTagNameMap[TagName];
    };

    /**
     * Type for the MathML elements proxy
     *
     * This provides type-safe element creation for all MathML elements:
     * t(MathML_NS).math(), etc.
     */
    export type TagMathMLMapProxy = {
      [TagName in keyof TagNameMathMLPropsMap]: (
        attributes?: AttrsForMathMLTag<TagName>,
        ...children: TChild[]
      ) => MathMLElementTagNameMap[TagName];
    };

    /**
     * Type for the XHTML elements proxy
     *
     * This provides type-safe element creation for all XHTML elements:
     * t(XHTML_NS).div(), etc.
     */
    export type TagXHTMLMapProxy = {
      [TagName in keyof TagNameXHTMLPropsMap]: (
        attributes?: AttrsForXHTMLTag<TagName>,
        ...children: TChild[]
      ) => HTMLElementTagNameMap[TagName];
    };

    /**
     * Type for the universal element creation proxy
     *
     * This combines:
     * 1. Direct access to HTML elements: t.div()
     * 2. Function call for namespaced elements: t(SVG_NS).path()
     */
    export type TagsProxy = TagsHTMLProxy &
      (<TNS extends NS>(
        namespaceURI: TNS,
      ) => TNS extends typeof SVG_NS
        ? TagSVGMapProxy
        : TNS extends typeof MathML_NS
        ? TagMathMLMapProxy
        : TNS extends typeof XHTML_NS
        ? TagXHTMLMapProxy
        : never);

    /**
     * Creates a factory function for HTML elements
     *
     * This is the basis for the element creation system, allowing
     * specialized functions for each HTML tag type.
     */
    export declare function htmlElementFactory<
      TTagName extends keyof HTMLElementTagNameMap,
    >(
      tagName: TTagName,
    ): (
      attributes?: AttrsForHTMLTag<TTagName>,
      ...children: TChild[]
    ) => HTMLElementTagNameMap[TTagName];

    /**
     * Creates a factory function for namespaced elements
     *
     * This enables specialized functions for creating elements
     * in specific namespaces like SVG, MathML, etc.
     */
    export declare function namespacedElementFactory<
      TNS extends NS,
      TTagName extends TNS extends typeof SVG_NS
        ? keyof TagNameSVGPropsMap
        : TNS extends typeof MathML_NS
        ? keyof TagNameMathMLPropsMap
        : TNS extends typeof XHTML_NS
        ? keyof TagNameXHTMLPropsMap
        : never,
    >(
      namespace: TNS,
      tagName: TTagName,
    ): (
      attributes?: AttrsForNSElement<TNS, TTagName>,
      ...children: TChild[]
    ) => GetNSElementByNS<TNS>[TTagName];

    /**
     * The universal element creation proxy
     *
     * This provides a unified, elegant API for creating DOM elements:
     * - HTML elements: t.div(), t.span(), etc.
     * - SVG elements: t(SVG_NS).path(), t(SVG_NS).circle(), etc.
     * - MathML elements: t(MathML_NS).math(), etc.
     * - XHTML elements: t(XHTML_NS).div(), etc.
     */
    export const elementCreator: TagsProxy;

    /**
     * Concise alias for elementCreator
     *
     * This shorter name is recommended for most applications
     * for more readable code:
     *
     * t.div({class: 'container'}, t.h1({}, 'Title'), t.p({}, 'Content'))
     */
    export const t: TagsProxy;
  }
}

export = de100x.dom;
export as namespace de100x;
