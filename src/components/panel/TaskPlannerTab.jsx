// src/components/panel/TaskPlannerTab.jsx
// Task Planner tab for the Right Tools Panel.

import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore.js';

export function TaskPlannerTab({ onToast }) {
  const { tasks, filterStatus, setFilterStatus, addTask, toggleTaskStatus, deleteTask } = useTaskStore();
  const [newTitle, setNewTitle] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'All') return true;
    return t.status === filterStatus;
  });

  const handleAddTask = (e) => {
    e?.preventDefault();
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), category: 'Growth', priority: 'High', source: 'Founder' });
    setNewTitle('');
    onToast?.('Task added to planner');
  };

  return (
    <div className="tab-pane-container">
      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['All', 'To Do', 'In Progress', 'Completed'].map((status) => (
          <button
            key={status}
            className={`suggestion-chip ${filterStatus === status ? 'active' : ''}`}
            style={{ fontSize: '10.5px', padding: '3px 8px' }}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Add Task Input */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          className="context-input"
          placeholder="Add executive task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button className="mini-link-btn" type="submit" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
      </form>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tasks found</div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'Completed';
            return (
              <div key={task.id} className="slide-card-item" style={{ opacity: isDone ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input type="checkbox" checked={isDone} onChange={() => toggleTaskStatus(task.id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {task.category} · {task.priority} Priority
                    </div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '11px' }}
                    onClick={() => deleteTask(task.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
