import { faker } from '@faker-js/faker';

// Base factory interface
interface Factory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
}

// Todo factory
interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const createTodo = (): Todo => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  completed: faker.datatype.boolean(),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
  dueDate: faker.date.future().toISOString().split('T')[0],
  tags: faker.helpers.arrayElements(['work', 'personal', 'urgent', 'important', 'later'], { min: 1, max: 3 }),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

export const todoFactory: Factory<Todo> = {
  create: (overrides = {}) => ({
    ...createTodo(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => todoFactory.create(overrides)),
};

// User factory
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
    emailNotifications: boolean;
    autoSave: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const createUser = (): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.image.avatar(),
  preferences: {
    theme: faker.helpers.arrayElement(['light', 'dark']),
    language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'ja']),
    notifications: faker.datatype.boolean(),
    emailNotifications: faker.datatype.boolean(),
    autoSave: faker.datatype.boolean(),
  },
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

export const userFactory: Factory<User> = {
  create: (overrides = {}) => ({
    ...createUser(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => userFactory.create(overrides)),
};

// Stats factory
interface Stats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  overdueTodos: number;
  completionRate: number;
  todosByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  todosByTag: Record<string, number>;
  productivityTrend: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}

const createStats = (): Stats => {
  const totalTodos = faker.number.int({ min: 0, max: 100 });
  const completedTodos = faker.number.int({ min: 0, max: totalTodos });
  const pendingTodos = totalTodos - completedTodos;
  const overdueTodos = faker.number.int({ min: 0, max: pendingTodos });
  
  return {
    totalTodos,
    completedTodos,
    pendingTodos,
    overdueTodos,
    completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
    todosByPriority: {
      high: faker.number.int({ min: 0, max: totalTodos }),
      medium: faker.number.int({ min: 0, max: totalTodos }),
      low: faker.number.int({ min: 0, max: totalTodos }),
    },
    todosByTag: faker.helpers.arrayElements(['work', 'personal', 'urgent', 'important', 'later']).reduce((acc, tag) => {
      acc[tag] = faker.number.int({ min: 0, max: 20 });
      return acc;
    }, {} as Record<string, number>),
    productivityTrend: Array.from({ length: 7 }, (_, i) => ({
      date: faker.date.recent({ days: 7 - i }).toISOString().split('T')[0],
      completed: faker.number.int({ min: 0, max: 10 }),
      created: faker.number.int({ min: 0, max: 10 }),
    })),
  };
};

export const statsFactory: Factory<Stats> = {
  create: (overrides = {}) => ({
    ...createStats(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => statsFactory.create(overrides)),
};

// Error factory
interface Error {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string>;
}

const createError = (): Error => ({
  success: false,
  error: faker.lorem.sentence(),
  code: faker.helpers.arrayElement(['NETWORK_ERROR', 'SERVER_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED']),
  details: faker.helpers.maybe(() => 
    faker.helpers.arrayElements(['title', 'description', 'dueDate', 'priority']).reduce((acc, field) => {
      acc[field] = faker.lorem.sentence();
      return acc;
    }, {} as Record<string, string>)
  ),
});

export const errorFactory: Factory<Error> = {
  create: (overrides = {}) => ({
    ...createError(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => errorFactory.create(overrides)),
};

// Form data factory
interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string[];
}

const createFormData = (): FormData => ({
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
  dueDate: faker.date.future().toISOString().split('T')[0],
  tags: faker.helpers.arrayElements(['work', 'personal', 'urgent', 'important', 'later'], { min: 1, max: 3 }),
});

export const formDataFactory: Factory<FormData> = {
  create: (overrides = {}) => ({
    ...createFormData(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => formDataFactory.create(overrides)),
};

// API response factory
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const createApiResponse = <T>(data?: T): ApiResponse<T> => ({
  success: true,
  data,
  pagination: faker.helpers.maybe(() => ({
    currentPage: faker.number.int({ min: 1, max: 10 }),
    totalPages: faker.number.int({ min: 1, max: 10 }),
    totalItems: faker.number.int({ min: 1, max: 100 }),
    hasNextPage: faker.datatype.boolean(),
    hasPrevPage: faker.datatype.boolean(),
  })),
});

export const apiResponseFactory = {
  create: <T>(data?: T, overrides?: Partial<ApiResponse<T>>) => ({
    ...createApiResponse(data),
    ...overrides,
  }),
  createError: <T>(error: string, code?: string, overrides?: Partial<ApiResponse<T>>) => ({
    success: false,
    error,
    code: code || 'UNKNOWN_ERROR',
    ...overrides,
  }),
};

// Event factory
interface Event {
  type: string;
  target: HTMLElement;
  preventDefault: jest.Mock;
  stopPropagation: jest.Mock;
  key?: string;
  keyCode?: number;
  which?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

const createEvent = (type: string, target: HTMLElement): Event => ({
  type,
  target,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  key: faker.helpers.maybe(() => faker.helpers.arrayElement(['Enter', 'Escape', 'Tab', 'Space'])),
  keyCode: faker.helpers.maybe(() => faker.number.int({ min: 0, max: 255 })),
  which: faker.helpers.maybe(() => faker.number.int({ min: 0, max: 255 })),
  ctrlKey: faker.datatype.boolean(),
  shiftKey: faker.datatype.boolean(),
  altKey: faker.datatype.boolean(),
  metaKey: faker.datatype.boolean(),
});

export const eventFactory = {
  create: createEvent,
  createKeyboard: (key: string, target: HTMLElement) => createEvent('keydown', target),
  createMouse: (type: string, target: HTMLElement) => createEvent(type, target),
  createTouch: (type: string, target: HTMLElement) => createEvent(type, target),
  createForm: (type: string, target: HTMLElement) => createEvent(type, target),
};

// Performance metrics factory
interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
  memoryUsage: number;
  bundleSize: number;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

const createPerformanceMetrics = (): PerformanceMetrics => ({
  renderTime: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
  componentCount: faker.number.int({ min: 1, max: 100 }),
  reRenderCount: faker.number.int({ min: 0, max: 50 }),
  memoryUsage: faker.number.float({ min: 0, max: 100000, precision: 0.01 }),
  bundleSize: faker.number.int({ min: 1000, max: 1000000 }),
  loadTime: faker.number.float({ min: 0, max: 5000, precision: 0.01 }),
  firstContentfulPaint: faker.number.float({ min: 0, max: 3000, precision: 0.01 }),
  largestContentfulPaint: faker.number.float({ min: 0, max: 4000, precision: 0.01 }),
  cumulativeLayoutShift: faker.number.float({ min: 0, max: 1, precision: 0.001 }),
  firstInputDelay: faker.number.float({ min: 0, max: 300, precision: 0.01 }),
});

export const performanceMetricsFactory: Factory<PerformanceMetrics> = {
  create: (overrides = {}) => ({
    ...createPerformanceMetrics(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => performanceMetricsFactory.create(overrides)),
};

// Accessibility test result factory
interface AccessibilityTestResult {
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
    }>;
  }>;
  passes: Array<{
    id: string;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
    }>;
  }>;
  incomplete: Array<{
    id: string;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
    }>;
  }>;
}

const createAccessibilityTestResult = (): AccessibilityTestResult => ({
  violations: faker.helpers.maybe(() => 
    Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      id: faker.string.alphanumeric(10),
      impact: faker.helpers.arrayElement(['minor', 'moderate', 'serious', 'critical']),
      description: faker.lorem.sentence(),
      help: faker.lorem.sentence(),
      helpUrl: faker.internet.url(),
      nodes: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        html: faker.helpers.arrayElement(['<button>', '<input>', '<div>']),
        target: [faker.string.alphanumeric(5)],
      })),
    }))
  ) || [],
  passes: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
    id: faker.string.alphanumeric(10),
    description: faker.lorem.sentence(),
    help: faker.lorem.sentence(),
    helpUrl: faker.internet.url(),
    nodes: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      html: faker.helpers.arrayElement(['<button>', '<input>', '<div>']),
      target: [faker.string.alphanumeric(5)],
    })),
  })),
  incomplete: faker.helpers.maybe(() => 
    Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      id: faker.string.alphanumeric(10),
      description: faker.lorem.sentence(),
      help: faker.lorem.sentence(),
      helpUrl: faker.internet.url(),
      nodes: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        html: faker.helpers.arrayElement(['<button>', '<input>', '<div>']),
        target: [faker.string.alphanumeric(5)],
      })),
    }))
  ) || [],
});

