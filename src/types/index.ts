export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'loading' | 'transit' | 'delivered' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  pickupAddress: string;
  pickupContact: string;
  pickupPhone: string;
  deliveryAddress: string;
  deliveryContact: string;
  deliveryPhone: string;
  goodsName: string;
  weight: number;
  volume: number;
  freight: number;
  status: OrderStatus;
  createdAt: string;
  taskId?: string;
}

export type VehicleType = 'van' | 'truck_4_2' | 'truck_6_8' | 'truck_9_6' | 'truck_13' | 'truck_17_5';
export type VehicleStatus = 'idle' | 'transit' | 'maintenance';

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  status: VehicleStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  currentLocation?: string;
  nextMaintenanceDate?: string;
}

export type NodeType = 'pickup_start' | 'pickup_done' | 'transit_checkpoint' | 'delivery_start' | 'delivery_done';

export interface TaskNode {
  id: string;
  taskId: string;
  nodeType: NodeType;
  location: string;
  timestamp: string;
  remark?: string;
}

export type ExceptionType = 'congestion' | 'damage' | 'late' | 'other';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export interface ExceptionRecord {
  id: string;
  taskId: string;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  images: string[];
  reportedAt: string;
  handler?: string;
  handleRemark?: string;
  handledAt?: string;
}

export type TaskStatus = 'pending' | 'loading' | 'transit' | 'delivering' | 'completed' | 'exception';

export interface DispatchTask {
  id: string;
  orderId: string;
  order: Order;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driverName: string;
  driverPhone: string;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedArrival: string;
  status: TaskStatus;
  nodes: TaskNode[];
  exceptions: ExceptionRecord[];
  createdAt: string;
  proofImageUrl?: string;
}

export interface CustomerStat {
  customerId: string;
  customerName: string;
  orderCount: number;
  completedCount: number;
  totalFreight: number;
  completionRate: number;
}

export interface VehicleStat {
  vehicleId: string;
  plateNumber: string;
  taskCount: number;
  completedCount: number;
  totalDistance: number;
  totalFreight: number;
  completionRate: number;
}

export interface StatisticsData {
  totalOrders: number;
  completedOrders: number;
  totalFreight: number;
  onTimeRate: number;
  exceptionCount: number;
  byCustomer: CustomerStat[];
  byVehicle: VehicleStat[];
}
