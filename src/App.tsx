import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, LogOut } from 'lucide-react';
import { Category, Task } from './types';
import { CategoryCard } from './components/CategoryCard';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AuthPage } from './components/AuthPage';
import { EmailConfirmedPopup } from './components/EmailConfirmedPopup';
import { supabase } from './lib/supabase';
import { saveToStorage, loadFromStorage, clearStorage } from './utils/storage';
import { getRandomColor } from './utils/colors';

const initialCategories: Category[] = [
  { id: '1', name: 'Client', tasks: [], color: 'bg-blue-200' },
  { id: '2', name: 'Biz System', tasks: [], color: 'bg-purple-200' },
  { id: '3', name: 'Web & Funnel', tasks: [], color: 'bg-green-200' },
  { id: '4', name: 'AI & Tech', tasks: [], color: 'bg-orange-200' },
  { id: '5', name: 'Learning', tasks: [], color: 'bg-pink-200' },
  { id: '6', name: 'Personal', tasks: [], color: 'bg-teal-200' },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false);

  useEffect(() => {
    // Check URL parameters immediately on mount
    const urlHash = window.location.hash;
    
    // Check for confirmation in hash
    const hasConfirmation = urlHash.includes('type=signup');
    
    if (hasConfirmation) {
      setShowEmailConfirmed(true);
      // Don't clean up URL yet - let Supabase process it first
    }

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        setCurrentUser({ email: session.user.email!, name: userName });
        setIsAuthenticated(true);

        // Clean up URL after successful sign in
        if (window.location.hash.includes('type=signup')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setCategories([]);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        setCurrentUser({ email: session.user.email!, name: userName });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const saved = loadFromStorage();
      
      if (saved) {
        const needsMigration = saved.some(cat => 
          !cat.color || !cat.color.includes('-200')
        );
        
        if (needsMigration) {
          clearStorage();
          setCategories(initialCategories);
        } else {
          setCategories(saved);
        }
      } else {
        setCategories(initialCategories);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (categories.length > 0 && isAuthenticated) {
      saveToStorage(categories);
    }
  }, [categories, isAuthenticated]);

  const handleLogin = (email: string, name: string) => {
    setCurrentUser({ email, name });
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCategories([]);
    }
  };

  const addCategory = (name: string) => {
    const usedColors = categories.map(c => c.color);
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      tasks: [],
      color: getRandomColor(usedColors),
    };
    setCategories([...categories, newCategory]);
  };

  const deleteCategory = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category and all its tasks?')) {
      setCategories(categories.filter(c => c.id !== categoryId));
    }
  };

  const addTask = (categoryId: string, taskText: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        const newTask: Task = {
          id: Date.now().toString(),
          text: taskText,
          completed: false,
          createdAt: Date.now(),
        };
        return { ...category, tasks: [...category.tasks, newTask] };
      }
      return category;
    }));
  };

  const toggleTask = (categoryId: string, taskId: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          tasks: category.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      }
      return category;
    }));
  };

  const deleteTask = (categoryId: string, taskId: string) => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          tasks: category.tasks.filter(task => task.id !== taskId),
        };
      }
      return category;
    }));
  };

  const moveTask = (categoryId: string, taskId: string, direction: 'up' | 'down') => {
    setCategories(categories.map(category => {
      if (category.id === categoryId) {
        const taskIndex = category.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return category;

        const newTasks = [...category.tasks];
        const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;

        if (targetIndex < 0 || targetIndex >= newTasks.length) return category;

        [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];

        return { ...category, tasks: newTasks };
      }
      return category;
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        {showEmailConfirmed && (
          <EmailConfirmedPopup onClose={() => setShowEmailConfirmed(false)} />
        )}
      </>
    );
  }

  const totalTasks = categories.reduce((sum, cat) => sum + cat.tasks.length, 0);
  const completedTasks = categories.reduce(
    (sum, cat) => sum + cat.tasks.filter(t => t.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                My Productivity Power
              </h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold">{currentUser?.name}</span>! Organize your tasks across different areas of life
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Category
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{completedTasks}</span> of{' '}
                <span className="font-semibold text-gray-800">{totalTasks}</span> tasks completed
              </span>
            </div>
            {totalTasks > 0 && (
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onMoveTask={moveTask}
              onDeleteCategory={deleteCategory}
            />
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No categories yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Category
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCategory}
        />
      )}

      {showEmailConfirmed && (
        <EmailConfirmedPopup onClose={() => setShowEmailConfirmed(false)} />
      )}
    </div>
  );
}

export default App;
