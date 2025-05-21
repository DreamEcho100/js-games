/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Reactive Signals Library
 *
 * A fine-grained reactivity system inspired by SolidJS and React Signals,
 * providing automatic dependency tracking and efficient updates.
 *
 * Core primitives:
 * - Signals: Reactive state containers
 * - Effects: Side effects that automatically track dependencies
 * - Memos: Cached computations that update only when dependencies change
 * - Scopes: Nested reactive environments with lifecycle management
 * - Contexts: Value propagation through the reactive tree
 */

// ========== Core Types ==========

/** Node type constants to identify different reactive nodes */
export const NODE_TYPE: {
  /** Primitive value container that can notify observers */
  readonly SIGNAL: 0;
  /** Side effect with automatic dependency tracking */
  readonly EFFECT: 1;
  /** Cached computation with dependency tracking */
  readonly MEMO: 2;
};

/** Result of creating a scope, including disposal function */
export interface ScopeResult<TValue> {
  /** Function to clean up all resources in this scope */
  dispose: () => void;
  /** Value returned from the scope's initialization function */
  result: TValue;
}

/**
 * Reactive environment with its own lifecycle and state
 * Scopes provide isolation and enable hierarchical cleanup
 */
export interface Scope {
  /** Unique identifier for the scope */
  id: number;
  /** Optional name for debugging and tracing */
  name?: string;
  /** Nesting level of the scope in the tree */
  depth: number;
  /** Counter for generating unique signal IDs */
  nextSignalId: number;
  /** Current batch operation depth to defer updates */
  batchDepth: number;
  /** Currently executing node that tracks dependencies */
  activeObserver: ReactiveNode<any> | null;
  /** Effects waiting to be executed */
  pendingEffects: Set<ReactiveNode<any>>;
  /** All nodes (signals, memos, effects) owned by this scope */
  nodes: Set<ReactiveNode<any>>;
  /** Whether a microtask is scheduled for batch updates */
  pendingMicrotask: boolean;
  /** Child scopes for hierarchical cleanup */
  nextScopes: Scope[];
  /** Parent scope for hierarchical navigation */
  prevScope: Scope | null;
  /** Cleanup functions to run on scope disposal */
  cleanups: (() => void)[];
  /** Context values available in this scope */
  contexts: Map<symbol, SignalValue<any>>;
}

/**
 * Internal representation of a reactive node
 * This is the core data structure for all reactive primitives
 */
