import type { VehicleType, OrderStatus, VehicleStatus, TaskStatus, ExceptionType, ExceptionStatus, NodeType } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待分配',
  assigned: '已分配',
  loading: '装货中',
  transit: '运输中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-gray',
  assigned: 'badge-primary',
  loading: 'badge-warning',
  transit: 'badge-primary',
  delivered: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  van: '面包车',
  truck_4_2: '4.2米货车',
  truck_6_8: '6.8米货车',
  truck_9_6: '9.6米货车',
  truck_13: '13米半挂',
  truck_17_5: '17.5米大板',
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  idle: '空闲',
  transit: '在途',
  maintenance: '维修中',
};

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  idle: 'badge-success',
  transit: 'badge-primary',
  maintenance: 'badge-danger',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待执行',
  loading: '装货中',
  transit: '运输中',
  delivering: '卸货中',
  completed: '已完成',
  exception: '异常',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'badge-gray',
  loading: 'badge-warning',
  transit: 'badge-primary',
  delivering: 'badge-warning',
  completed: 'badge-success',
  exception: 'badge-danger',
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  congestion: '道路拥堵',
  damage: '货物破损',
  late: '预计迟到',
  other: '其他异常',
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

export const EXCEPTION_STATUS_COLORS: Record<ExceptionStatus, string> = {
  pending: 'badge-danger',
  processing: 'badge-warning',
  resolved: 'badge-success',
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  pickup_start: '开始装货',
  pickup_done: '装货完成',
  transit_checkpoint: '途中到达',
  delivery_start: '开始卸货',
  delivery_done: '卸货完成',
};

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'van' as VehicleType, label: '面包车', capacity: 1 },
  { value: 'truck_4_2' as VehicleType, label: '4.2米货车', capacity: 5 },
  { value: 'truck_6_8' as VehicleType, label: '6.8米货车', capacity: 10 },
  { value: 'truck_9_6' as VehicleType, label: '9.6米货车', capacity: 18 },
  { value: 'truck_13' as VehicleType, label: '13米半挂', capacity: 32 },
  { value: 'truck_17_5' as VehicleType, label: '17.5米大板', capacity: 40 },
];
