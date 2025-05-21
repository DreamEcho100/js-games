/** @import { SignalValue, MemoValue } from "#libs/spa/signals"; */

import { $signal, $memo, createScope, $effect } from "#libs/spa/signals.js";
import { t } from "#libs/spa/dom.js";
import { $list, $toggle } from "#libs/spa/dom-signals.js";

/**
 * @typedef {{
 * 	completed?: boolean;
 *  editing?: boolean;
 *  id: number
 *  text: string
 * }} Todo
 *
 * @typedef {"all" | "active" | "completed"} TodoStatusFilter
 */

/**
 *
 * @param {{
 * 	newTodoText: SignalValue<string>;
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void;
 *  getFilteredTodosSize: () => number;
 *  getCompletedFilteredTodosSize: () => number;
 *  getIsInitializing: SignalValue<boolean>;
 * }} props
 */
function Header(props) {
  return t.header(
    { className: "grid gap-4" },
    t.h1(
      {
        className: "text-5xl text-center text-gray-600 font-thin",
      },
      "todos",
    ),
    NewTodoInput(props),
  );
}

/**
 *
 * @param {{
 * 	newTodoText: SignalValue<string>;
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void;
 *  getFilteredTodosSize: () => number;
 *  getCompletedFilteredTodosSize: () => number;
 *  getIsInitializing: SignalValue<boolean>;
 * }} props
 */
function NewTodoInput({
  newTodoText,
  updateTodos,
  getCompletedFilteredTodosSize,
  getFilteredTodosSize,
  getIsInitializing,
}) {
  /** @param {string} text  */
  function addTodo(text) {
    if (!text.trim()) return;

    updateTodos((current) => [
      ...current,
      {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        editing: false,
      },
    ]);

    newTodoText.set("");
  }

  /** @param {boolean} completed  */
  function toggleAll(completed) {
    updateTodos((current) => current.map((todo) => ({ ...todo, completed })));
  }

  function shuffleTodos() {
    updateTodos((current) => {
      const shuffled = [...current].sort(() => Math.random() - 0.5);
      return shuffled;
    });
  }

  return t.div(
    { className: "relative grid gap-4" },
    t.form(
      {
        className: "flex",
        onsubmit: (e) => {
          e.preventDefault();
          const isInitializing = getIsInitializing.peek();
          if (isInitializing) {
            return;
          }

          addTodo(newTodoText());
        },
      },
      t.input({
        className:
          "w-full shadow-sm px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-gray-700",
        placeholder: "What needs to be done?",
        value: () => newTodoText(),
        oninput: (e) => newTodoText.set(e.target.value),
      }),
    ),
    t.div(
      { className: "flex justify-between items-center" },
      $toggle(
        () => getFilteredTodosSize() > 0,
        () =>
          t.button(
            {
              className:
                "w-fit text-gray-400 hover:text-gray-700 transition-colors",
              onclick: () => {
                const allCompleted =
                  getCompletedFilteredTodosSize() === getFilteredTodosSize();
                toggleAll(!allCompleted);
              },
              ariaLabel: () => {
                const allCompleted =
                  getCompletedFilteredTodosSize() === getFilteredTodosSize();
                return allCompleted
                  ? "Mark all as incomplete"
                  : "Mark all as complete";
              },
            },
            () => {
              const allCompleted =
                getCompletedFilteredTodosSize() === getFilteredTodosSize();
              return allCompleted
                ? "▼ Mark all as incomplete"
                : "▼ Mark all as complete";
            },
          ),
      ),
      t.div(
        {
          className: "flex justify-end items-center",
        },
        t.button(
          {
            className: "text-gray-500 hover:text-gray-700",
            onclick: shuffleTodos,
            ariaLabel: "Shuffle todos",
          },
          "🔀",
        ),
      ),
    ),
  );
}

/**
 * @param {{
 * 	getTodo: SignalValue<Todo>
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void
 * }} props
 */
