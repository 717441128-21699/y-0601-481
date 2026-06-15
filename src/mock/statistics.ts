import type { StatisticsData, CustomerStat, VehicleStat } from '@/types';
import { mockCustomers } from './customers';
import { mockVehicles } from './vehicles';
import { mockTasks } from './tasks';

const customerMap = Object.fromEntries(mockCustomers.map((c) => [c.id, c]));

export const mockCustomerStats: CustomerStat[] = [
  { customerId: 'c1', customerName: customerMap['c1'].name, orderCount: 2, inProgressCount: 0, completedCount: 0, totalFreight: 6300, completionRate: 0 },
  { customerId: 'c2', customerName: customerMap['c2'].name, orderCount: 2, inProgressCount: 0, completedCount: 0, totalFreight: 5000, completionRate: 0 },
  { customerId: 'c3', customerName: customerMap['c3'].name, orderCount: 2, inProgressCount: 0, completedCount: 1, totalFreight: 2450, completionRate: 50 },
  { customerId: 'c4', customerName: customerMap['c4'].name, orderCount: 1, inProgressCount: 0, completedCount: 0, totalFreight: 6800, completionRate: 0 },
  { customerId: 'c5', customerName: customerMap['c5'].name, orderCount: 2, inProgressCount: 0, completedCount: 0, totalFreight: 2500, completionRate: 0 },
  { customerId: 'c6', customerName: customerMap['c6'].name, orderCount: 1, inProgressCount: 0, completedCount: 1, totalFreight: 3500, completionRate: 100 },
  { customerId: 'c7', customerName: customerMap['c7'].name, orderCount: 1, inProgressCount: 0, completedCount: 0, totalFreight: 5500, completionRate: 0 },
  { customerId: 'c8', customerName: customerMap['c8'].name, orderCount: 1, inProgressCount: 0, completedCount: 0, totalFreight: 4200, completionRate: 0 },
];

export const mockVehicleStats: VehicleStat[] = mockVehicles.slice(0, 6).map((v, idx) => {
  const vehicleTasks = mockTasks.filter((t) => t.vehicleId === v.id);
  return {
    vehicleId: v.id,
    plateNumber: v.plateNumber,
    taskCount: idx % 3 === 0 ? 2 : 1,
    inProgressCount: 0,
    completedCount: idx >= 3 ? 1 : 0,
    totalDistance: 200 + idx * 350,
    totalFreight: 2000 + idx * 1500,
    completionRate: idx >= 3 ? 100 : 0,
  };
});

export const mockStatistics: StatisticsData = {
  totalOrders: 12,
  completedOrders: 2,
  totalFreight: 36250,
  onTimeRate: 85.5,
  exceptionCount: 2,
  byCustomer: mockCustomerStats,
  byVehicle: mockVehicleStats,
};
