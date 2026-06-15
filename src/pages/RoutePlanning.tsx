import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Clock,
  ArrowRight,
  Route,
  Weight,
  AlertCircle,
  GripVertical,
  X,
  Check,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useTaskStore } from '@/stores/taskStore';
import { useToast } from '@/components/Toast/Toast';
import {
  VEHICLE_TYPE_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@/utils/constants';
import { formatWeight, formatDistance, formatDuration, formatDateTime, formatMoney } from '@/utils/format';
import { estimateDistance, estimateDuration, estimateArrival } from '@/utils/distance';
import type { Order, Vehicle, DispatchTask } from '@/types';

interface SortableOrderCardProps {
  order: Order;
}

function SortableOrderCard({ order }: SortableOrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `order-${order.id}`, data: { type: 'order', orderId: order.id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border-2 bg-white card-hover ${
        isDragging ? 'border-primary-400 shadow-xl scale-[1.02]' : 'border-gray-100 hover:border-primary-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 p-1 rounded-md text-gray-400 hover:text-primary-500 hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-colors"
          title="拖拽分配到车辆"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{order.orderNo}</span>
                <span className={ORDER_STATUS_COLORS[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{order.customerName}</p>
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
      </div>
    </div>
  );
}

interface VehicleDropZoneProps {
  vehicle: Vehicle;
  isOver: boolean;
  onAssign: (orderId: string) => DispatchTask | null;
}

function VehicleDropZone({ vehicle, isOver, onAssign }: VehicleDropZoneProps) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging: vehicleDragging,
  } = useSortable({ id: `vehicle-${vehicle.id}`, data: { type: 'vehicle', vehicleId: vehicle.id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: vehicleDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border-2 bg-white card-hover transition-all ${
        isOver
          ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.01]'
          : 'border-gray-100 hover:border-primary-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-lg">{vehicle.plateNumber}</span>
            <span className="badge-success">空闲</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {VEHICLE_TYPE_LABELS[vehicle.vehicleType]} · 载重 {formatWeight(vehicle.capacity)}
          </p>
        </div>
        {!vehicle.driverName ? (
          <div className="flex items-center gap-1 text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded">
            <AlertCircle className="w-3 h-3" />
            未分配司机
          </div>
        ) : isOver ? (
          <div className="flex items-center gap-1 text-xs text-primary-600 bg-primary-100 px-3 py-1.5 rounded font-medium">
            <Route className="w-4 h-4" />
            释放即可分配
          </div>
        ) : null}
      </div>
      {vehicle.driverName && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-sm flex-wrap">
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
    </div>
  );
}

export default function RoutePlanning() {
  const orders = useOrderStore((s) => s.orders);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const tasks = useTaskStore((s) => s.tasks);
  const createTask = useTaskStore((s) => s.createTask);
  const { showToast } = useToast();

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [overVehicleId, setOverVehicleId] = useState<string | null>(null);
  const [, setPendingOrdersLocal] = useState<Order[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [previewVehicle, setPreviewVehicle] = useState<Vehicle | null>(null);
  const [previewData, setPreviewData] = useState<{
    estimatedDistance: number;
    estimatedDuration: number;
    estimatedArrival: string;
    isOverweight: boolean;
    overweightWarning?: string;
  } | null>(null);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const idleVehicles = vehicles.filter((v) => v.status === 'idle');
  const assignedTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 5);
  const activeOrder = pendingOrders.find((o) => o.id === activeOrderId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    if (id.startsWith('order-')) {
      setActiveOrderId(id.replace('order-', ''));
    }
  };

  const calculatePreview = (order: Order, vehicle: Vehicle) => {
    const distance = estimateDistance(order.pickupAddress, order.deliveryAddress);
    const duration = estimateDuration(distance, vehicle.vehicleType);
    const arrival = estimateArrival(duration);

    const isOverweight = order.weight > vehicle.capacity;
    const overweightWarning = isOverweight
      ? `订单重量 ${formatWeight(order.weight)} 超过车辆载重 ${formatWeight(vehicle.capacity)}`
      : undefined;

    return {
      estimatedDistance: distance,
      estimatedDuration: duration,
      estimatedArrival: arrival,
      isOverweight,
      overweightWarning,
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrderId(null);
    setOverVehicleId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (!activeId.startsWith('order-') || !overId.startsWith('vehicle-')) {
      return;
    }

    const orderId = activeId.replace('order-', '');
    const vehicleId = overId.replace('vehicle-', '');
    const order = pendingOrders.find((o) => o.id === orderId);
    const vehicle = idleVehicles.find((v) => v.id === vehicleId);

    if (!order || !vehicle) {
      showToast('订单或车辆不存在', 'error');
      return;
    }

    if (!vehicle.driverName) {
      showToast(`车辆 ${vehicle.plateNumber} 未分配司机，请先绑定司机`, 'error');
      return;
    }

    const preview = calculatePreview(order, vehicle);
    setPreviewOrder(order);
    setPreviewVehicle(vehicle);
    setPreviewData(preview);
    setShowPreviewModal(true);
  };

  const handleConfirmAssign = () => {
    if (!previewOrder || !previewVehicle) return;

    if (previewData?.isOverweight) {
      showToast(previewData.overweightWarning || '超重，无法分配', 'error');
      return;
    }

    const task = createTask(previewOrder.id, previewVehicle.id);
    if (task) {
      showToast(
        `分配成功！${task.order.orderNo} → ${task.vehicle.plateNumber}，里程 ${formatDistance(task.estimatedDistance)}`,
        'success'
      );
      setPendingOrdersLocal([]);
    } else {
      showToast('任务创建失败，请检查司机信息是否完整', 'error');
    }

    setShowPreviewModal(false);
    setPreviewOrder(null);
    setPreviewVehicle(null);
    setPreviewData(null);
  };

  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    setPreviewOrder(null);
    setPreviewVehicle(null);
    setPreviewData(null);
  };

  const handleDragOver = (event: { active: any; over: any }) => {
    const { over } = event;
    if (over) {
      const overId = over.id as string;
      if (overId.startsWith('vehicle-')) {
        setOverVehicleId(overId.replace('vehicle-', ''));
      } else {
        setOverVehicleId(null);
      }
    } else {
      setOverVehicleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">线路规划</h1>
          <p className="text-sm text-gray-500 mt-1">
            拖拽左侧订单卡片到右侧车辆上即可完成分配
          </p>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
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
                <SortableContext items={pendingOrders.map((o) => `order-${o.id}`)} strategy={verticalListSortingStrategy}>
                  {pendingOrders.map((order) => (
                    <SortableOrderCard key={order.id} order={order} />
                  ))}
                </SortableContext>
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
                  <SortableContext items={idleVehicles.map((v) => `vehicle-${v.id}`)} strategy={verticalListSortingStrategy}>
                    {idleVehicles.map((vehicle) => (
                      <VehicleDropZone
                        key={vehicle.id}
                        vehicle={vehicle}
                        isOver={overVehicleId === vehicle.id}
                        onAssign={() => null}
                      />
                    ))}
                  </SortableContext>
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
                          {task.vehicle.plateNumber} · {task.driverName} · {formatDistance(task.estimatedDistance)}
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

        <DragOverlay>
          {activeOrder ? (
            <div className="p-4 rounded-xl border-2 border-primary-400 bg-white shadow-2xl scale-[1.02] opacity-95 w-[480px]">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded-md text-primary-500 bg-primary-50">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{activeOrder.orderNo}</span>
                        <span className={ORDER_STATUS_COLORS[activeOrder.status]}>
                          {ORDER_STATUS_LABELS[activeOrder.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{activeOrder.customerName}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent-600">
                      {formatMoney(activeOrder.freight)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-gray-400" />
                      {activeOrder.goodsName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Weight className="w-4 h-4 text-gray-400" />
                      {formatWeight(activeOrder.weight)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 line-clamp-1">{activeOrder.pickupAddress}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 line-clamp-1">{activeOrder.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showPreviewModal && previewOrder && previewVehicle && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[650px] overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-50/30">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">派车预览确认</h2>
              </div>
              <button
                onClick={handleCancelPreview}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {previewData.isOverweight && (
                <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-danger-800">超重警告</p>
                    <p className="text-xs text-danger-700 mt-0.5">
                      {previewData.overweightWarning}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-500" />
                    运单信息
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">运单号</p>
                      <p className="text-sm font-semibold text-primary-600">{previewOrder.orderNo}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">客户名称</p>
                      <p className="text-sm font-medium text-gray-900">{previewOrder.customerName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">货物名称</p>
                      <p className="text-sm text-gray-700">{previewOrder.goodsName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">重量</p>
                      <p className={`text-sm font-medium ${previewData.isOverweight ? 'text-danger-600' : 'text-gray-700'}`}>
                        {formatWeight(previewOrder.weight)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">运费</p>
                      <p className="text-sm font-semibold text-accent-600">{formatMoney(previewOrder.freight)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-success-500" />
                    车辆信息
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">车牌号</p>
                      <p className="text-sm font-bold text-gray-900">{previewVehicle.plateNumber}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">车型</p>
                      <p className="text-sm text-gray-700">{VEHICLE_TYPE_LABELS[previewVehicle.vehicleType]}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">载重</p>
                      <p className={`text-sm font-medium ${previewData.isOverweight ? 'text-danger-600' : 'text-gray-700'}`}>
                        {formatWeight(previewVehicle.capacity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">司机</p>
                      <p className="text-sm font-medium text-gray-900">{previewVehicle.driverName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm text-gray-700">{previewVehicle.driverPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-success-500" />
                  运输路线
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-success-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">装货地</p>
                      <p className="text-sm text-gray-700">{previewOrder.pickupAddress}</p>
                      {previewOrder.pickupContact && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {previewOrder.pickupContact} · {previewOrder.pickupPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 ml-3">
                    <div className="w-px h-4 bg-gray-300" />
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-danger-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">卸货地</p>
                      <p className="text-sm text-gray-700">{previewOrder.deliveryAddress}</p>
                      {previewOrder.deliveryContact && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {previewOrder.deliveryContact} · {previewOrder.deliveryPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <Route className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">预估里程</p>
                  <p className="text-xl font-bold text-primary-600 mt-0.5">
                    {formatDistance(previewData.estimatedDistance)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">预估时长</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">
                    {formatDuration(previewData.estimatedDuration)}
                  </p>
                </div>
                <div className="bg-accent-50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 text-accent-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">预计到达</p>
                  <p className="text-sm font-bold text-accent-600 mt-0.5">
                    {formatDateTime(previewData.estimatedArrival)}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelPreview}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={previewData.isOverweight}
                className={previewData.isOverweight ? 'btn-disabled gap-2' : 'btn-primary gap-2'}
              >
                <Check className="w-4 h-4" />
                确认派车
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