function TodoItem({ getTodo, updateTodos }) {
  /** @param {number} id  */
  function toggleTodo(id) {
    updateTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  /** @param {number} id  */
  function editTodo(id) {
    updateTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? { ...todo, editing: true }
          : { ...todo, editing: false },
      ),
    );
  }

  /** @param {number} id  */
  function removeTodo(id) {
    updateTodos((current) => current.filter((todo) => todo.id !== id));
  }

  /**
   *
   * @param {Todo['id']} id
   * @param {Todo['text']} text
   * @returns
   */
  function updateTodoText(id, text) {
    if (!text.trim()) {
      removeTodo(id);
      return;
    }

    updateTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, text: text.trim(), editing: false } : todo,
      ),
    );
  }

  return t.li(
    {
      className:
        "group flex items-center border-b py-2 px-2 transition-all hover:bg-gray-50 max-w-full last:border-b-0",
    },
    $toggle(
      () => !getTodo().editing,
      () => [
        t.div(
          {
            className: "flex items-center flex-1 max-w-[90%] ",
          },
          t.input({
            type: "checkbox",
            className:
              "me-3 h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500",
            checked: () => !!getTodo().completed,
            onchange: () => toggleTodo(getTodo().id),
            ariaLabel: () =>
              `Mark "${getTodo().text}" as ${
                getTodo().completed ? "incomplete" : "complete"
              }`,
          }),
          t.span(
            {
              className: () =>
                `flex-1 text-lg ${
                  getTodo().completed
                    ? "line-through text-gray-400 py-0.5 truncate"
                    : "text-gray-700 py-0.5 truncate"
                }`,
              ondblclick: () => editTodo(getTodo().id),
            },
            () => getTodo().text,
          ),
        ),
        t.button(
          {
            className:
              "opacity-90 group-hover:opacity-100 text-red-500 hover:text-red-700 px-2 transition-opacity shrink-0",
            onclick: () => removeTodo(getTodo().id),
            ariaLabel: `Delete ${getTodo().text}`,
          },
          "×",
        ),
      ],
    ),
    $toggle(
      () => getTodo().editing,
      () =>
        t.form(
          {
            className: "flex-1",
            onsubmit: (e) => {
              e.preventDefault();
              const input = e.target.querySelector("input");
              updateTodoText(getTodo().id, input?.value ?? "");
            },
            onkeydown: (e) => {
              if (e.key === "Escape") {
                updateTodos((current) =>
                  current.map((t) =>
                    t.id === getTodo().id ? { ...t, editing: false } : t,
                  ),
                );
              }
            },
          },
          t.input({
            className:
              "w-full px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-gray-700",
            value: getTodo().text,
            onblur: (e) => updateTodoText(getTodo().id, e.target.value),
            ref: (el) =>
              setTimeout(() => {
                el.focus();
                el.selectionStart = el.selectionEnd = el.value.length;
              }, 0),
          }),
        ),
    ),
  );
}

/**
 * @param {{
 *  filteredTodosSignal: MemoValue<Todo[]>
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void
 * }} props
 */
function Main({ filteredTodosSignal, updateTodos }) {
  return t.section(
    { className: "max-w-full overflow-hidden" },
    $toggle(
      () => filteredTodosSignal().length > 0,
      () =>
        t.ul(
          {
            className: "divide-y divide-gray-200 border-t border-b max-w-full",
          },
          $list(
            filteredTodosSignal,
            (todo) => todo.id,
            (todo) => TodoItem({ getTodo: todo, updateTodos }),
          ),
        ),
    ),
    $toggle(
      () => filteredTodosSignal().length === 0,
      () =>
        t.div(
          { className: "py-8 text-center text-gray-500" },
          t.p({}, "No todos yet. Add one above!"),
          t.div({ className: "text-5xl my-4 opacity-25" }, "📝"),
        ),
    ),
  );
}

/**
 * @param {{
 *  getTodos: () => Todo[]
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void
 *  filteredRemainingCount: MemoValue<number>
 *  hasCompleted: MemoValue<boolean>
 *  todoStatusFilter: SignalValue<TodoStatusFilter>
 *  getFilteredTodosSize: () => number
 * }} props
 */
function Footer({
  getTodos,
  updateTodos,
  filteredRemainingCount,
  getFilteredTodosSize,
  hasCompleted,
  todoStatusFilter,
}) {
  function clearCompleted() {
    updateTodos((current) => current.filter((todo) => !todo.completed));
  }

  return t.footer(
    { className: "grid gap-4" },
    $toggle(
      () => getTodos().length > 0,
      () =>
        t.div(
          {
            className:
              "flex flex-col gap-2 justify-center text-sm text-gray-500",
          },
          t.p({}, () => {
            const remaining = filteredRemainingCount();
            const total = getFilteredTodosSize();
            const completed = total - remaining;

            return `${completed} item${
              completed !== 1 ? "s" : ""
            } left  ${total} item${total !== 1 ? "s" : ""} left`;
          }),
          t.div(
            { className: "flex gap-x-1" },
            [
              { filterName: /** @type {const} */ ("all"), label: "All" },
              { filterName: /** @type {const} */ ("active"), label: "Active" },
              {
                filterName: /** @type {const} */ ("completed"),
                label: "Completed",
              },
            ].map(({ filterName, label }) =>
              FilterButton({ filterName, label, todoStatusFilter }),
            ),
          ),
          $toggle(hasCompleted, () =>
            t.button(
              {
                className:
                  "w-fit text-gray-500 hover:text-gray-700 hover:underline transition-colors",
                onclick: clearCompleted,
              },
              "Clear completed",
            ),
          ),
        ),
    ),
    t.div(
      { className: "text-center text-sm text-gray-500" },
      t.p({}, "Double-click to edit a todo"),
      t.p(
        {},
        "Created using tailwindcss, a custom DOM generator, and a custom signal library.",
      ),
    ),
  );
}

