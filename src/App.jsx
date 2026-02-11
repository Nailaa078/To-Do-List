import { useState } from "react";

function App() {
  const [task, setTask] = useState("");
  const [todos, setTodos] = useState([]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (task.trim() === "") return;

    const newTask = {
      id: Date.now(),
      text: task,
      completed: false,
    };

    setTodos([...todos, newTask]);
    setTask("");
  };

  const handleDelete = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleToggle = (id) => {
    setTodos( todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  return (
    <div style={{ width: "400px", margin: "50px auto", textAlign: "center" }}>
      <h1>To-Do List</h1>

      <form onSubmit={handleAdd}>
        <input type="text" placeholder="Enter task" value={task} onChange={(e) => setTask(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li key={todo.id} style={{ marginTop: "10px" }}>
            <span onClick={() => handleToggle(todo.id)} style={{ cursor: "pointer", textDecoration: todo.completed ? "line-through" : "none", color: todo.completed ? "gray" : "black", }} >
              {todo.text}
            </span>

            <button onClick={() => handleDelete(todo.id)} style={{ marginLeft: "10px" }} >
              Close
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
