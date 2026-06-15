import { useState } from 'react';
import {
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle2,
  X,
  ArrowRight,
  Route,
  Weight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useTaskStore } from '@/stores/taskStore';
import {
  VEHICLE_TYPE_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@/utils/constants';
import { formatWeight, formatDistance, formatDuration, formatDateTime, formatMoney } from '@/utils/format';
import type { Vehicle, DispatchTask } from '@/types';

interface AssignModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onConfirm: (orderId: string) => DispatchTask | null;
}

function AssignOrderModal({ vehicle, onClose, onConfirm }: AssignModalProps) {
  const orders = useOrderStore((s) => s.orders);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [successTask, setSuccessTask] = useState<DispatchTask | null>(null);

  const selectedOrder = pendingOrders.find((o) => o.id === selectedOrderId);

  const handleConfirm = () => {
    if (!selectedOrderId) return;
    const task = onConfirm(selectedOrderId);
    if (task) {
      setSuccessTask(task);
    }
  };

  if (successTask) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success-50 mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">分配成功</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              任务已创建，请司机及时出发
            </p>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Package className="w-4 h-4" /> 运单号
                </span>
                <span className="text-sm font-medium text-gray-900">{successTask.order.orderNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> 车牌号
                </span>
                <span className="text-sm font-medium text-gray-900">{successTask.vehicle.plateNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Route className="w-4 h-4" /> 预估里程
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {formatDistance(successTask.estimatedDistance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 预估时长
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(successTask.estimatedDuration)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> 预计到达
                </span>
                <span className="text-sm font-medium text-accent-600">
                  {formatDateTime(successTask.estimatedArrival)}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="btn-primary w-full mt-6">
              完成
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">分配订单</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              车辆：{vehicle.plateNumber}（{VEHICLE_TYPE_LABELS[vehicle.vehicleType]}，载重 {formatWeight(vehicle.capacity)}）
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无可分配的订单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => {
                const isOverload = order.weight > vehicle.capacity;
                const isSelected = selectedOrderId === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => !isOverload && setSelectedOrderId(order.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : isOverload
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{order.orderNo}</span>
                          <span className={ORDER_STATUS_COLORS[order.status]}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{order.customerName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.goodsName} · {formatWeight(order.weight)} · {formatMoney(order.freight)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <MapPin className="w-3 h-3 text-success-500" />
                          <span className="truncate max-w-[180px]">{order.pickupAddress}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <MapPin className="w-3 h-3 text-danger-500" />
                          <span className="truncate max-w-[180px]">{order.deliveryAddress}</span>
                        </div>
                      </div>
                      {isOverload && (
                        <div className="flex items-center gap-1 text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3" />
                          超重
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {selectedOrder && (
            <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-xs text-primary-600 mb-1">已选择订单</p>
              <p className="text-sm font-medium text-gray-900">
                {selectedOrder.orderNo} - {selectedOrder.customerName}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedOrderId}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认分配
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoutePlanning() {
  const orders = useOrderStore((s) => s.orders);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const idleVehicles = vehicles.filter((v) => v.status === 'idle');
  const tasks = useTaskStore((s) => s.tasks);
  const createTask = useTaskStore((s) => s.createTask);

  const [assigningVehicle, setAssigningVehicle] = useState<Vehicle | null>(null);

  const assignedTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 5);

  const handleAssign = (orderId: string): DispatchTask | null => {
    if (!assigningVehicle) return null;
    return createTask(orderId, assigningVehicle.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">线路规划</h1>
          <p className="text-sm text-gray-500 mt-1">将待分配订单分配给空闲车辆，创建运输任务</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-warning-500" />
            <span className="text-gray-600">待分配订单：</span>
            <span className="font-semibold text-gray-900">{pendingOrders.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-success-500" />
            <span className="text-gray-600">空闲车辆：</span>
            <span className="font-semibold text-gray-900">{idleVehicles.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 h-[calc(100vh-220px)]">
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-warning-500" />
              待分配订单
            </h2>
            <span className="text-sm text-gray-500">{pendingOrders.length} 单</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">暂无待分配订单</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-gray-100 bg-white card-hover cursor-pointer"
                  onClick={() => {
                    if (idleVehicles.length > 0) {
                      setAssigningVehicle(idleVehicles[0]);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{order.orderNo}</span>
                        <span className={ORDER_STATUS_COLORS[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{order.customerName}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent-600">
                      {formatMoney(order.freight)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-gray-400" />
                      {order.goodsName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Weight className="w-4 h-4 text-gray-400" />
                      {formatWeight(order.weight)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 line-clamp-1">{order.pickupAddress}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 line-clamp-1">{order.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 h-full">
          <div className="card p-5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-success-500" />
                空闲车辆
              </h2>
              <span className="text-sm text-gray-500">{idleVehicles.length} 辆</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
              {idleVehicles.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无空闲车辆</p>
                </div>
              ) : (
                idleVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 rounded-xl border border-gray-100 bg-white card-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">{vehicle.plateNumber}</span>
                          <span className="badge-success">空闲</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {VEHICLE_TYPE_LABELS[vehicle.vehicleType]} · 载重 {formatWeight(vehicle.capacity)}
                        </p>
                      </div>
                      <button
                        onClick={() => setAssigningVehicle(vehicle)}
                        disabled={!vehicle.driverName}
                        className="btn-primary gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Route className="w-4 h-4" />
                        分配订单
                      </button>
                    </div>
                    {vehicle.driverName && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          {vehicle.driverName}
                        </span>
                        {vehicle.driverPhone && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {vehicle.driverPhone}
                          </span>
                        )}
                        {vehicle.currentLocation && (
                          <span className="flex items-center gap-1 text-gray-500 text-xs">
                            <MapPin className="w-3 h-3" />
                            {vehicle.currentLocation}
                          </span>
                        )}
                      </div>
                    )}
                    {!vehicle.driverName && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-danger-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          该车辆未分配司机，请先绑定司机
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                已分配任务
              </h2>
              <span className="text-xs text-gray-500">{assignedTasks.length} 个进行中</span>
            </div>
            {assignedTasks.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">暂无进行中的任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.order.orderNo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.vehicle.plateNumber} · {task.driverName}
                      </p>
                    </div>
                    <span className={TASK_STATUS_COLORS[task.status]}>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {assigningVehicle && (
        <AssignOrderModal
          vehicle={assigningVehicle}
          onClose={() => setAssigningVehicle(null)}
          onConfirm={handleAssign}
        />
      )}
    </div>
  );
}
