export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  tasks: Task[];
  color: string;
}
