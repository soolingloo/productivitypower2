import { Category } from '../types';

const STORAGE_KEY = 'productivity-dashboard-data';

export const saveToStorage = (categories: Category[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
};

export const loadFromStorage = (): Category[] | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};