export const accessibilityTestResultFactory: Factory<AccessibilityTestResult> = {
  create: (overrides = {}) => ({
    ...createAccessibilityTestResult(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => accessibilityTestResultFactory.create(overrides)),
};

// Network request factory
interface NetworkRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  status: number;
  statusText: string;
  responseTime: number;
  response?: string;
}

const createNetworkRequest = (): NetworkRequest => ({
  url: faker.internet.url(),
  method: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': faker.internet.userAgent(),
  },
  body: faker.helpers.maybe(() => JSON.stringify({ data: faker.lorem.sentence() })),
  status: faker.helpers.arrayElement([200, 201, 400, 404, 500]),
  statusText: faker.helpers.arrayElement(['OK', 'Created', 'Bad Request', 'Not Found', 'Internal Server Error']),
  responseTime: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
  response: faker.helpers.maybe(() => JSON.stringify({ success: true, data: faker.lorem.sentence() })),
});

export const networkRequestFactory: Factory<NetworkRequest> = {
  create: (overrides = {}) => ({
    ...createNetworkRequest(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => networkRequestFactory.create(overrides)),
};

// Browser viewport factory
interface Viewport {
  width: number;
  height: number;
  devicePixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const createViewport = (): Viewport => {
  const width = faker.helpers.arrayElement([320, 375, 414, 768, 1024, 1280, 1440, 1920]);
  const height = faker.helpers.arrayElement([568, 667, 736, 1024, 768, 800, 900, 1080]);
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  
  return {
    width,
    height,
    devicePixelRatio: faker.helpers.arrayElement([1, 2, 3]),
    isMobile,
    isTablet,
    isDesktop,
  };
};

export const viewportFactory: Factory<Viewport> = {
  create: (overrides = {}) => ({
    ...createViewport(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => viewportFactory.create(overrides)),
};

// Test scenario factory
interface TestScenario {
  name: string;
  description: string;
  setup: () => void;
  teardown: () => void;
  steps: Array<{
    name: string;
    action: () => void;
    expected: () => void;
  }>;
}

const createTestScenario = (): TestScenario => ({
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  setup: jest.fn(),
  teardown: jest.fn(),
  steps: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    name: faker.lorem.words(2),
    action: jest.fn(),
    expected: jest.fn(),
  })),
});

export const testScenarioFactory: Factory<TestScenario> = {
  create: (overrides = {}) => ({
    ...createTestScenario(),
    ...overrides,
  }),
  createMany: (count, overrides = {}) => 
    Array.from({ length: count }, () => testScenarioFactory.create(overrides)),
};

// Export all factories
export const factories = {
  todo: todoFactory,
  user: userFactory,
  stats: statsFactory,
  error: errorFactory,
  formData: formDataFactory,
  apiResponse: apiResponseFactory,
  event: eventFactory,
  performanceMetrics: performanceMetricsFactory,
  accessibilityTestResult: accessibilityTestResultFactory,
  networkRequest: networkRequestFactory,
  viewport: viewportFactory,
  testScenario: testScenarioFactory,
};

// Helper function to create random data
export const createRandomData = <T>(factory: Factory<T>, count?: number): T | T[] => {
  if (count) {
    return factory.createMany(count);
  }
  return factory.create();
};

// Helper function to create seeded data for consistent tests
export const createSeededData = <T>(factory: Factory<T>, seed: string, count?: number): T | T[] => {
  faker.seed(seed.hashCode());
  return createRandomData(factory, count);
};

// Helper function to create data with specific overrides
export const createDataWithOverrides = <T>(
  factory: Factory<T>,
  overrides: Partial<T>,
  count?: number
): T | T[] => {
  if (count) {
    return factory.createMany(count, overrides);
  }
  return factory.create(overrides);
};