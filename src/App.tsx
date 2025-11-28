import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, LogOut } from 'lucide-react';
import { Category, Task } from './types';
import { CategoryCard } from './components/CategoryCard';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AuthPage } from './components/AuthPage';
import { EmailConfirmedPopup } from './components/EmailConfirmedPopup';
import { supabase } from './lib/supabase';
import { getRandomColor } from './utils/colors';
import {
  loadUserData,
  initializeDefaultCategories,
  saveCategory,
  deleteCategory as dbDeleteCategory,
  saveTask,
  updateTask,
  deleteTask as dbDeleteTask,
  reorderTasks,
} from './utils/database';

function App() {
  console.log('🚀 App component rendering');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false);

  useEffect(() => {
    console.log('🔵 useEffect triggered');
    
    const urlHash = window.location.hash;
    const hasConfirmation = urlHash.includes('type=signup');
    
    if (hasConfirmation) {
      setShowEmailConfirmed(true);
    }

    let mounted = true;

    const initAuth = async () => {
      console.log('🔐 Starting auth check...');
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );

        const authPromise = supabase.auth.getSession();

        const { data: { session } } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        console.log('✅ Auth check complete:', session ? 'User found' : 'No user');

        if (!mounted) return;

        if (session?.user) {
          const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
          setCurrentUser({ 
            id: session.user.id,
            email: session.user.email!, 
            name: userName 
          });
          setIsAuthenticated(true);

          console.log('📦 Loading categories for user:', session.user.id);
          await loadCategories(session.user.id);
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
      } finally {
        if (mounted) {
          console.log('✅ Setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
        setCurrentUser({ 
          id: session.user.id,
          email: session.user.email!, 
          name: userName 
        });
        setIsAuthenticated(true);

        if (window.location.hash.includes('type=signup')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        await loadCategories(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setCategories([]);
      }
    });

    return () => {
      console.log('🧹 Cleanup: unmounting');
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  const loadCategories = async (userId: string) => {
    console.log('📂 loadCategories called for:', userId);
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Load categories timeout')), 5000)
      );

      const loadPromise = loadUserData(userId);

      const data = await Promise.race([loadPromise, timeoutPromise]) as Category[];
      
      console.log('📊 Categories loaded:', data.length);
      
      if (data.length === 0) {
        console.log('🆕 No categories, initializing defaults...');
        const defaultCats = await initializeDefaultCategories(userId);
        console.log('✅ Default categories created:', defaultCats.length);
        setCategories(defaultCats);
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleLogin = (email: string, name: string) => {
    console.log('👤 handleLogin called');
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCategories([]);
    }
  };

  const addCategory = async (name: string) => {
    if (!currentUser) {
      alert('Error: You must be logged in to add a category');
      return;
    }

    const usedColors = categories.map(c => c.color);
    const color = getRandomColor(usedColors);
    
    const categoryId = await saveCategory(currentUser.id, name, color);
    
    if (categoryId) {
      const newCategory: Category = {
        id: categoryId,
        name,
        tasks: [],
        color,
      };
      setCategories([...categories, newCategory]);
    } else {
      alert('Failed to create category. Please try again.');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category and all its tasks?')) {
      const success = await dbDeleteCategory(categoryId);
      if (success) {
        setCategories(categories.filter(c => c.id !== categoryId));
      }
    }
  };

  const addTask = async (categoryId: string, taskText: string) => {
    if (!currentUser) return;

    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const position = category.tasks.length;
    const taskId = await saveTask(currentUser.id, categoryId, taskText, position);

    if (taskId) {
      setCategories(categories.map(cat => {
        if (cat.id === categoryId) {
          const newTask: Task = {
            id: taskId,
            text: taskText,
            completed: false,
            position,
            createdAt: Date.now(),
          };
          return { ...cat, tasks: [...cat.tasks, newTask] };
        }
        return cat;
      }));
    }
  };

  const toggleTask = async (categoryId: string, taskId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const task = category?.tasks.find(t => t.id === taskId);
    
    if (!task) return;

    const success = await updateTask(taskId, { completed: !task.completed });
    
    if (success) {
      setCategories(categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            tasks: cat.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            ),
          };
        }
        return cat;
      }));
    }
  };

  const deleteTask = async (categoryId: string, taskId: string) => {
    const success = await dbDeleteTask(taskId);
    
    if (success) {
      setCategories(categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            tasks: cat.tasks.filter(t => t.id !== taskId),
          };
        }
        return cat;
      }));
    }
  };

  const moveTask = async (categoryId: string, taskId: string, direction: 'up' | 'down') => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const taskIndex = category.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (targetIndex < 0 || targetIndex >= category.tasks.length) return;

    const newTasks = [...category.tasks];
    [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];

    const taskIds = newTasks.map(t => t.id);
    const success = await reorderTasks(categoryId, taskIds);

    if (success) {
      setCategories(categories.map(cat => {
        if (cat.id === categoryId) {
          return { 
            ...cat, 
            tasks: newTasks.map((task, index) => ({ ...task, position: index }))
          };
        }
        return cat;
      }));
    }
  };

  console.log('📊 Render state:', { isLoading, isAuthenticated, categoriesCount: categories.length });

  if (isLoading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Check console for debug info</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔓 Showing auth page');
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        {showEmailConfirmed && (
          <EmailConfirmedPopup onClose={() => setShowEmailConfirmed(false)} />
        )}
      </>
    );
  }

  console.log('✅ Showing main app');

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
