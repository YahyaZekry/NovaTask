import { rest } from 'msw';
import { mockTodos, mockUsers, mockStats } from '../fixtures/data';

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Todo API handlers
export const todoHandlers = [
  // Get all todos
  rest.get(`${API_BASE}/todos`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockTodos,
      })
    );
  }),

  // Get a single todo
  rest.get(`${API_BASE}/todos/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const todo = mockTodos.find(t => t.id === id);
    
    if (!todo) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: 'Todo not found',
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: todo,
      })
    );
  }),

  // Create a new todo
  rest.post(`${API_BASE}/todos`, async (req, res, ctx) => {
    const newTodo = await req.json();
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: `todo-${Date.now()}`,
          ...newTodo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Update a todo
  rest.put(`${API_BASE}/todos/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json();
    
    const todoIndex = mockTodos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: 'Todo not found',
        })
      );
    }

    const updatedTodo = {
      ...mockTodos[todoIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: updatedTodo,
      })
    );
  }),

  // Delete a todo
  rest.delete(`${API_BASE}/todos/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const todoIndex = mockTodos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: 'Todo not found',
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Todo deleted successfully',
      })
    );
  }),
];

// User API handlers
export const userHandlers = [
  // Get current user
  rest.get(`${API_BASE}/user/me`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockUsers[0],
      })
    );
  }),

  // Update user profile
  rest.put(`${API_BASE}/user/profile`, async (req, res, ctx) => {
    const updates = await req.json();
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          ...mockUsers[0],
          ...updates,
        },
      })
    );
  }),
];

// Stats API handlers
export const statsHandlers = [
  // Get todo statistics
  rest.get(`${API_BASE}/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockStats,
      })
    );
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  // Network error
  rest.get(`${API_BASE}/todos`, (req, res, ctx) => {
    return res.networkError('Failed to connect to the server');
  }),

  // Server error
  rest.get(`${API_BASE}/todos`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: 'Internal server error',
      })
    );
  }),

  // Timeout error
  rest.get(`${API_BASE}/todos`, (req, res, ctx) => {
    return res(
      ctx.delay(10000), // 10 second delay to simulate timeout
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockTodos,
      })
    );
  }),
];

// Export all handlers
export const handlers = [
  ...todoHandlers,
  ...userHandlers,
  ...statsHandlers,
];