export interface Task {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  tasks: Task[];
  color: string;
}

export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DbTask {
  id: string;
  category_id: string;
  user_id: string;
  text: string;
  completed: boolean;
  position: number;
  created_at: string;
}
