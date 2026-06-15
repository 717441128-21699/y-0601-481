import { create } from 'zustand';
import type { ExceptionRecord, ExceptionType, ExceptionStatus } from '@/types';
import { mockExceptions } from '@/mock/tasks';
import { useTaskStore } from './taskStore';

interface ExceptionStore {
  exceptions: ExceptionRecord[];
  addException: (taskId: string, type: ExceptionType, description: string, images?: string[]) => void;
  updateExceptionStatus: (id: string, status: ExceptionStatus, handler?: string, handleRemark?: string) => void;
  getExceptionsByTask: (taskId: string) => ExceptionRecord[];
  getExceptionsByStatus: (status: ExceptionStatus) => ExceptionRecord[];
  getPendingExceptions: () => ExceptionRecord[];
}

export const useExceptionStore = create<ExceptionStore>((set, get) => ({
  exceptions: mockExceptions,

  addException: (taskId, type, description, images = []) => {
    const newException: ExceptionRecord = {
      id: `e${Date.now()}`,
      taskId,
      type,
      description,
      status: 'pending',
      images,
      reportedAt: new Date().toISOString(),
    };

    set((state) => ({ exceptions: [newException, ...state.exceptions] }));
    useTaskStore.getState().updateTaskStatus(taskId, 'exception');
  },

  updateExceptionStatus: (id, status, handler, handleRemark) => {
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              handler: handler || e.handler,
              handleRemark: handleRemark || e.handleRemark,
              handledAt: status === 'resolved' ? new Date().toISOString() : e.handledAt,
            }
          : e
      ),
    }));
  },

  getExceptionsByTask: (taskId) => {
    return get().exceptions.filter((e) => e.taskId === taskId);
  },

  getExceptionsByStatus: (status) => {
    return get().exceptions.filter((e) => e.status === status);
  },

  getPendingExceptions: () => {
    return get().exceptions.filter((e) => e.status !== 'resolved');
  },
}));
