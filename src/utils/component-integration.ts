/**
 * Component integration utilities for seamless component interaction
 * Provides consistent state management and communication between components
 */

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

// Global component event system
interface ComponentEvent {
  type: string;
  payload: unknown;
  source: string;
  timestamp: number;
}

interface ComponentEventContextType {
  emit: (type: string, payload: unknown, source?: string) => void;
  on: (type: string, handler: (event: ComponentEvent) => void) => () => void;
  off: (type: string, handler: (event: ComponentEvent) => void) => void;
}

const ComponentEventContext = createContext<ComponentEventContextType | undefined>(undefined);

export function useComponentEvents() {
  const context = useContext(ComponentEventContext);
  if (!context) {
    throw new Error('useComponentEvents must be used within a ComponentEventProvider');
  }
  return context;
}

// Event provider for component communication
export function ComponentEventProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef<Map<string, Set<(event: ComponentEvent) => void>>>(new Map());
  const [events, setEvents] = useState<ComponentEvent[]>([]);

  const emit = useCallback((type: string, payload: unknown, source = 'unknown') => {
    const event: ComponentEvent = {
      type,
      payload,
      source,
      timestamp: Date.now()
    };

    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events

    const listeners = listenersRef.current.get(type);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in component event handler:', error);
        }
      });
    }
  }, []);

  const on = useCallback((type: string, handler: (event: ComponentEvent) => void) => {
    const listeners = listenersRef.current.get(type) || new Set();
    listeners.add(handler);
    listenersRef.current.set(type, listeners);

    return () => {
      const currentListeners = listenersRef.current.get(type);
      if (currentListeners) {
        currentListeners.delete(handler);
        if (currentListeners.size === 0) {
          listenersRef.current.delete(type);
        }
      }
    };
  }, []);

  const off = useCallback((type: string, handler: (event: ComponentEvent) => void) => {
    const listeners = listenersRef.current.get(type);
    if (listeners) {
      listeners.delete(handler);
      if (listeners.size === 0) {
        listenersRef.current.delete(type);
      }
    }
  }, []);

  return (
    <ComponentEventContext.Provider value={{ emit, on, off }}>
      {children}
    </ComponentEventContext.Provider>
  );
}

// Component state synchronization
interface ComponentState<T> {
  value: T;
  lastUpdated: number;
  source: string;
}

interface ComponentStateContextType {
  getState: <T>(key: string) => ComponentState<T> | undefined;
  setState: <T>(key: string, value: T, source?: string) => void;
  subscribe: <T>(key: string, callback: (state: ComponentState<T>) => void) => () => void;
}

const ComponentStateContext = createContext<ComponentStateContextType | undefined>(undefined);

export function useComponentState() {
  const context = useContext(ComponentStateContext);
  if (!context) {
    throw new Error('useComponentState must be used within a ComponentStateProvider');
  }
  return context;
}

// State provider for component synchronization
export function ComponentStateProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<Map<string, ComponentState<unknown>>>(new Map());
  const listenersRef = useRef<Map<string, Set<(state: ComponentState<unknown>) => void>>>(new Map());

  const getState = useCallback(<T>(key: string): ComponentState<T> | undefined => {
    return stateRef.current.get(key) as ComponentState<T> | undefined;
  }, []);

  const setState = useCallback(<T>(key: string, value: T, source = 'unknown') => {
    const newState: ComponentState<T> = {
      value,
      lastUpdated: Date.now(),
      source
    };

    stateRef.current.set(key, newState);

    const listeners = listenersRef.current.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newState);
        } catch (error) {
          console.error('Error in component state callback:', error);
        }
      });
    }
  }, []);

  const subscribe = useCallback(<T>(key: string, callback: (state: ComponentState<T>) => void) => {
    const listeners = listenersRef.current.get(key) || new Set();
    listeners.add(callback as (state: ComponentState<unknown>) => void);
    listenersRef.current.set(key, listeners);

    return () => {
      const currentListeners = listenersRef.current.get(key);
      if (currentListeners) {
        currentListeners.delete(callback as (state: ComponentState<unknown>) => void);
        if (currentListeners.size === 0) {
          listenersRef.current.delete(key);
        }
      }
    };
  }, []);

  return (
    <ComponentStateContext.Provider value={{ getState, setState, subscribe }}>
      {children}
    </ComponentStateContext.Provider>
  );
}

// Component lifecycle coordination
interface ComponentLifecycle {
  mount: () => void;
  unmount: () => void;
  update: () => void;
}

interface ComponentLifecycleContextType {
  register: (id: string, lifecycle: ComponentLifecycle) => () => void;
  trigger: (phase: 'mount' | 'unmount' | 'update', id?: string) => void;
}

const ComponentLifecycleContext = createContext<ComponentLifecycleContextType | undefined>(undefined);

export function useComponentLifecycle() {
  const context = useContext(ComponentLifecycleContext);
  if (!context) {
    throw new Error('useComponentLifecycle must be used within a ComponentLifecycleProvider');
  }
  return context;
}

