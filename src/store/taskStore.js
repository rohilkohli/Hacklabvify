// src/store/taskStore.js
// Zustand store for task planning and AI-generated task approvals.

import { create } from 'zustand';

const STORAGE_KEY = 'hv_tasks';

const DEFAULT_TASKS = [
  { id: '1', title: 'Interview 5 target ICP customers regarding pricing sensitivity', category: 'Growth', priority: 'High', status: 'To Do', source: 'AI Advisory' },
  { id: '2', title: 'Update CAC/LTV unit economics model with Q3 actuals', category: 'Finance', priority: 'High', status: 'In Progress', source: 'Financial Tool' },
  { id: '3', title: 'Finalize YC monthly investor update memo', category: 'Investor', priority: 'Medium', status: 'To Do', source: 'Memo Generator' },
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Fail-safe
  }
}

export const useTaskStore = create((set, get) => ({
  tasks: loadTasks(),
  filterStatus: 'All', // 'All' | 'To Do' | 'In Progress' | 'Completed'

  setFilterStatus: (filterStatus) => set({ filterStatus }),

  addTask: (task) => {
    const newTask = {
      id: Date.now().toString(),
      title: task.title,
      category: task.category || 'General',
      priority: task.priority || 'Medium',
      status: 'To Do',
      source: task.source || 'Founder',
      createdAt: Date.now(),
    };
    set((state) => {
      const updated = [newTask, ...state.tasks];
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  addMultipleTasks: (taskList, source = 'AI Advisory') => {
    const newTasks = taskList.map((t, idx) => ({
      id: `${Date.now()}-${idx}`,
      title: typeof t === 'string' ? t : t.title,
      category: t.category || 'Strategy',
      priority: t.priority || 'High',
      status: 'To Do',
      source,
      createdAt: Date.now(),
    }));

    set((state) => {
      const updated = [...newTasks, ...state.tasks];
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  toggleTaskStatus: (id) => {
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'Completed' ? 'To Do' : t.status === 'To Do' ? 'In Progress' : 'Completed';
        return { ...t, status: nextStatus };
      });
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const updated = state.tasks.filter((t) => t.id !== id);
      saveTasks(updated);
      return { tasks: updated };
    });
  },
}));
