export interface Task {
  id: string;
  description: string;
  assignee: 'Developer' | 'Tester' | 'Researcher' | 'Doc Creator';
  status: 'planning' | 'coding' | 'testing' | 'complete' | 'review';
  code?: string;
  testResults?: string;
}