// Lifecycle provider for component coordination
export function ComponentLifecycleProvider({ children }: { children: React.ReactNode }) {
  const componentsRef = useRef<Map<string, ComponentLifecycle>>(new Map());

  const register = useCallback((id: string, lifecycle: ComponentLifecycle) => {
    componentsRef.current.set(id, lifecycle);

    return () => {
      componentsRef.current.delete(id);
    };
  }, []);

  const trigger = useCallback((phase: 'mount' | 'unmount' | 'update', id?: string) => {
    if (id) {
      const component = componentsRef.current.get(id);
      if (component) {
        switch (phase) {
          case 'mount':
            component.mount();
            break;
          case 'unmount':
            component.unmount();
            break;
          case 'update':
            component.update();
            break;
        }
      }
    } else {
      componentsRef.current.forEach(component => {
        switch (phase) {
          case 'mount':
            component.mount();
            break;
          case 'unmount':
            component.unmount();
            break;
          case 'update':
            component.update();
            break;
        }
      });
    }
  }, []);

  return (
    <ComponentLifecycleContext.Provider value={{ register, trigger }}>
      {children}
    </ComponentLifecycleContext.Provider>
  );
}

// Hook for component integration
export function useComponentIntegration(id: string, lifecycle?: Partial<ComponentLifecycle>) {
  const { emit, on, off } = useComponentEvents();
  const { getState, setState, subscribe } = useComponentState();
  const { register, trigger } = useComponentLifecycle();

  // Register component lifecycle
  useEffect(() => {
    if (lifecycle) {
      const fullLifecycle: ComponentLifecycle = {
        mount: lifecycle.mount || (() => {}),
        unmount: lifecycle.unmount || (() => {}),
        update: lifecycle.update || (() => {})
      };

      return register(id, fullLifecycle);
    }
  }, [id, lifecycle, register]);

  // Emit events
  const emitEvent = useCallback((type: string, payload: unknown) => {
    emit(type, payload, id);
  }, [emit, id]);

  // Listen to events
  const listenToEvent = useCallback((type: string, handler: (event: ComponentEvent) => void) => {
    return on(type, handler);
  }, [on]);

  // Get component state
  const getComponentState = useCallback(<T>(key: string): ComponentState<T> | undefined => {
    return getState<T>(key);
  }, [getState]);

  // Set component state
  const setComponentState = useCallback(<T>(key: string, value: T) => {
    setState(key, value, id);
  }, [setState, id]);

  // Subscribe to state changes
  const subscribeToState = useCallback(<T>(key: string, callback: (state: ComponentState<T>) => void) => {
    return subscribe(key, callback);
  }, [subscribe]);

  // Trigger lifecycle events
  const triggerLifecycle = useCallback((phase: 'mount' | 'unmount' | 'update') => {
    trigger(phase, id);
  }, [trigger, id]);

  return {
    id,
    emitEvent,
    listenToEvent,
    getComponentState,
    setComponentState,
    subscribeToState,
    triggerLifecycle
  };
}

// Predefined event types for common interactions
export const ComponentEvents = {
  // Navigation events
  NAVIGATION_OPEN: 'navigation.open',
  NAVIGATION_CLOSE: 'navigation.close',
  NAVIGATION_TOGGLE: 'navigation.toggle',
  
  // Modal events
  MODAL_OPEN: 'modal.open',
  MODAL_CLOSE: 'modal.close',
  MODAL_TOGGLE: 'modal.toggle',
  
  // Form events
  FORM_SUBMIT: 'form.submit',
  FORM_RESET: 'form.reset',
  FORM_VALIDATION: 'form.validation',
  
  // Data events
  DATA_LOAD: 'data.load',
  DATA_SAVE: 'data.save',
  DATA_DELETE: 'data.delete',
  DATA_UPDATE: 'data.update',
  
  // UI events
  UI_THEME_CHANGE: 'ui.theme.change',
  UI_LAYOUT_CHANGE: 'ui.layout.change',
  UI_RESIZE: 'ui.resize',
  
  // User events
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PREFERENCE_CHANGE: 'user.preference.change'
} as const;

// Predefined state keys for common data
export const ComponentStateKeys = {
  // User preferences
  USER_PREFERENCES: 'user.preferences',
  USER_THEME: 'user.theme',
  USER_LANGUAGE: 'user.language',
  
  // Application state
  APP_LOADING: 'app.loading',
  APP_ERROR: 'app.error',
  APP_ONLINE: 'app.online',
  
  // UI state
  UI_SIDEBAR_OPEN: 'ui.sidebar.open',
  UI_MODAL_OPEN: 'ui.modal.open',
  UI_FILTERS_ACTIVE: 'ui.filters.active',
  
  // Data state
  DATA_TODOS: 'data.todos',
  DATA_FILTERS: 'data.filters',
  DATA_SORT: 'data.sort'
} as const;

// Integration utilities
export const ComponentIntegrationUtils = {
  // Cross-component communication
  createEventBridge: (sourceId: string, targetId: string, eventType: string) => {
    return {
      emit: (payload: unknown) => {
        // This would be used with the event system
        console.log(`Bridge from ${sourceId} to ${targetId}:`, eventType, payload);
      }
    };
  },

  // State synchronization
  createStateSync: (key: string, syncFn: (value: unknown) => void) => {
    return {
      sync: (value: unknown) => {
        syncFn(value);
      }
    };
  },

  // Component coordination
  createCoordinator: (components: string[]) => {
    return {
      coordinate: (action: string, payload: unknown) => {
        console.log(`Coordinating components ${components.join(', ')}:`, action, payload);
      }
    };
  }
};