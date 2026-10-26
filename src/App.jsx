import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "todolist-react";

const PRIORITIES = {
  high: { label: "High", order: 0 },
  medium: { label: "Medium", order: 1 },
  low: { label: "Low", order: 2 },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

function loadTodos() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t) => t && typeof t.text === "string")
      .map((t) => ({
        id: t.id ?? Date.now() + Math.random(),
        text: t.text,
        completed: !!t.completed,
        priority: PRIORITIES[t.priority] ? t.priority : "medium",
        due: typeof t.due === "string" ? t.due : "",
      }));
  } catch {
    return [];
  }
}

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDue(due) {
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function TodoItem({ todo, onToggle, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const [priority, setPriority] = useState(todo.priority);
  const [due, setDue] = useState(todo.due);

  const overdue = !todo.completed && todo.due && todo.due < todayString();

  const startEdit = () => {
    setText(todo.text);
    setPriority(todo.priority);
    setDue(todo.due);
    setEditing(true);
  };

  const save = () => {
    const clean = text.trim();
    if (clean) onSave(todo.id, { text: clean, priority, due });
    setEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <li className="item editing">
        <div className="edit-fields">
          <input
            type="text"
            className="edit-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={120}
            autoFocus
            aria-label="Edit task"
          />
          <div className="edit-row">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
              {Object.entries(PRIORITIES).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
          </div>
        </div>
        <div className="actions">
          <button type="button" className="icon save" onClick={save} aria-label="Save" title="Save">✓</button>
          <button type="button" className="icon cancel" onClick={() => setEditing(false)} aria-label="Cancel" title="Cancel">✕</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`item ${todo.completed ? "done" : ""}`}>
      <input
        type="checkbox"
        className="check"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label="Mark as done"
      />
      <div className="item-body" onDoubleClick={startEdit}>
        <span className="item-text">{todo.text}</span>
        <div className="meta">
          <span className={`tag p-${todo.priority}`}>{PRIORITIES[todo.priority].label}</span>
          {todo.due && (
            <span className={`due ${overdue ? "overdue" : ""}`}>
              📅 {formatDue(todo.due)}{overdue ? " · Overdue" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="actions">
        <button type="button" className="icon edit" onClick={startEdit} aria-label="Edit" title="Edit">✎</button>
        <button type="button" className="icon delete" onClick={() => onDelete(todo.id)} aria-label="Delete" title="Delete">🗑</button>
      </div>
    </li>
  );
}

function App() {
  const [todos, setTodos] = useState(loadTodos);
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      /* storage unavailable */
    }
  }, [todos]);

  const handleAdd = (e) => {
    e.preventDefault();
    const text = task.trim();
    if (!text) return;
    setTodos([...todos, { id: Date.now(), text, completed: false, priority, due }]);
    setTask("");
    setDue("");
    setPriority("medium");
  };

  const handleToggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const handleDelete = (id) => setTodos(todos.filter((t) => t.id !== id));

  const handleSave = (id, changes) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  const handleClearCompleted = () => setTodos(todos.filter((t) => !t.completed));

  const handleDeleteAll = () => {
    if (todos.length && window.confirm(`Delete all ${todos.length} tasks?`)) setTodos([]);
  };

  const completed = todos.filter((t) => t.completed).length;
  const percent = todos.length ? Math.round((completed / todos.length) * 100) : 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todos
      .filter((t) => (filter === "active" ? !t.completed : filter === "completed" ? t.completed : true))
      .filter((t) => (q ? t.text.toLowerCase().includes(q) : true))
      .sort((a, b) => Number(a.completed) - Number(b.completed) ||
        PRIORITIES[a.priority].order - PRIORITIES[b.priority].order);
  }, [todos, filter, query]);

  let emptyMessage = "No tasks yet. Add your first one above!";
  if (todos.length > 0) {
    if (query.trim()) emptyMessage = "No tasks match your search.";
    else if (filter === "active") emptyMessage = "No active tasks. Nice work! 🎉";
    else emptyMessage = "No completed tasks yet.";
  }

  return (
    <main className="page">
      <section className="card">
        <header className="header">
          <h1>To-Do List</h1>
          <p className="subtitle">
            {todos.length === 0 ? "Nothing to do yet" : `${completed} of ${todos.length} completed`}
          </p>
          <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar" style={{ width: `${percent}%` }} />
          </div>
        </header>

        <form className="add" onSubmit={handleAdd}>
          <div className="add-main">
            <input
              type="text"
              className="add-input"
              placeholder="What needs to be done?"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              maxLength={120}
              aria-label="New task"
            />
            <button type="submit" className="add-btn">Add</button>
          </div>
          <div className="add-options">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
              {Object.entries(PRIORITIES).map(([k, p]) => (
                <option key={k} value={k}>{p.label} priority</option>
              ))}
            </select>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
          </div>
        </form>

        <div className="toolbar">
          <div className="filters" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`filter ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="search"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        <ul className="list">
          {visible.length === 0 ? (
            <li className="empty">{emptyMessage}</li>
          ) : (
            visible.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onSave={handleSave}
              />
            ))
          )}
        </ul>

        <footer className="footer">
          <span>{todos.length} {todos.length === 1 ? "task" : "tasks"} total</span>
          <button type="button" className="link" onClick={handleClearCompleted} disabled={completed === 0}>
            Clear completed
          </button>
          <button type="button" className="link danger" onClick={handleDeleteAll} disabled={todos.length === 0}>
            Delete all
          </button>
        </footer>
      </section>
      <p className="credit">Made by <strong>Naila Siddiq</strong></p>
    </main>
  );
}

export default App;
