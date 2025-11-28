import { supabase } from '../lib/supabase';
import { Category } from '../types';

const DEFAULT_CATEGORIES = [
  { name: 'Client', color: 'bg-blue-200' },
  { name: 'Biz System', color: 'bg-green-200' },
  { name: 'Web & Funnel', color: 'bg-purple-200' },
  { name: 'AI & Tech', color: 'bg-orange-200' },
  { name: 'Learning', color: 'bg-yellow-200' },
  { name: 'Personal', color: 'bg-pink-200' },
];

export async function loadUserData(userId: string): Promise<Category[]> {
  console.log('🔍 loadUserData called for:', userId);
  
  try {
    console.log('📡 Fetching categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (catError) {
      console.error('❌ Error loading categories:', catError);
      return [];
    }

    console.log('✅ Categories fetched:', categories?.length || 0);

    if (!categories || categories.length === 0) {
      console.log('📭 No categories found');
      return [];
    }

    console.log('📡 Fetching tasks...');
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (taskError) {
      console.error('❌ Error loading tasks:', taskError);
      return categories.map(cat => ({ ...cat, tasks: [] }));
    }

    console.log('✅ Tasks fetched:', tasks?.length || 0);

    const result = categories.map(cat => ({
      ...cat,
      tasks: (tasks || [])
        .filter(task => task.category_id === cat.id)
        .map(task => ({
          id: task.id,
          text: task.text,
          completed: task.completed,
          position: task.position,
          createdAt: new Date(task.created_at).getTime(),
        })),
    }));

    console.log('✅ loadUserData complete:', result.length, 'categories');
    return result;
  } catch (error) {
    console.error('❌ Error in loadUserData:', error);
    return [];
  }
}

export async function initializeDefaultCategories(userId: string): Promise<Category[]> {
  console.log('🆕 initializeDefaultCategories called for:', userId);
  
  try {
    const categories: Category[] = [];

    for (const defaultCat of DEFAULT_CATEGORIES) {
      console.log('➕ Creating category:', defaultCat.name);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: defaultCat.name,
          color: defaultCat.color,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating default category:', error);
        continue;
      }

      if (data) {
        console.log('✅ Category created:', data.name);
        categories.push({
          id: data.id,
          name: data.name,
          color: data.color,
          tasks: [],
        });
      }
    }

    console.log('✅ initializeDefaultCategories complete:', categories.length, 'categories');
    return categories;
  } catch (error) {
    console.error('❌ Error in initializeDefaultCategories:', error);
    return [];
  }
}

export async function saveCategory(userId: string, name: string, color: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name,
        color,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving category:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in saveCategory:', error);
    return null;
  }
}

export async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return false;
  }
}

export async function saveTask(
  userId: string,
  categoryId: string,
  text: string,
  position: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        category_id: categoryId,
        text,
        completed: false,
        position,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving task:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in saveTask:', error);
    return null;
  }
}

export async function updateTask(taskId: string, updates: { completed?: boolean; text?: string }): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTask:', error);
    return false;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return false;
  }
}

export async function reorderTasks(categoryId: string, taskIds: string[]): Promise<boolean> {
  try {
    for (let i = 0; i < taskIds.length; i++) {
      const { error } = await supabase
        .from('tasks')
        .update({ position: i })
        .eq('id', taskIds[i]);

      if (error) {
        console.error('Error reordering task:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in reorderTasks:', error);
    return false;
  }
}
