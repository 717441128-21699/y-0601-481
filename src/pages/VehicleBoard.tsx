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
} from 'lucide-react';
import { useVehicleStore } from '@/stores/vehicleStore';
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_STATUS_COLORS,
  VEHICLE_TYPE_OPTIONS,
} from '@/utils/constants';
import { formatDate, formatWeight, formatPhone } from '@/utils/format';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types';

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
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');

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
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          添加车辆
        </button>
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
