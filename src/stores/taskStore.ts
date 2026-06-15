import { create } from 'zustand';
import type { DispatchTask, Order, Vehicle, TaskStatus, TaskNode, NodeType } from '@/types';
import { mockTasks } from '@/mock/tasks';
import { estimateDistance, estimateDuration, estimateArrival } from '@/utils/distance';
import { useOrderStore } from './orderStore';
import { useVehicleStore } from './vehicleStore';

interface TaskStore {
  tasks: DispatchTask[];
  createTask: (orderId: string, vehicleId: string, estimated?: { distance?: number; duration?: number; arrival?: string }) => DispatchTask | null;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTask: (id: string, updates: Partial<DispatchTask>) => void;
  addTaskNode: (taskId: string, nodeType: NodeType, location: string, remark?: string) => void;
  completeTask: (id: string, proofImageUrl?: string) => void;
  getTaskById: (id: string) => DispatchTask | undefined;
  getTasksByVehicle: (vehicleId: string) => DispatchTask[];
  getTasksByStatus: (status: TaskStatus) => DispatchTask[];
  getTodayTasks: () => DispatchTask[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: mockTasks,

  createTask: (orderId, vehicleId, estimated) => {
    const order = useOrderStore.getState().getOrderById(orderId);
    const vehicle = useVehicleStore.getState().getVehicleById(vehicleId);

    if (!order || !vehicle) return null;
    if (!vehicle.driverName || !vehicle.driverId || !vehicle.driverPhone) return null;

    const distance = estimated?.distance ?? estimateDistance(order.pickupAddress, order.deliveryAddress);
    const duration = estimated?.duration ?? estimateDuration(distance, vehicle.vehicleType);
    const arrival = estimated?.arrival ?? estimateArrival(duration);

    const taskId = `t${Date.now()}`;

    const newTask: DispatchTask = {
      id: taskId,
      orderId,
      order,
      vehicleId,
      vehicle,
      driverId: vehicle.driverId,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      estimatedDistance: distance,
      estimatedDuration: duration,
      estimatedArrival: arrival,
      status: 'pending',
      nodes: [],
      exceptions: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    useOrderStore.getState().updateOrder(orderId, { status: 'assigned', taskId });
    useVehicleStore.getState().updateVehicleStatus(vehicleId, 'transit');

    return newTask;
  },

  updateTaskStatus: (id, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  addTaskNode: (taskId, nodeType, location, remark) => {
    const node: TaskNode = {
      id: `n${Date.now()}`,
      taskId,
      nodeType,
      location,
      timestamp: new Date().toISOString(),
      remark,
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, nodes: [...t.nodes, node] } : t
      ),
    }));

    let orderStatus: Order['status'] | null = null;
    if (nodeType === 'pickup_start') orderStatus = 'loading';
    if (nodeType === 'pickup_done') orderStatus = 'transit';
    if (nodeType === 'delivery_done') orderStatus = 'delivered';

    if (orderStatus) {
      const task = get().getTaskById(taskId);
      if (task) {
        useOrderStore.getState().updateOrderStatus(task.orderId, orderStatus);
      }
    }
  },

  completeTask: (id, proofImageUrl) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: 'completed', proofImageUrl }
          : t
      ),
    }));

    const task = get().getTaskById(id);
    if (task) {
      useOrderStore.getState().updateOrderStatus(task.orderId, 'completed');
      useVehicleStore.getState().updateVehicleStatus(task.vehicleId, 'idle');
    }
  },

  getTaskById: (id) => {
    return get().tasks.find((t) => t.id === id);
  },

  getTasksByVehicle: (vehicleId) => {
    return get().tasks.filter((t) => t.vehicleId === vehicleId);
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter((t) => t.status === status);
  },

  getTodayTasks: () => {
    const today = new Date().toISOString().slice(0, 10);
    return get().tasks.filter((t) => t.createdAt.slice(0, 10) === today);
  },
}));