export interface ReactiveNode<TValue> {
  /** Unique identifier */
  id: number;
  /** Incremented on each value change to detect staleness */
  version: number;
  /** Dependencies mapped to the version when last accessed */
  sources: Map<ReactiveNode<any>, number>;
  /** Reactive nodes that depend on this one */
  observers: Set<ReactiveNode<any>>;
  /** Function to recalculate value (for memos/effects) */
  compute?: () => TValue;
  /** Current cached value */
  value: TValue;
  /** Function to clean up resources between executions */
  cleanup?: (() => void) | void;
  /** Custom handler for when node becomes dirty */
  onDirty?: () => void;
  /** Whether the node needs recomputation */
  dirty?: boolean;
  /** Last error during computation if any */
  error?: any;
  /** Name for debugging and cycle detection */
  name?: string;
  /** Type of node (SIGNAL, EFFECT, MEMO) */
  type: (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
  /** Custom equality function */
  equals?: (a: TValue, b: TValue) => boolean;
  /** Reference to the owning scope for cleanup */
  scopeRef: Scope;
}

/** Configuration options for signals and computed values */
export interface SignalOptions<TValue> {
  /** Custom equality check to prevent unnecessary updates */
  equals?: (a: TValue, b: TValue) => boolean;
  /** Name for debugging and error reporting */
  name?: string;
}

/** Base interface for signal-like objects with debugging support */
export interface BaseSignalValue<TValue> {
  /** Debug information (only in development) */
  _debug?: {
    /** Reference to internal node */
    node: ReactiveNode<TValue>;
    /** Function to get value without tracking */
    peek: () => TValue;
    /** Function to check if needs recomputation */
    dirty: () => boolean | undefined;
    /** Node ID for debugging */
    id: number;
    /** Node name for debugging */
    name: string | undefined;
    /** Stack trace for debugging */
    createdAt?: string;
  };
  /** Function to get current value without tracking dependencies */
  peek: () => TValue;
}

/** Base getter function type */
export type BaseGetter<TValue> = () => TValue;

/**
 * Writeable reactive value
 * Signals store values and notify dependents when changed
 */
export interface SignalValue<TValue>
  extends BaseGetter<TValue>,
    BaseSignalValue<TValue> {
  /** Sets a new value and notifies dependents if changed */
  set: (value: TValue) => void;
  /** Updates the value based on its previous state */
  update: (fn: (value: TValue) => TValue) => void;
}

/**
 * Read-only computed value
 * Memos cache derived values that update automatically
 */
export interface MemoValue<TValue>
  extends BaseGetter<TValue>,
    BaseSignalValue<TValue> {}

/**
 * Context for passing values through the scope tree
 * Allows passing data to deeply nested components without prop drilling
 */
export interface Context<TValue> {
  /** Unique identifier for the context */
  id: symbol;
  /** Fallback value when no provider is found */
  defaultValue: TValue | SignalValue<TValue>;
  /** Creates a context provider that runs a function within the provided value */
  Provider: <TReturn>(
    valueOrSignal: SignalValue<TValue> | TValue,
    fn: () => TReturn,
  ) => TReturn;
  /** Creates a context provider for later use with composition */
  DeferredProvider: <TReturn>(
    valueOrSignal: SignalValue<TValue> | TValue,
  ) => (fn: () => TReturn) => TReturn;
}

// ========== Scope Functions ==========

/**
 * Creates a new reactive scope
 *
 * Scopes provide isolated reactive environments with their own lifecycle.
 * They enable modular component structures and proper cleanup of resources.
 */
export function createScope<TValue>(
  fn: () => TValue,
  options?: {
    /** Whether to detach from parent scope hierarchy */
    detached?: boolean;
    /** Name for debugging and tracing */
    name?: string;
    /** Context providers to apply */
    deferredProviders?: ReturnType<Context<any>["DeferredProvider"]>[];
  },
): ScopeResult<TValue>;

/**
 * Disposes a scope and all its resources
 *
 * Recursively cleans up child scopes, runs cleanup functions,
 * and removes relationships with parent scope.
 */
export function disposeScope(scope: Scope): void;

/**
 * Registers a function to run when scope is disposed
 *
 * Use this to clean up resources like DOM nodes, event listeners,
 * timers, or other side effects when a scope is unmounted.
 */
export function onScopeCleanup(fn: () => void): void;

/**
 * Gets the current scope's unique identifier
 *
 * Useful for generating unique IDs for elements in templates.
 */
export function getScopeId(): number;

// ========== Signal Functions ==========

/**
 * Checks if a value is a reactive signal
 *
 * Use this to differentiate between signals and regular values
 * when accepting either as an argument.
 */
export function isSignal(item: any): item is SignalValue<any>;

/**
 * Creates a reactive signal
 *
 * Signals are the core primitive for storing reactive state.
 * When a signal's value changes, all effects that depend on it
 * are automatically scheduled for re-execution.
 */
export function $signal<TValue>(
  initialValue: TValue,
  options?: SignalOptions<TValue>,
): SignalValue<TValue>;

/**
 * Creates an effect
 *
 * Effects are side-effects that automatically track their dependencies
 * and re-run when any dependency changes. Unlike signals and memos,
 * effects don't have a return value accessible to other reactive code.
 */
export function $effect<TValue>(
  fn: () => TValue,
  options?: SignalOptions<TValue>,
): () => void;

/**
 * Creates a memoized value
 *
 * Memos are cached computations that automatically update when their
 * dependencies change. They're perfect for derived values that are
 * expensive to calculate.
 */
export function $memo<TValue>(
  fn: () => TValue,
  options?: SignalOptions<TValue>,
): MemoValue<TValue>;

/**
 * Batches multiple signal updates
 *
 * Defers effect execution until all updates in the batch are complete,
 * which improves performance when making multiple related changes.
 */
export function batchSignals<TValue>(fn: () => TValue): TValue;

/**
 * Reads a value without tracking dependencies
 *
 * This prevents the current effect/memo from depending on
 * signals read within the provided function.
 */
export function untrack<TValue>(fn: () => TValue): TValue;

// ========== Context Functions ==========

/**
 * Creates a context for passing values down the scope tree
 *
 * Contexts allow passing values to deeply nested components without
 * explicit prop drilling. They're perfect for theme data, authentication
 * state, and other app-wide or section-specific data.
 */
export function createContext<TValue>(
  defaultValue: SignalValue<TValue> | TValue,
  options?: { name?: string },
): Context<TValue>;

/**
 * Gets a context value from the current scope or ancestors
 *
 * Retrieves the current value of a context, walking up the scope tree
 * to find the nearest provider. Falls back to default value if no provider
 * is found.
 */
export function getContext<TValue>(
  context: Context<TValue>,
): SignalValue<TValue>;

/**
 * Gets a derived value from a context
 *
 * Creates a memo that selects a specific part of a context value,
 * updating only when the selected part changes.
 */
export function getContextSelector<TValue, TSelectorReturn>(
  context: Context<TValue>,
  selector: (state: TValue) => TSelectorReturn,
): MemoValue<TSelectorReturn>;