/**
 * @param {{
 * 	filterName: TodoStatusFilter;
 *  label: string;
 *  todoStatusFilter: SignalValue<TodoStatusFilter>;
 * }} props
 */
function FilterButton({ filterName, label, todoStatusFilter }) {
  return t.button(
    {
      className: () =>
        `px-3 py-1 rounded-md ${
          todoStatusFilter() === filterName
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100"
        }`,
      onclick: () => {
        todoStatusFilter.set(filterName);
        localStorage.setItem("todoStatusFilter", filterName);
      },
    },
    label,
  );
}

// Helper functions
/** @returns {Todo[]|undefined} */
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("todos");
    return saved && JSON.parse(saved);
  } catch (e) {
    console.error("Error loading todos from localStorage", e);
    return undefined;
  }
}
/** @returns {TodoStatusFilter|undefined} */
function loadTodoStatusFilter() {
  try {
    const saved = localStorage.getItem("todoStatusFilter");
    return saved && JSON.parse(saved);
  } catch (e) {
    console.error("Error loading todos from localStorage", e);
    return undefined;
  }
}

function TodoApp() {
  return createScope(() => {
    // State management
    const todos = $signal(/** @type {Todo[]} */ ([]));
    const todoStatusFilter = $signal(/** @type {TodoStatusFilter} */ ("all"));
    const newTodoText = $signal("");
    const isInitializing = $signal(true);

    // Derived state
    const filteredTodos = $memo(() => {
      const currentFilter = todoStatusFilter();
      const allTodos = todos();

      switch (currentFilter) {
        case "active":
          return allTodos.filter((todo) => !todo.completed);
        case "completed":
          return allTodos.filter((todo) => todo.completed);
        default:
          return allTodos;
      }
    });
    const filteredTodosSize = $memo(() => {
      return filteredTodos().length;
    });
    const completedFilteredTodosSize = $memo(() => {
      return filteredTodos().filter((todo) => todo.completed).length;
    });
    const filteredRemainingCount = $memo(() => {
      return filteredTodos().filter((todo) => !todo.completed).length;
    });
    const hasCompleted = $memo(() => {
      return filteredTodos().some((todo) => todo.completed);
    });

    /** @param {(value: Todo[]) => Todo[]} cb */
    function updateTodos(cb) {
      todos.update((prev) => {
        const newValue = cb(prev);
        queueMicrotask(() =>
          localStorage.setItem("todos", JSON.stringify(newValue)),
        );
        return newValue;
      });
    }

    $effect(() => {
      const savedTodos = loadFromLocalStorage();
      if (savedTodos) {
        todos.set(savedTodos);
      }
      const savedFilter = loadTodoStatusFilter();
      if (savedFilter) {
        todoStatusFilter.set(savedFilter);
      }
      isInitializing.set(false);
    });

    // Main app container
    const appContainer = t.div(
      {
        className:
          "max-w-lg mx-auto grid gap-4 bg-white rounded-lg shadow-xl p-6 w-80 max-w-full grid gap-8",
      },
      Header({
        newTodoText,
        updateTodos,
        getCompletedFilteredTodosSize: completedFilteredTodosSize,
        getFilteredTodosSize: filteredTodosSize,
        getIsInitializing: isInitializing,
      }),
      Main({
        filteredTodosSignal: filteredTodos,
        updateTodos,
      }),
      Footer({
        getTodos: todos,
        updateTodos,
        filteredRemainingCount,
        hasCompleted,
        todoStatusFilter,
        getFilteredTodosSize: filteredTodosSize,
      }),
    );

    return appContainer;
  });
}

/**
 * Initialize the Todo app and mount it to the DOM.
 * @param {HTMLElement} [parent] - The parent element to mount the app to. Defaults to document.body.
 */
export function initializeTodoApp(parent = document.body) {
  // Mount the app to the DOM
  document.addEventListener("DOMContentLoaded", () => {
    const app = TodoApp();
    (parent ?? document.body).appendChild(app.result);

    parent.classList.add(
      "min-h-screen",
      "flex",
      "items-center",
      "justify-center",
      "p-4",
      "overflow-hidden",
      "antialiased",
      "bg-gray-100",
      "text-gray-800",
    );

    // Add Tailwind CSS
    const tailwindLink = document.createElement("link");
    tailwindLink.rel = "stylesheet";
    // tailwindLink.href =
    //   "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
    document.head.appendChild(tailwindLink);

    // Add font
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(fontLink);

    // Set basic styles for the body
    document.body.classList.add("font-sans");
    document.body.style.fontFamily = "'Inter', sans-serif";
  });
}
