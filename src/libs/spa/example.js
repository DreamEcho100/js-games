/** @import { SignalValue, MemoValue } from "#libs/spa/signals"; */

import { createSignal, createMemo, createScope } from "#libs/spa/signals.js";
import { t } from "#libs/spa/dom.js";
import { $list, $toggle } from "#libs/spa/dom-signals.js";

t.h1({});

/**
 * @typedef {{
 * 	completed?: boolean;
 *  editing?: boolean;
 *  id: number
 *  text: string
 * }} Todo
 */

/**
 *
 * @param {{
 * 	newTodoText: SignalValue<string>
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void
 *  getFilteredTodosSize: () => number
 *  getCompletedFilteredTodosSize: () => number
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
 * 	newTodoText: SignalValue<string>
 *  updateTodos: (cb: (value: Todo[]) => Todo[]) => void
 *  getFilteredTodosSize: () => number
 *  getCompletedFilteredTodosSize: () => number
 * }} props
 */
function NewTodoInput({
  newTodoText,
  updateTodos,
  getCompletedFilteredTodosSize,
  getFilteredTodosSize,
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

  return t.div(
    { className: "relative grid gap-2" },
    t.form(
      {
        className: "flex",
        onsubmit: (e) => {
          e.preventDefault();
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
            console.log("___ allCompleted", allCompleted);
            return allCompleted
              ? "▼ Mark all as incomplete"
              : "▼ Mark all as complete";
          },
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
        "group flex items-center border-b py-2 px-2 transition-all hover:bg-gray-50 max-w-full",
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
              "mr-3 h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500",
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
 *  filter: SignalValue<string>
 *  getFilteredTodosSize: () => number
 * }} props
 */
function Footer({
  getTodos,
  updateTodos,
  filteredRemainingCount,
  getFilteredTodosSize,
  hasCompleted,
  filter,
}) {
  function clearCompleted() {
    updateTodos((current) => current.filter((todo) => !todo.completed));
  }

  return $toggle(
    () => getTodos().length > 0,
    () =>
      t.footer(
        {
          className:
            "flex flex-wrap justify-between items-center text-sm text-gray-500 px-2",
        },
        t.span({ className: "mr-4 my-1" }, () => {
          const remaining = filteredRemainingCount();
          const total = getFilteredTodosSize();
          const completed = total - remaining;

          return `${completed} item${
            completed !== 1 ? "s" : ""
          } left  ${total} item${total !== 1 ? "s" : ""} left`;
        }),
        t.div(
          { className: "flex space-x-1 my-1" },
          FilterButton({ filterName: "all", label: "All", filter }),
          FilterButton({ filterName: "active", label: "Active", filter }),
          FilterButton({ filterName: "completed", label: "Completed", filter }),
        ),
        $toggle(hasCompleted, () =>
          t.button(
            {
              className:
                "my-1 text-gray-500 hover:text-gray-700 hover:underline transition-colors",
              onclick: clearCompleted,
            },
            "Clear completed",
          ),
        ),
      ),
  );
}

/**
 * @param {{
 * 	filterName: string;
 *  label: string;
 *  filter: SignalValue<string>;
 * }} props
 */
function FilterButton({ filterName, label, filter }) {
  return t.button(
    {
      className: () =>
        `px-3 py-1 rounded-md ${
          filter() === filterName
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100"
        }`,
      onclick: () => filter.set(filterName),
    },
    label,
  );
}

function Info() {
  return t.footer(
    { className: "text-center text-sm text-gray-500" },
    t.p({}, "Double-click to edit a todo"),
    t.p(
      {},
      "Created using tailwindcss, a custom DOM generator, and a custom signal library.",
    ),
  );
}

function TodoApp() {
  return createScope(() => {
    // State management
    const todos = createSignal(loadFromLocalStorage() || []);
    const filter = createSignal("all"); // "all" | "active" | "completed"
    const newTodoText = createSignal("");

    // Derived state
    const filteredTodos = createMemo(() => {
      const currentFilter = filter();
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
    const filteredTodosSize = createMemo(() => {
      return filteredTodos().length;
    });
    const completedFilteredTodosSize = createMemo(() => {
      return filteredTodos().filter((todo) => todo.completed).length;
    });
    const filteredRemainingCount = createMemo(() => {
      return filteredTodos().filter((todo) => !todo.completed).length;
    });
    const hasCompleted = createMemo(() => {
      return filteredTodos().some((todo) => todo.completed);
    });

    // // Persist to localStorage whenever todos change
    // createEffect(() => {
    //   const currentTodos = todos();
    //   localStorage.setItem("todos", JSON.stringify(currentTodos));
    // });

    // Helper functions
    /** @returns {Todo[]} */
    function loadFromLocalStorage() {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : [];
    }
    /** @param {(value: Todo[]) => Todo[]} cb */
    function updateTodos(cb) {
      todos.update((prev) => {
        const newValue = cb(prev);
        queueMicrotask(() => {
          localStorage.setItem("todos", JSON.stringify(newValue));
        });
        return newValue;
      });
    }

    // Main app container
    const appContainer = t.div(
      {
        className:
          "max-w-lg mx-auto my-8 bg-white rounded-lg shadow-xl p-6 w-80 max-w-full grid gap-4",
      },
      Header({
        newTodoText,
        updateTodos: updateTodos,
        getCompletedFilteredTodosSize: completedFilteredTodosSize,
        getFilteredTodosSize: filteredTodosSize,
      }),
      Main({
        filteredTodosSignal: filteredTodos,
        updateTodos: updateTodos,
      }),
      Footer({
        getTodos: todos,
        updateTodos: updateTodos,
        filteredRemainingCount,
        hasCompleted,
        filter,
        getFilteredTodosSize: filteredTodosSize,
      }),
      Info(),
    );

    return appContainer;
  }).result;
}

/**
 * Initialize the Todo app and mount it to the DOM.
 * @param {HTMLElement} [parent] - The parent element to mount the app to. Defaults to document.body.
 */
export function initializeTodoApp(parent) {
  // Mount the app to the DOM
  document.addEventListener("DOMContentLoaded", () => {
    const app = TodoApp();
    (parent ?? document.body).appendChild(app);

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
    document.body.classList.add(
      "bg-gray-100",
      "text-gray-800",
      "min-h-screen",
      "py-8",
      "font-sans",
    );
    document.body.style.fontFamily = "'Inter', sans-serif";
  });
}
