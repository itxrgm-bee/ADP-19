const STORAGE_KEY = "my-todo-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const clearAllButton = document.querySelector("#clear-all");
const formMessage = document.querySelector("#form-message");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks === null) {
      return [
        { id: "starter-walk", title: "Take a 20-minute walk", completed: false },
        { id: "starter-water", title: "Drink a glass of water", completed: false },
        { id: "starter-priorities", title: "Choose today's top priorities", completed: false },
        { id: "starter-reading", title: "Read for 15 minutes", completed: false },
      ];
    }

    const savedTasks = JSON.parse(storedTasks);
    if (!Array.isArray(savedTasks)) return [];

    return savedTasks.filter((task) => (
      task && typeof task.id === "string" && typeof task.title === "string" && typeof task.completed === "boolean"
    ));
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    formMessage.textContent = "Your browser could not save this change.";
  }
}

function createTaskId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((task) => !task.completed);
  if (currentFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren();

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-complete" : ""}`;
    item.dataset.taskId = task.id;

    const label = document.createElement("label");
    label.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.completed ? "Mark active" : "Complete"}: ${task.title}`);

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = createTaskAction("Edit", "edit", "edit-button");
    editButton.setAttribute("aria-label", `Edit: ${task.title}`);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", `Delete: ${task.title}`);
    deleteButton.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11M8 6V4.5h4V6m-6.5 0 .7 9h6.6l.7-9M8.5 9v3.5m3-3.5v3.5" /></svg>';

    label.append(checkbox, title);
  actions.append(editButton, deleteButton);
  item.append(label, actions);
    taskList.append(item);
  });

  const activeCount = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
  clearCompletedButton.disabled = !tasks.some((task) => task.completed);
  clearAllButton.disabled = tasks.length === 0;
  taskList.hidden = visibleTasks.length === 0;
  emptyState.classList.toggle("is-visible", visibleTasks.length === 0);

  const hasNoTasks = tasks.length === 0;
  emptyState.querySelector(".empty-title").textContent = hasNoTasks ? "No tasks yet" : `No ${currentFilter} tasks`;
  emptyState.querySelector(".empty-copy").textContent = hasNoTasks
    ? "Add a task above to get started."
    : "Try another filter to see your tasks.";
}

function createTaskAction(text, action, className) {
  const button = document.createElement("button");
  button.className = `task-action-button ${className}`;
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  return button;
}

function startTaskEdit(item) {
  const task = tasks.find((candidate) => candidate.id === item.dataset.taskId);
  if (!task) return;

  item.classList.add("is-editing");
  const checkbox = item.querySelector(".task-checkbox");
  checkbox.disabled = true;

  const editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.type = "text";
  editInput.maxLength = 200;
  editInput.value = task.title;
  editInput.setAttribute("aria-label", "Edit task title");

  const main = document.createElement("div");
  main.className = "task-main";
  main.append(checkbox, editInput);
  item.querySelector(".task-main").replaceWith(main);

  const actions = item.querySelector(".task-actions");
  actions.replaceChildren(
    createTaskAction("Save", "save", "save-button"),
    createTaskAction("Cancel", "cancel", "cancel-button")
  );
  editInput.focus();
  editInput.select();
}

function saveTaskEdit(item) {
  const editInput = item.querySelector(".edit-input");
  const title = editInput.value.trim();
  if (!title) {
    formMessage.textContent = "Task title cannot be empty.";
    editInput.focus();
    return;
  }

  const task = tasks.find((candidate) => candidate.id === item.dataset.taskId);
  if (!task) return;

  task.title = title;
  saveTasks();
  formMessage.textContent = "";
  renderTasks();
}

function cancelTaskEdit() {
  formMessage.textContent = "";
  renderTasks();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();

  if (!title) {
    formMessage.textContent = "Please enter a task first.";
    input.focus();
    return;
  }

  tasks.unshift({ id: createTaskId(), title, completed: false });
  currentFilter = "all";
  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  saveTasks();
  formMessage.textContent = "";
  input.value = "";
  renderTasks();
  input.focus();
});

taskList.addEventListener("change", (event) => {
  if (!event.target.matches(".task-checkbox")) return;

  const item = event.target.closest(".task-item");
  const task = tasks.find((candidate) => candidate.id === item.dataset.taskId);
  if (!task) return;

  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const item = button.closest(".task-item");
  if (button.dataset.action === "edit") {
    startTaskEdit(item);
    return;
  }
  if (button.dataset.action === "save") {
    saveTaskEdit(item);
    return;
  }
  if (button.dataset.action === "cancel") {
    cancelTaskEdit();
    return;
  }

  if (button.dataset.action !== "delete") return;
  const taskId = item.dataset.taskId;
  item.classList.add("is-removing");
  button.disabled = true;
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  const activeCount = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
  clearCompletedButton.disabled = !tasks.some((task) => task.completed);
  clearAllButton.disabled = tasks.length === 0;
  window.setTimeout(renderTasks, 180);
});

taskList.addEventListener("keydown", (event) => {
  if (!event.target.matches(".edit-input")) return;

  if (event.key === "Enter") {
    event.preventDefault();
    saveTaskEdit(event.target.closest(".task-item"));
  } else if (event.key === "Escape") {
    cancelTaskEdit();
  }
});

taskList.addEventListener("input", (event) => {
  if (event.target.matches(".edit-input")) formMessage.textContent = "";
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const selected = filterButton === button;
      filterButton.classList.toggle("is-selected", selected);
      filterButton.setAttribute("aria-pressed", String(selected));
    });
    renderTasks();
  });
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

clearAllButton.addEventListener("click", () => {
  if (tasks.length === 0 || !window.confirm("Clear all tasks? This cannot be undone.")) return;

  tasks = [];
  saveTasks();
  renderTasks();
});

input.addEventListener("input", () => {
  formMessage.textContent = "";
});

renderTasks();