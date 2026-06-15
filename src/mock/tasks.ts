import type { DispatchTask, TaskNode, ExceptionRecord } from '@/types';
import { mockOrders } from './orders';
import { mockVehicles } from './vehicles';

const today = new Date();

function hoursFromNow(hours: number): string {
  const d = new Date(today);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date(today);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const mockTaskNodes: TaskNode[] = [
  { id: 'n1', taskId: 't4', nodeType: 'pickup_start', location: '北京市大兴区生物医药基地', timestamp: hoursAgo(9), remark: '已到达装货地点' },
  { id: 'n2', taskId: 't4', nodeType: 'pickup_done', location: '北京市大兴区生物医药基地', timestamp: hoursAgo(8), remark: '装货完成，开始出发' },
  { id: 'n3', taskId: 't4', nodeType: 'transit_checkpoint', location: '山东省济南市', timestamp: hoursAgo(5), remark: '途中经过济南服务区' },
  { id: 'n4', taskId: 't4', nodeType: 'delivery_start', location: '上海市徐汇区枫林路', timestamp: hoursAgo(2), remark: '已到达卸货地点' },
  { id: 'n5', taskId: 't4', nodeType: 'delivery_done', location: '上海市徐汇区中山医院', timestamp: hoursAgo(1), remark: '卸货完成，签收确认' },

  { id: 'n6', taskId: 't5', nodeType: 'pickup_start', location: '浙江省杭州市萧山区', timestamp: hoursAgo(7), remark: '' },
  { id: 'n7', taskId: 't5', nodeType: 'pickup_done', location: '浙江省杭州市萧山区', timestamp: hoursAgo(6), remark: '' },
  { id: 'n8', taskId: 't5', nodeType: 'transit_checkpoint', location: '浙江省嘉兴市', timestamp: hoursAgo(4), remark: '' },
  { id: 'n9', taskId: 't5', nodeType: 'delivery_start', location: '上海市闵行区', timestamp: hoursAgo(2), remark: '' },
  { id: 'n10', taskId: 't5', nodeType: 'delivery_done', location: '上海市闵行区', timestamp: hoursAgo(1.5), remark: '已送达客户签收' },

  { id: 'n11', taskId: 't3', nodeType: 'pickup_start', location: '江苏省苏州市工业园区', timestamp: hoursAgo(5), remark: '' },
  { id: 'n12', taskId: 't3', nodeType: 'pickup_done', location: '江苏省苏州市工业园区', timestamp: hoursAgo(4), remark: '' },
  { id: 'n13', taskId: 't3', nodeType: 'transit_checkpoint', location: '浙江省湖州市', timestamp: hoursAgo(2), remark: '正在运输中' },

  { id: 'n14', taskId: 't2', nodeType: 'pickup_start', location: '广东省深圳市宝安区', timestamp: hoursAgo(3), remark: '' },
];

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'e1',
    taskId: 't3',
    type: 'congestion',
    description: 'G50沪渝高速湖州段发生交通事故，严重拥堵，预计延误2小时',
    status: 'processing',
    images: [],
    reportedAt: hoursAgo(1.5),
    handler: '调度员小李',
    handleRemark: '已通知客户预计晚点到达',
  },
  {
    id: 'e2',
    taskId: 't2',
    type: 'late',
    description: '深圳装货现场等待时间过长，比预计晚了3小时才出发',
    status: 'resolved',
    images: [],
    reportedAt: hoursAgo(4),
    handler: '调度员小张',
    handleRemark: '已协调客户解释原因，预计到达时间顺延',
    handledAt: hoursAgo(3),
  },
];

const orderMap = Object.fromEntries(mockOrders.map((o) => [o.id, o]));
const vehicleMap = Object.fromEntries(mockVehicles.map((v) => [v.id, v]));

export const mockTasks: DispatchTask[] = [
  {
    id: 't1',
    orderId: 'o3',
    order: orderMap['o3'],
    vehicleId: 'v1',
    vehicle: vehicleMap['v1'],
    driverId: 'd1',
    driverName: '王师傅',
    driverPhone: '13900139001',
    estimatedDistance: 180,
    estimatedDuration: 5,
    estimatedArrival: hoursFromNow(3),
    status: 'pending',
    nodes: [],
    exceptions: [],
    createdAt: hoursAgo(3.5),
  },
  {
    id: 't2',
    orderId: 'o4',
    order: orderMap['o4'],
    vehicleId: 'v9',
    vehicle: vehicleMap['v9'],
    driverId: 'd9',
    driverName: '周师傅',
    driverPhone: '13900139009',
    estimatedDistance: 1450,
    estimatedDuration: 32,
    estimatedArrival: hoursFromNow(28),
    status: 'loading',
    nodes: mockTaskNodes.filter((n) => n.taskId === 't2'),
    exceptions: mockExceptions.filter((e) => e.taskId === 't2'),
    createdAt: hoursAgo(5),
  },
  {
    id: 't3',
    orderId: 'o5',
    order: orderMap['o5'],
    vehicleId: 'v6',
    vehicle: vehicleMap['v6'],
    driverId: 'd6',
    driverName: '杨师傅',
    driverPhone: '13900139006',
    estimatedDistance: 160,
    estimatedDuration: 4.5,
    estimatedArrival: hoursFromNow(1),
    status: 'transit',
    nodes: mockTaskNodes.filter((n) => n.taskId === 't3'),
    exceptions: mockExceptions.filter((e) => e.taskId === 't3'),
    createdAt: hoursAgo(6),
  },
  {
    id: 't4',
    orderId: 'o6',
    order: orderMap['o6'],
    vehicleId: 'v2',
    vehicle: vehicleMap['v2'],
    driverId: 'd2',
    driverName: '李师傅',
    driverPhone: '13900139002',
    estimatedDistance: 1200,
    estimatedDuration: 28,
    estimatedArrival: hoursAgo(2),
    status: 'completed',
    nodes: mockTaskNodes.filter((n) => n.taskId === 't4'),
    exceptions: [],
    createdAt: hoursAgo(10),
    proofImageUrl: '',
  },
  {
    id: 't5',
    orderId: 'o10',
    order: orderMap['o10'],
    vehicleId: 'v10',
    vehicle: vehicleMap['v10'],
    driverId: 'd10',
    driverName: '吴师傅',
    driverPhone: '13900139010',
    estimatedDistance: 175,
    estimatedDuration: 5,
    estimatedArrival: hoursAgo(1.5),
    status: 'completed',
    nodes: mockTaskNodes.filter((n) => n.taskId === 't5'),
    exceptions: [],
    createdAt: hoursAgo(8),
  },
];
