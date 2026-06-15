import type { Vehicle } from '@/types';

export const mockVehicles: Vehicle[] = [
  { id: 'v1', plateNumber: '沪A·12345', vehicleType: 'truck_4_2', capacity: 5, status: 'idle', driverId: 'd1', driverName: '王师傅', driverPhone: '13900139001', currentLocation: '上海市嘉定区', nextMaintenanceDate: '2026-07-01' },
  { id: 'v2', plateNumber: '沪A·23456', vehicleType: 'truck_6_8', capacity: 10, status: 'transit', driverId: 'd2', driverName: '李师傅', driverPhone: '13900139002', currentLocation: '江苏省苏州市', nextMaintenanceDate: '2026-06-25' },
  { id: 'v3', plateNumber: '沪A·34567', vehicleType: 'truck_9_6', capacity: 18, status: 'idle', driverId: 'd3', driverName: '张师傅', driverPhone: '13900139003', currentLocation: '上海市浦东新区', nextMaintenanceDate: '2026-07-10' },
  { id: 'v4', plateNumber: '沪A·45678', vehicleType: 'van', capacity: 1, status: 'maintenance', driverId: 'd4', driverName: '刘师傅', driverPhone: '13900139004', currentLocation: '上海市闵行区维修厂', nextMaintenanceDate: '2026-06-15' },
  { id: 'v5', plateNumber: '沪A·56789', vehicleType: 'truck_13', capacity: 32, status: 'idle', driverId: 'd5', driverName: '陈师傅', driverPhone: '13900139005', currentLocation: '上海市青浦区', nextMaintenanceDate: '2026-07-20' },
  { id: 'v6', plateNumber: '沪A·67890', vehicleType: 'truck_4_2', capacity: 5, status: 'transit', driverId: 'd6', driverName: '杨师傅', driverPhone: '13900139006', currentLocation: '浙江省嘉兴市', nextMaintenanceDate: '2026-06-30' },
  { id: 'v7', plateNumber: '沪A·78901', vehicleType: 'truck_17_5', capacity: 40, status: 'idle', driverId: 'd7', driverName: '黄师傅', driverPhone: '13900139007', currentLocation: '上海市松江区', nextMaintenanceDate: '2026-08-01' },
  { id: 'v8', plateNumber: '沪A·89012', vehicleType: 'truck_6_8', capacity: 10, status: 'idle', driverId: 'd8', driverName: '赵师傅', driverPhone: '13900139008', currentLocation: '上海市奉贤区', nextMaintenanceDate: '2026-07-05' },
  { id: 'v9', plateNumber: '沪A·90123', vehicleType: 'truck_9_6', capacity: 18, status: 'transit', driverId: 'd9', driverName: '周师傅', driverPhone: '13900139009', currentLocation: '安徽省合肥市', nextMaintenanceDate: '2026-06-28' },
  { id: 'v10', plateNumber: '沪A·01234', vehicleType: 'van', capacity: 1, status: 'idle', driverId: 'd10', driverName: '吴师傅', driverPhone: '13900139010', currentLocation: '上海市徐汇区', nextMaintenanceDate: '2026-07-15' },
  { id: 'v11', plateNumber: '沪A·11223', vehicleType: 'truck_13', capacity: 32, status: 'maintenance', driverId: 'd11', driverName: '徐师傅', driverPhone: '13900139011', currentLocation: '上海市宝山区维修厂', nextMaintenanceDate: '2026-06-16' },
  { id: 'v12', plateNumber: '沪A·33445', vehicleType: 'truck_4_2', capacity: 5, status: 'idle', driverId: 'd12', driverName: '孙师傅', driverPhone: '13900139012', currentLocation: '上海市金山区', nextMaintenanceDate: '2026-07-25' },
];
