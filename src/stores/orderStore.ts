import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';
import { mockOrders } from '@/mock/orders';
import { generateOrderNo } from '@/utils/format';

interface OrderStore {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNo' | 'status' | 'createdAt'> & { orderNo?: string }) => Order;
  addOrders: (orders: Array<Omit<Order, 'id' | 'orderNo' | 'status' | 'createdAt'> & { orderNo?: string }>) => Order[];
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  cancelOrder: (id: string) => void;
  deleteOrder: (id: string) => void;
  getPendingOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: mockOrders,

  addOrder: (orderData) => {
    const newOrder: Order = {
      ...orderData,
      id: `o${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderNo: orderData.orderNo || generateOrderNo(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    return newOrder;
  },

  addOrders: (ordersData) => {
    const now = Date.now();
    const newOrders: Order[] = ordersData.map((orderData, idx) => ({
      ...orderData,
      id: `o${now}_${idx}`,
      orderNo: orderData.orderNo || generateOrderNo(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));
    set((state) => ({ orders: [...newOrders, ...state.orders] }));
    return newOrders;
  },

  updateOrder: (id, updates) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  updateOrderStatus: (id, status) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  },

  cancelOrder: (id) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)),
    }));
  },

  deleteOrder: (id) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    }));
  },

  getPendingOrders: () => {
    return get().orders.filter((o) => o.status === 'pending');
  },

  getOrderById: (id) => {
    return get().orders.find((o) => o.id === id);
  },
}));
