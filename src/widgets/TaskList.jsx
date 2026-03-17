import React, { useState, useEffect, useRef } from 'react';
import { getLocal, setLocal } from '../storage.js';

const STORAGE_KEY = 'tasklist_items';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getLocal(STORAGE_KEY).then(val => {
      if (Array.isArray(val)) setTasks(val);
      setLoaded(true);
    });
  }, []);

  // Persist whenever tasks change (after initial load)
  useEffect(() => {
    if (loaded) setLocal(STORAGE_KEY, tasks);
  }, [tasks, loaded]);

  function addTask() {
    const text = input.trim();
    if (!text) return;
    setTasks(prev => [{ id: Date.now(), text, done: false }, ...prev]);
    setInput('');
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function removeTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function clearCompleted() {
    setTasks(prev => prev.filter(t => !t.done));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTask();
  }

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="widget-card" style={s.card}>
      <style>{cssText}</style>
      <div className="widget-header">
        <span>Tasks</span>
        {tasks.length > 0 && (
          <span className="tl-count">{doneCount} of {tasks.length} done</span>
        )}
      </div>
      <div className="widget-content">
        <div className="tl-add-row">
          <input
            ref={inputRef}
            className="tl-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
          />
          <button className="tl-add-btn" onClick={addTask} title="Add task">+</button>
        </div>
        <div className="tl-list">
          {tasks.length === 0 && (
            <div className="tl-empty">No tasks yet</div>
          )}
          {tasks.map(task => (
            <div key={task.id} className={`tl-item${task.done ? ' tl-done' : ''}`}>
              <label className="tl-check-label">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="tl-checkbox"
                />
                <span className="tl-checkmark" />
              </label>
              <span className="tl-text">{task.text}</span>
              <button className="tl-remove" onClick={() => removeTask(task.id)} title="Delete">&times;</button>
            </div>
          ))}
        </div>
        {doneCount > 0 && (
          <button className="tl-clear-btn" onClick={clearCompleted}>
            Clear completed ({doneCount})
          </button>
        )}
      </div>
    </div>
  );
}

const cssText = `
  .tl-add-row {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }
  .tl-input {
    flex: 1;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    padding: 0.45rem 0.6rem;
    outline: none;
    transition: border-color 0.15s;
  }
  .tl-input:focus {
    border-color: var(--accent);
  }
  .tl-input::placeholder {
    color: var(--text-muted);
  }
  .tl-add-btn {
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 700;
    width: 34px;
    cursor: pointer;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .tl-add-btn:hover { opacity: 0.85; }
  .tl-list {
    max-height: 220px;
    overflow-y: auto;
  }
  .tl-empty {
    text-align: center;
    padding: 1.25rem 0;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .tl-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border);
    animation: tl-fade-in 0.2s ease;
  }
  .tl-item:last-child { border-bottom: none; }
  @keyframes tl-fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .tl-check-label {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .tl-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
  .tl-checkmark {
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--border);
    border-radius: 4px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tl-checkbox:checked + .tl-checkmark {
    background: var(--accent);
    border-color: var(--accent);
  }
  .tl-checkbox:checked + .tl-checkmark::after {
    content: '';
    width: 4px;
    height: 8px;
    border: solid var(--bg-primary);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-top: -1px;
  }
  .tl-text {
    flex: 1;
    font-size: 0.8rem;
    color: var(--text-primary);
    transition: all 0.2s;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tl-done .tl-text {
    text-decoration: line-through;
    color: var(--text-muted);
  }
  .tl-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
    padding: 0 0.15rem;
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  .tl-item:hover .tl-remove { opacity: 1; }
  .tl-remove:hover { color: var(--error); }
  .tl-clear-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 0.7rem;
    padding: 0.4rem 0;
    width: 100%;
    text-align: center;
    transition: color 0.15s;
  }
  .tl-clear-btn:hover { color: var(--text-secondary); }
  .tl-count {
    font-size: 0.65rem;
    color: var(--text-muted);
  }
`;

const s = {
  card: {
    minWidth: 0,
  },
};
