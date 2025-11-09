// Todo data fixtures
export const mockTodos = [
  {
    id: 'todo-1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the NovaTask application',
    completed: false,
    priority: 'high',
    dueDate: '2024-12-15',
    tags: ['documentation', 'important'],
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
  },
  {
    id: 'todo-2',
    title: 'Implement user authentication',
    description: 'Add login and registration functionality',
    completed: true,
    priority: 'high',
    dueDate: '2024-11-20',
    tags: ['authentication', 'security'],
    createdAt: '2024-10-15T09:30:00Z',
    updatedAt: '2024-11-05T14:20:00Z',
  },
  {
    id: 'todo-3',
    title: 'Design responsive layout',
    description: 'Create mobile-friendly responsive design',
    completed: false,
    priority: 'medium',
    dueDate: '2024-11-25',
    tags: ['design', 'responsive'],
    createdAt: '2024-10-20T11:15:00Z',
    updatedAt: '2024-10-20T11:15:00Z',
  },
  {
    id: 'todo-4',
    title: 'Add dark mode support',
    description: 'Implement dark theme toggle functionality',
    completed: false,
    priority: 'low',
    dueDate: '2024-12-01',
    tags: ['ui', 'feature'],
    createdAt: '2024-10-25T16:45:00Z',
    updatedAt: '2024-10-25T16:45:00Z',
  },
  {
    id: 'todo-5',
    title: 'Optimize performance',
    description: 'Improve application performance and loading times',
    completed: true,
    priority: 'medium',
    dueDate: '2024-11-10',
    tags: ['performance', 'optimization'],
    createdAt: '2024-10-05T13:30:00Z',
    updatedAt: '2024-11-08T10:15:00Z',
  },
];

// User data fixtures
export const mockUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      emailNotifications: false,
      autoSave: true,
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-11-01T12:30:00Z',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: false,
      emailNotifications: true,
      autoSave: false,
    },
    createdAt: '2024-02-20T10:15:00Z',
    updatedAt: '2024-10-28T09:45:00Z',
  },
];

// Statistics data fixtures
export const mockStats = {
  totalTodos: 5,
  completedTodos: 2,
  pendingTodos: 3,
  overdueTodos: 1,
  completionRate: 40,
  todosByPriority: {
    high: 2,
    medium: 2,
    low: 1,
  },
  todosByTag: {
    documentation: 1,
    important: 1,
    authentication: 1,
    security: 1,
    design: 1,
    responsive: 1,
    ui: 1,
    feature: 1,
    performance: 1,
    optimization: 1,
  },
  productivityTrend: [
    { date: '2024-11-01', completed: 1, created: 2 },
    { date: '2024-11-02', completed: 0, created: 1 },
    { date: '2024-11-03', completed: 2, created: 0 },
    { date: '2024-11-04', completed: 1, created: 1 },
    { date: '2024-11-05', completed: 0, created: 1 },
  ],
};

// Error response fixtures
export const errorResponses = {
  networkError: {
    success: false,
    error: 'Network error: Failed to fetch',
    code: 'NETWORK_ERROR',
  },
  serverError: {
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR',
  },
  notFoundError: {
    success: false,
    error: 'Resource not found',
    code: 'NOT_FOUND',
  },
  validationError: {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: {
      title: 'Title is required',
      dueDate: 'Due date must be in the future',
    },
  },
  unauthorizedError: {
    success: false,
    error: 'Unauthorized access',
    code: 'UNAUTHORIZED',
  },
};

// Form data fixtures
export const formData = {
  validTodo: {
    title: 'New test todo',
    description: 'This is a test todo item',
    priority: 'medium',
    dueDate: '2024-12-20',
    tags: ['test', 'example'],
  },
  invalidTodo: {
    title: '',
    description: '',
    priority: 'invalid',
    dueDate: '2020-01-01',
    tags: [],
  },
  validUser: {
    name: 'Test User',
    email: 'test@example.com',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
    },
  },
  invalidUser: {
    name: '',
    email: 'invalid-email',
    preferences: {
      theme: 'invalid-theme',
      language: 'invalid-lang',
      notifications: 'not-a-boolean',
    },
  },
};

// Filter and search fixtures
export const filterOptions = {
  all: { status: 'all', priority: 'all', tag: 'all' },
  completed: { status: 'completed', priority: 'all', tag: 'all' },
  pending: { status: 'pending', priority: 'all', tag: 'all' },
  highPriority: { status: 'all', priority: 'high', tag: 'all' },
  mediumPriority: { status: 'all', priority: 'medium', tag: 'all' },
  lowPriority: { status: 'all', priority: 'low', tag: 'all' },
  documentationTag: { status: 'all', priority: 'all', tag: 'documentation' },
};

export const searchQueries = {
  empty: '',
  singleWord: 'documentation',
  multipleWords: 'user authentication',
  nonExistent: 'nonexistent todo',
  specialChars: '@#$%^&*()',
  longQuery: 'a'.repeat(1000),
};

// Pagination fixtures
export const paginationData = {
  page1: {
    todos: mockTodos.slice(0, 2),
    currentPage: 1,
    totalPages: 3,
    totalItems: 5,
    hasNextPage: true,
    hasPrevPage: false,
  },
  page2: {
    todos: mockTodos.slice(2, 4),
    currentPage: 2,
    totalPages: 3,
    totalItems: 5,
    hasNextPage: true,
    hasPrevPage: true,
  },
  page3: {
    todos: mockTodos.slice(4),
    currentPage: 3,
    totalPages: 3,
    totalItems: 5,
    hasNextPage: false,
    hasPrevPage: true,
  },
};

// Performance test fixtures
export const performanceData = {
  largeTodoList: Array.from({ length: 1000 }, (_, i) => ({
    id: `todo-${i + 1}`,
    title: `Todo item ${i + 1}`,
    description: `Description for todo item ${i + 1}`,
    completed: i % 2 === 0,
    priority: ['low', 'medium', 'high'][i % 3],
    dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    tags: [`tag-${i % 10}`, `category-${i % 5}`],
    createdAt: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
    updatedAt: new Date(Date.now() - (i * 30 * 60 * 1000)).toISOString(),
  })),
};

// Accessibility test fixtures
export const accessibilityData = {
  elementsWithAriaLabels: [
    { selector: '[aria-label="Close dialog"]', expectedLabel: 'Close dialog' },
    { selector: '[aria-label="Add new todo"]', expectedLabel: 'Add new todo' },
    { selector: '[aria-label="Delete todo"]', expectedLabel: 'Delete todo' },
  ],
  elementsWithRoles: [
    { selector: '[role="button"]', expectedRole: 'button' },
    { selector: '[role="dialog"]', expectedRole: 'dialog' },
    { selector: '[role="list"]', expectedRole: 'list' },
  ],
  keyboardNavigableElements: [
    { selector: 'button', key: 'Enter', expectedAction: 'click' },
    { selector: 'input[type="text"]', key: 'Tab', expectedAction: 'focus' },
    { selector: '[tabindex="0"]', key: 'Space', expectedAction: 'click' },
  ],
};