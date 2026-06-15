import { useState, useMemo } from 'react';
import type React from 'react';
import {
  Plus,
  Search,
  Truck,
  User,
  Phone,
  MapPin,
  Wrench,
  Calendar,
  Weight,
  Car,
  X,
  Save,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useTaskStore } from '@/stores/taskStore';
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_COLORS,
  VEHICLE_TYPE_OPTIONS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from '@/utils/constants';
import {
  formatDate,
  formatWeight,
  formatPhone,
  formatDateTime,
  formatDistance,
} from '@/utils/format';
import type { Vehicle, VehicleStatus, VehicleType, DispatchTask } from '@/types';

interface AddVehicleForm {
  plateNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  driverName: string;
  driverPhone: string;
  currentLocation: string;
  nextMaintenanceDate: string;
}

const initialVehicleForm: AddVehicleForm = {
  plateNumber: '',
  vehicleType: 'truck_4_2',
  capacity: 5,
  driverName: '',
  driverPhone: '',
  currentLocation: '',
  nextMaintenanceDate: '',
};

export default function VehicleBoard() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const tasks = useTaskStore((s) => s.tasks);
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [viewMode, setViewMode] = useState<'board' | 'schedule'>('board');
  const [scheduleStartDate, setScheduleStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<AddVehicleForm>({
    ...initialVehicleForm,
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (typeFilter && v.vehicleType !== typeFilter) return false;
      if (minCapacity && v.capacity < Number(minCapacity)) return false;
      if (statusFilter && v.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.plateNumber.toLowerCase().includes(q) ||
          (v.driverName && v.driverName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [vehicles, typeFilter, minCapacity, statusFilter, searchQuery]);

  const idleVehicles = filteredVehicles.filter((v) => v.status === 'idle');
  const transitVehicles = filteredVehicles.filter((v) => v.status === 'transit');
  const maintenanceVehicles = filteredVehicles.filter(
    (v) => v.status === 'maintenance'
  );

  const scheduleDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(scheduleStartDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, [scheduleStartDate]);

  const vehicleTasksByDate = useMemo(() => {
    const map = new Map<string, Map<string, DispatchTask[]>>();
    for (const vehicle of filteredVehicles) {
      const dateMap = new Map<string, DispatchTask[]>();
      for (const date of scheduleDates) {
        dateMap.set(date, []);
      }
      map.set(vehicle.id, dateMap);
    }
    for (const task of tasks) {
      const dateMap = map.get(task.vehicleId);
      if (!dateMap) continue;
      const taskDate = task.createdAt.slice(0, 10);
      if (dateMap.has(taskDate)) {
        dateMap.get(taskDate)!.push(task);
      }
    }
    return map;
  }, [filteredVehicles, tasks, scheduleDates]);

  const goToPrevWeek = () => {
    const d = new Date(scheduleStartDate);
    d.setDate(d.getDate() - 7);
    setScheduleStartDate(d.toISOString().slice(0, 10));
  };

  const goToNextWeek = () => {
    const d = new Date(scheduleStartDate);
    d.setDate(d.getDate() + 7);
    setScheduleStartDate(d.toISOString().slice(0, 10));
  };

  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setScheduleStartDate(d.toISOString().slice(0, 10));
  };

  const formatWeekDay = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = dateStr === today.toISOString().slice(0, 10);
    return {
      day: days[d.getDay()],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday,
    };
  };

  const handleVehicleTypeChange = (type: VehicleType) => {
    const option = VEHICLE_TYPE_OPTIONS.find((o) => o.value === type);
    setVehicleForm({
      ...vehicleForm,
      vehicleType: type,
      capacity: option?.capacity || 0,
    });
  };

  const handleAddVehicle = () => {
    if (!vehicleForm.plateNumber) return;

    const newVehicle: Vehicle = {
      id: `v${Date.now()}`,
      plateNumber: vehicleForm.plateNumber,
      vehicleType: vehicleForm.vehicleType,
      capacity: vehicleForm.capacity,
      status: 'idle',
      driverName: vehicleForm.driverName || undefined,
      driverPhone: vehicleForm.driverPhone || undefined,
      currentLocation: vehicleForm.currentLocation || undefined,
      nextMaintenanceDate: vehicleForm.nextMaintenanceDate || undefined,
    };

    updateVehicle(newVehicle.id, newVehicle);
    setVehicleForm({ ...initialVehicleForm });
    setShowAddModal(false);
  };

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => {
    const isMaintenanceSoon = (() => {
      if (!vehicle.nextMaintenanceDate) return false;
      const now = new Date();
      const maintenance = new Date(vehicle.nextMaintenanceDate);
      const diffDays =
        (maintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7 && diffDays >= 0;
    })();

    return (
      <div className="card p-4 card-hover">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                vehicle.status === 'idle'
                  ? 'bg-success-50 text-success-600'
                  : vehicle.status === 'transit'
                  ? 'bg-primary-50 text-primary-600'
                  : 'bg-danger-50 text-danger-600'
              }`}
            >
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{vehicle.plateNumber}</p>
              <p className="text-xs text-gray-500">
                {VEHICLE_TYPE_LABELS[vehicle.vehicleType]}
              </p>
            </div>
          </div>
          <span className={VEHICLE_STATUS_COLORS[vehicle.status]}>
            {VEHICLE_STATUS_LABELS[vehicle.status]}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Weight className="w-3.5 h-3.5 text-gray-400" />
            <span>载重 {formatWeight(vehicle.capacity)}</span>
          </div>

          {vehicle.driverName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>{vehicle.driverName}</span>
              {vehicle.driverPhone && (
                <span className="text-gray-400 text-xs">
                  {formatPhone(vehicle.driverPhone)}
                </span>
              )}
            </div>
          )}

          {vehicle.currentLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{vehicle.currentLocation}</span>
            </div>
          )}

          {vehicle.nextMaintenanceDate && (
            <div
              className={`flex items-center gap-2 text-sm ${
                isMaintenanceSoon ? 'text-danger-600' : 'text-gray-600'
              }`}
            >
              {isMaintenanceSoon ? (
                <Wrench className="w-3.5 h-3.5 text-danger-500" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span>下次保养：{formatDate(vehicle.nextMaintenanceDate)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BoardColumn = ({
    title,
    vehicles,
    status,
    icon: Icon,
    iconColor,
    bgColor,
  }: {
    title: string;
    vehicles: Vehicle[];
    status: VehicleStatus;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconColor: string;
    bgColor: string;
  }) => (
    <div className="flex flex-col min-h-0">
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl ${bgColor} mb-3`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="font-semibold text-gray-800">{title}</span>
          <span className="text-sm font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full">
            {vehicles.length}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {vehicles.length > 0 ? (
          vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Car className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">暂无{VEHICLE_STATUS_LABELS[status]}车辆</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">车辆看板</h1>
          <p className="text-sm text-gray-500 mt-1">
            实时监控车辆状态，统一调度管理
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('board')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              看板视图
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'schedule'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              排班视图
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            添加车辆
          </button>
        </div>
      </div>

      <div className="card p-4 flex-shrink-0">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="label">车型</label>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">全部车型</option>
              {VEHICLE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">最小载重(吨)</label>
            <input
              type="number"
              className="input"
              placeholder="不限"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
            />
          </div>
          <div>
            <label className="label">车辆状态</label>
            <div className="flex gap-2">
              {(['idle', 'transit', 'maintenance'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setStatusFilter(statusFilter === s ? '' : s)
                  }
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? VEHICLE_STATUS_COLORS[s]
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {VEHICLE_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="label">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="车牌号 / 司机姓名"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
          <BoardColumn
            title="空闲车辆"
            vehicles={idleVehicles}
            status="idle"
            icon={Car}
            iconColor="text-success-600"
            bgColor="bg-success-50"
          />
          <BoardColumn
            title="在途车辆"
            vehicles={transitVehicles}
            status="transit"
            icon={Truck}
            iconColor="text-primary-600"
            bgColor="bg-primary-50"
          />
          <BoardColumn
            title="维修中"
            vehicles={maintenanceVehicles}
            status="maintenance"
            icon={Wrench}
            iconColor="text-danger-600"
            bgColor="bg-danger-50"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="card p-4 mb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrevWeek}
                className="btn-ghost p-2"
                title="上一周"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                今天
              </button>
              <button
                onClick={goToNextWeek}
                className="btn-ghost p-2"
                title="下一周"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-700 ml-2">
                {formatDate(scheduleDates[0])} ~ {formatDate(scheduleDates[6])}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-success-100 border border-success-300" />
                空闲可派
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-100 border border-primary-300" />
                有任务
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-success-500" />
                已完成
              </span>
            </div>
          </div>

          <div className="card flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full h-full">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 w-48 sticky left-0 z-20">
                      车辆信息
                    </th>
                    {scheduleDates.map((date) => {
                      const { day, date: dateLabel, isToday } = formatWeekDay(date);
                      return (
                        <th
                          key={date}
                          className={`px-3 py-3 text-center text-sm font-semibold min-w-36 ${
                            isToday ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="text-xs text-gray-500 font-normal">{day}</div>
                          <div className={isToday ? 'text-primary-700' : ''}>{dateLabel}</div>
                          {isToday && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-500 text-white text-[10px] rounded-full">
                              今天
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredVehicles.map((vehicle) => {
                    const dateMap = vehicleTasksByDate.get(vehicle.id);
                    return (
                      <tr key={vehicle.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-4 py-3 bg-white sticky left-0 z-10">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                vehicle.status === 'idle'
                                  ? 'bg-success-50 text-success-600'
                                  : vehicle.status === 'transit'
                                  ? 'bg-primary-50 text-primary-600'
                                  : 'bg-danger-50 text-danger-600'
                              }`}
                            >
                              <Truck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">
                                {vehicle.plateNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                {VEHICLE_TYPE_LABELS[vehicle.vehicleType]} · {vehicle.driverName || '未绑定司机'}
                              </p>
                            </div>
                          </div>
                        </td>
                        {scheduleDates.map((date) => {
                          const dayTasks = dateMap?.get(date) || [];
                          const { isToday } = formatWeekDay(date);
                          return (
                            <td
                              key={date}
                              className={`px-2 py-2 align-top ${
                                isToday ? 'bg-primary-50/30' : ''
                              }`}
                            >
                              {dayTasks.length === 0 ? (
                                <div className="min-h-16 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-1 py-2">
                                    <CheckCircle2 className="w-4 h-4 text-success-400" />
                                    <span className="text-[10px] text-success-600 font-medium">
                                      空闲可派
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {dayTasks.map((task) => {
                                    const isCompleted =
                                      task.status === 'completed' && task.proofImageUrl;
                                    const isInProgress = task.nodes.some(
                                      (n) => n.nodeType === 'delivery_done'
                                    ) && !isCompleted;
                                    return (
                                      <div
                                        key={task.id}
                                        className={`p-2 rounded-lg text-xs ${
                                          isCompleted
                                            ? 'bg-success-100 border border-success-200'
                                            : isInProgress
                                            ? 'bg-warning-50 border border-warning-200'
                                            : 'bg-primary-50 border border-primary-200'
                                        }`}
                                      >
                                        <div className="font-medium text-gray-800 flex items-center gap-1 mb-1">
                                          <Package className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">{task.order.orderNo}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate">
                                          {task.order.customerName}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                          <Clock className="w-3 h-3 flex-shrink-0" />
                                          <span>{formatDistance(task.estimatedDistance)}</span>
                                        </div>
                                        <div className="mt-1">
                                          <span
                                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                              isCompleted
                                                ? 'bg-success-500 text-white'
                                                : isInProgress
                                                ? 'bg-warning-500 text-white'
                                                : task.status === 'pending'
                                                ? 'bg-gray-500 text-white'
                                                : task.status === 'loading'
                                                ? 'bg-warning-500 text-white'
                                                : task.status === 'transit'
                                                ? 'bg-primary-500 text-white'
                                                : task.status === 'delivering'
                                                ? 'bg-warning-500 text-white'
                                                : 'bg-danger-500 text-white'
                                            }`}
                                          >
                                            {isCompleted
                                              ? '已完成'
                                              : isInProgress
                                              ? '待签收'
                                              : TASK_STATUS_LABELS[task.status]}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[550px] overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">添加车辆</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setVehicleForm({ ...initialVehicleForm });
                }}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">车牌号</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：沪A·12345"
                    value={vehicleForm.plateNumber}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        plateNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">车型</label>
                  <select
                    className="input"
                    value={vehicleForm.vehicleType}
                    onChange={(e) =>
                      handleVehicleTypeChange(e.target.value as VehicleType)
                    }
                  >
                    {VEHICLE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">载重(吨)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="5"
                    value={vehicleForm.capacity || ''}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        capacity: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    下次保养日期
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={vehicleForm.nextMaintenanceDate}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        nextMaintenanceDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                  <User className="w-4 h-4 text-gray-500" />
                  司机信息
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">司机姓名</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="司机姓名"
                      value={vehicleForm.driverName}
                      onChange={(e) =>
                        setVehicleForm({
                          ...vehicleForm,
                          driverName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      联系电话
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="联系电话"
                      value={vehicleForm.driverPhone}
                      onChange={(e) =>
                        setVehicleForm({
                          ...vehicleForm,
                          driverPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  当前位置
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="当前所在位置"
                  value={vehicleForm.currentLocation}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      currentLocation: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setVehicleForm({ ...initialVehicleForm });
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleAddVehicle}
                className="btn-primary gap-2"
                disabled={!vehicleForm.plateNumber}
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
