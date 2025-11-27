import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Category, Task } from '../types';
import { TaskItem } from './TaskItem';

interface CategoryCardProps {
  category: Category;
  onAddTask: (categoryId: string, taskText: string) => void;
  onToggleTask: (categoryId: string, taskId: string) => void;
  onDeleteTask: (categoryId: string, taskId: string) => void;
  onMoveTask: (categoryId: string, taskId: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
  onDeleteCategory,
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(category.id, newTaskText.trim());
      setNewTaskText('');
      setIsAdding(false);
    }
  };

  const completedCount = category.tasks.filter(t => t.completed).length;
  const totalCount = category.tasks.length;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className={`${category.color} p-4 text-gray-800 relative group`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/40 rounded"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-700 mt-1">
          {completedCount} of {totalCount} completed
        </p>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="space-y-2 flex-1 overflow-y-auto max-h-96">
          {category.tasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tasks yet</p>
          ) : (
            category.tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(category.id, task.id)}
                onDelete={() => onDeleteTask(category.id, task.id)}
                onMoveUp={() => onMoveTask(category.id, task.id, 'up')}
                onMoveDown={() => onMoveTask(category.id, task.id, 'down')}
                isFirst={index === 0}
                isLast={index === category.tasks.length - 1}
              />
            ))
          )}
        </div>

        {isAdding ? (
          <form onSubmit={handleAddTask} className="mt-4">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter task..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
              onBlur={() => {
                if (!newTaskText.trim()) {
                  setIsAdding(false);
                }
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-gray-600 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>
    </div>
  );
};
