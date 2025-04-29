/** @import { SignalValue, MemoValue } from "#libs/spa/signals"; */

import {
  createEffect,
  createSignal,
  createMemo,
  createScope,
  // onScopeCleanup,
} from "#libs/spa/signals.js";
import { tagsProxy as t } from "#libs/spa/dom.js";
import { $list, $toggle } from "#libs/spa/dom-signal.js";

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
 *  todos: SignalValue<Todo[]>
 * }} props
 */
function Header(props) {
  return t.header(
    { className: "mb-4" },
    t.h1(
      {
        className: "text-5xl text-center text-gray-600 font-thin mb-6",
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
 *  todos: SignalValue<Todo[]>
 * }} props
 */
function NewTodoInput({ newTodoText, todos }) {
  /** @param {string} text  */
  function addTodo(text) {
    if (!text.trim()) return;

    todos.update((current) => [
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
    todos.update((current) => current.map((todo) => ({ ...todo, completed })));
  }

  return t.div(
    { className: "relative" },
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
      () => todos().length > 0,
      () =>
        t.button(
          {
            className: "text-gray-400 hover:text-gray-700 transition-colors",
            onclick: () => {
              const allCompleted = todos().every((todo) => todo.completed);
              toggleAll(!allCompleted);
            },
            ariaLabel: () => {
              const allCompleted = todos().every((todo) => todo.completed);
              return allCompleted
                ? "Mark all as incomplete"
                : "Mark all as complete";
            },
          },
          "▼ Mark",
        ),
    ),
  );
}

/**
 * @param {{
 * 	todo: Todo
 *  todos: SignalValue<Todo[]>
 * }} props
 */
function TodoItem({ todo, todos }) {
  /** @param {number} id  */
  function toggleTodo(id) {
    todos.update((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  /** @param {number} id  */
  function editTodo(id) {
    todos.update((current) =>
      current.map((todo) =>
        todo.id === id
          ? { ...todo, editing: true }
          : { ...todo, editing: false },
      ),
    );
  }

  /** @param {number} id  */
  function removeTodo(id) {
    todos.update((current) => current.filter((todo) => todo.id !== id));
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

    todos.update((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, text: text.trim(), editing: false } : todo,
      ),
    );
  }

  return t.li(
    {
      // key: todo.id,
      className:
        "group flex items-center border-b py-3 px-2 transition-all hover:bg-gray-50",
    },
    $toggle(
      () => !todo.editing,
      () => [
        t.div(
          {
            className: "flex items-center flex-1",
          },
          t.input({
            type: "checkbox",
            className:
              "mr-3 h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500",
            checked: () => !!todo.completed,
            onchange: () => toggleTodo(todo.id),
            ariaLabel: () =>
              `Mark "${todo.text}" as ${
                todo.completed ? "incomplete" : "complete"
              }`,
          }),
          t.span(
            {
              className: () =>
                `flex-1 text-lg ${
                  todo.completed
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`,
              ondblclick: () => editTodo(todo.id),
            },
            todo.text,
          ),
        ),
        t.button(
          {
            className:
              "opacity-90 group-hover:opacity-100 text-red-500 hover:text-red-700 px-2 transition-opacity",
            onclick: () => removeTodo(todo.id),
            ariaLabel: `Delete ${todo.text}`,
          },
          "×",
        ),
      ],
    ),
    $toggle(
      () => todo.editing,
      () =>
        t.form(
          {
            className: "flex-1",
            onsubmit: (e) => {
              e.preventDefault();
              const input = e.target.querySelector("input");
              updateTodoText(todo.id, input?.value ?? "");
            },
            onkeydown: (e) => {
              if (e.key === "Escape") {
                todos.update((current) =>
                  current.map((t) =>
                    t.id === todo.id ? { ...t, editing: false } : t,
                  ),
                );
              }
            },
          },
          t.input({
            className:
              "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            value: todo.text,
            onblur: (e) => updateTodoText(todo.id, e.target.value),
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
 *  todos: SignalValue<Todo[]>
 *  filteredTodos: MemoValue<Todo[]>
 * }} props
 */
function Main({ todos, filteredTodos }) {
  return t.section(
    { className: "mb-6" },
    $toggle(
      () => todos().length > 0,
      () =>
        t.ul(
          {
            className: "divide-y divide-gray-200 border-t border-b",
          },
          $list(
            filteredTodos,
            (todo) => todo.id,
            (todo) => TodoItem({ todo, todos }),
          ),
        ),
    ),
    $toggle(
      () => todos().length === 0,
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
 *  todos: SignalValue<Todo[]>
 *  remainingCount: MemoValue<number>
 *  hasCompleted: MemoValue<boolean>
 *  filter: SignalValue<string>
 * }} props
 */
function Footer({ todos, remainingCount, hasCompleted, filter }) {
  function clearCompleted() {
    todos.update((current) => current.filter((todo) => !todo.completed));
  }

  return $toggle(
    () => todos().length > 0,
    () =>
      t.footer(
        {
          className:
            "flex flex-wrap justify-between items-center text-sm text-gray-500 py-2 px-2",
        },
        t.span(
          { className: "mr-4 my-1" },
          // Needs to make a reactive children function
          // () => {
          // 	const count = remainingCount();
          // 	return `${count} item${count !== 1 ? "s" : ""} left`;
          // }
          `${remainingCount.peek()} item${
            remainingCount.peek() !== 1 ? "s" : ""
          } left`,
        ),
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

// * @param {string} filterName
// * @param {string} label
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
    { className: "mt-8 text-center text-sm text-gray-500" },
    t.p({}, "Double-click to edit a todo"),
    t.p({ className: "mt-2" }, "Created using signals.js and tailwindcss"),
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

    const remainingCount = createMemo(() => {
      return todos().filter((todo) => !todo.completed).length;
    });

    const hasCompleted = createMemo(() => {
      return todos().some((todo) => todo.completed);
    });

    // Persist to localStorage whenever todos change
    createEffect(() => {
      const currentTodos = todos();
      localStorage.setItem("todos", JSON.stringify(currentTodos));
    });

    // Helper functions
    /** @returns {Todo[]} */
    function loadFromLocalStorage() {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : [];
    }

    // Main app container
    const appContainer = t.div(
      {
        className:
          "max-w-lg mx-auto my-8 bg-white rounded-lg shadow-xl p-6 w-80 max-w-full",
      },
      Header({ newTodoText, todos }),
      Main({ todos, filteredTodos }),
      Footer({ todos, remainingCount, hasCompleted, filter }),
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
    tailwindLink.href =
      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
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
