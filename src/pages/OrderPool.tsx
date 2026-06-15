import { useState, useMemo } from 'react';
import {
  Plus,
  Upload,
  Download,
  Search,
  Eye,
  Edit3,
  XCircle,
  Truck,
  X,
  Save,
  Package,
  MapPin,
  User,
  Phone,
  Calendar,
  Route,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useTaskStore } from '@/stores/taskStore';
import { useToast } from '@/components/Toast/Toast';
import { mockCustomers } from '@/mock/customers';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  VEHICLE_TYPE_LABELS,
} from '@/utils/constants';
import {
  formatDateTime,
  formatMoney,
  formatWeight,
  formatVolume,
  formatDistance,
  formatDuration,
} from '@/utils/format';
import { exportOrderList } from '@/utils/export';
import type { Order, OrderStatus, DispatchTask } from '@/types';

interface BatchOrderForm {
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
}

const initialBatchForm: BatchOrderForm = {
  customerId: '',
  customerName: '',
  pickupAddress: '',
  pickupContact: '',
  pickupPhone: '',
  deliveryAddress: '',
  deliveryContact: '',
  deliveryPhone: '',
  goodsName: '',
  weight: 0,
  volume: 0,
  freight: 0,
};

export default function OrderPool() {
  const orders = useOrderStore((s) => s.orders);
  const addOrder = useOrderStore((s) => s.addOrder);
  const addOrders = useOrderStore((s) => s.addOrders);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const updateOrder = useOrderStore((s) => s.updateOrder);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const idleVehicles = vehicles.filter((v) => v.status === 'idle');
  const createTask = useTaskStore((s) => s.createTask);
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForms, setBatchForms] = useState<BatchOrderForm[]>([
    { ...initialBatchForm },
  ]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Order | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [assignSuccessTask, setAssignSuccessTask] = useState<DispatchTask | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (customerFilter && order.customerId !== customerFilter) return false;
      if (statusFilter && order.status !== statusFilter) return false;
      if (dateStart) {
        const orderDate = new Date(order.createdAt);
        const startDate = new Date(dateStart);
        if (orderDate < startDate) return false;
      }
      if (dateEnd) {
        const orderDate = new Date(order.createdAt);
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59);
        if (orderDate > endDate) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          order.orderNo.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.goodsName.toLowerCase().includes(q) ||
          order.pickupAddress.toLowerCase().includes(q) ||
          order.deliveryAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, customerFilter, statusFilter, dateStart, dateEnd, searchQuery]);

  const handleExport = () => {
    exportOrderList(filteredOrders, 'xlsx');
  };

  const handleAddBatchForm = () => {
    setBatchForms([...batchForms, { ...initialBatchForm }]);
  };

  const handleRemoveBatchForm = (index: number) => {
    if (batchForms.length > 1) {
      setBatchForms(batchForms.filter((_, i) => i !== index));
    }
  };

  const handleBatchFormChange = (
    index: number,
    field: keyof BatchOrderForm,
    value: string | number
  ) => {
    const newForms = [...batchForms];
    newForms[index] = { ...newForms[index], [field]: value };

    if (field === 'customerId') {
      const customer = mockCustomers.find((c) => c.id === value);
      if (customer) {
        newForms[index].customerName = customer.name;
      }
    }

    setBatchForms(newForms);
  };

  const handleBatchSubmit = () => {
    const validForms = batchForms.filter(
      (f) => f.customerId && f.pickupAddress && f.deliveryAddress && f.goodsName
    );
    if (validForms.length === 0) return;

    addOrders(validForms);
    setBatchForms([{ ...initialBatchForm }]);
    setShowBatchModal(false);
  };

  const handleViewDetail = (order: Order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const handleEdit = (order: Order) => {
    setEditForm({ ...order });
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    updateOrder(editForm.id, {
      pickupAddress: editForm.pickupAddress,
      pickupContact: editForm.pickupContact,
      pickupPhone: editForm.pickupPhone,
      deliveryAddress: editForm.deliveryAddress,
      deliveryContact: editForm.deliveryContact,
      deliveryPhone: editForm.deliveryPhone,
      goodsName: editForm.goodsName,
      weight: editForm.weight,
      volume: editForm.volume,
      freight: editForm.freight,
    });
    setShowEditModal(false);
    setEditForm(null);
  };

  const handleCancel = (id: string) => {
    if (confirm('确定要取消该订单吗？')) {
      cancelOrder(id);
    }
  };

  const handleAssign = (orderId: string) => {
    setAssignOrderId(orderId);
    setSelectedVehicleId('');
    setAssignSuccessTask(null);
    setShowAssignModal(true);
  };

  const currentAssignOrder = orders.find((o) => o.id === assignOrderId);
  const selectedVehicle = idleVehicles.find((v) => v.id === selectedVehicleId);

  const handleAssignConfirm = () => {
    if (!selectedVehicleId || !assignOrderId) return;
    const order = orders.find((o) => o.id === assignOrderId);
    const vehicle = idleVehicles.find((v) => v.id === selectedVehicleId);

    if (!order || !vehicle) return;

    if (order.weight > vehicle.capacity) {
      showToast(
        `超重！订单重量 ${formatWeight(order.weight)} 超过车辆载重 ${formatWeight(vehicle.capacity)}`,
        'error'
      );
      return;
    }

    const task = createTask(assignOrderId, selectedVehicleId);
    if (task) {
      setAssignSuccessTask(task);
      showToast(`分配成功！任务已发送给 ${task.driverName}`, 'success');
    } else {
      showToast('任务创建失败，请检查司机信息是否完整', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单池</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理所有运输订单，支持录入、筛选、导出
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              addOrder({
                customerId: 'c1',
                customerName: '华盛电子科技',
                pickupAddress: '',
                pickupContact: '',
                pickupPhone: '',
                deliveryAddress: '',
                deliveryContact: '',
                deliveryPhone: '',
                goodsName: '',
                weight: 0,
                volume: 0,
                freight: 0,
              });
            }}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            新建订单
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="btn-secondary gap-2"
          >
            <Upload className="w-4 h-4" />
            批量录入
          </button>
          <button onClick={handleExport} className="btn-secondary gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="label">客户名称</label>
            <select
              className="input"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="">全部客户</option>
              {mockCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">订单状态</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">开始日期</label>
            <input
              type="date"
              className="input"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label">结束日期</label>
            <input
              type="date"
              className="input"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="label">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="运单号/客户/货物/地址"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="table-header">运单号</th>
                <th className="table-header">客户</th>
                <th className="table-header">货物</th>
                <th className="table-header">重量/体积</th>
                <th className="table-header">装货地址</th>
                <th className="table-header">卸货地址</th>
                <th className="table-header">运费</th>
                <th className="table-header">状态</th>
                <th className="table-header">创建时间</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="table-cell font-medium text-primary-600">
                    {order.orderNo}
                  </td>
                  <td className="table-cell">{order.customerName}</td>
                  <td className="table-cell">{order.goodsName}</td>
                  <td className="table-cell">
                    <div>
                      <p className="text-sm">{formatWeight(order.weight)}</p>
                      <p className="text-xs text-gray-500">
                        {formatVolume(order.volume)}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell max-w-[180px]">
                    <div
                      className="truncate text-xs text-gray-600"
                      title={order.pickupAddress}
                    >
                      {order.pickupAddress}
                    </div>
                  </td>
                  <td className="table-cell max-w-[180px]">
                    <div
                      className="truncate text-xs text-gray-600"
                      title={order.deliveryAddress}
                    >
                      {order.deliveryAddress}
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-accent-600">
                    {formatMoney(order.freight)}
                  </td>
                  <td className="table-cell">
                    <span className={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-600">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleEdit(order)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-danger-600 transition-colors"
                            title="取消订单"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAssign(order.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-success-600 transition-colors"
                            title="分配车辆"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">暂无订单数据</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500">
          共 {filteredOrders.length} 条订单
        </div>
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">批量录入订单</h2>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {batchForms.map((form, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 bg-gray-50/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      订单 {index + 1}
                    </span>
                    {batchForms.length > 1 && (
                      <button
                        onClick={() => handleRemoveBatchForm(index)}
                        className="p-1 rounded-md hover:bg-danger-50 text-danger-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <label className="label">
                        <User className="w-3.5 h-3.5 inline mr-1" />
                        客户信息
                      </label>
                      <select
                        className="input"
                        value={form.customerId}
                        onChange={(e) =>
                          handleBatchFormChange(index, 'customerId', e.target.value)
                        }
                      >
                        <option value="">选择客户</option>
                        {mockCustomers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {c.contact}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="label">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        装货地址
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="请输入装货地址"
                        value={form.pickupAddress}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'pickupAddress',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <User className="w-3.5 h-3.5 inline mr-1" />
                        装货联系人
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="联系人"
                        value={form.pickupContact}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'pickupContact',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">
                        <Phone className="w-3.5 h-3.5 inline mr-1" />
                        装货电话
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="联系电话"
                        value={form.pickupPhone}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'pickupPhone',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="label">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        卸货地址
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="请输入卸货地址"
                        value={form.deliveryAddress}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'deliveryAddress',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <User className="w-3.5 h-3.5 inline mr-1" />
                        卸货联系人
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="联系人"
                        value={form.deliveryContact}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'deliveryContact',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">
                        <Phone className="w-3.5 h-3.5 inline mr-1" />
                        卸货电话
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="联系电话"
                        value={form.deliveryPhone}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'deliveryPhone',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="label">
                        <Package className="w-3.5 h-3.5 inline mr-1" />
                        货物名称
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="货物名称"
                        value={form.goodsName}
                        onChange={(e) =>
                          handleBatchFormChange(index, 'goodsName', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label">重量(吨)</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="0"
                        value={form.weight || ''}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'weight',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">体积(方)</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="0"
                        value={form.volume || ''}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'volume',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">运费(元)</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="0"
                        value={form.freight || ''}
                        onChange={(e) =>
                          handleBatchFormChange(
                            index,
                            'freight',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddBatchForm}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/30 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                添加一行订单
              </button>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleBatchSubmit} className="btn-primary gap-2">
                <Save className="w-4 h-4" />
                提交录入
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  订单详情
                </h2>
                <span className={ORDER_STATUS_COLORS[detailOrder.status]}>
                  {ORDER_STATUS_LABELS[detailOrder.status]}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary-500" />
                  订单信息
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500">运单号</p>
                    <p className="text-sm font-medium text-primary-600 mt-0.5">
                      {detailOrder.orderNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">客户名称</p>
                    <p className="text-sm font-medium mt-0.5">
                      {detailOrder.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">货物名称</p>
                    <p className="text-sm font-medium mt-0.5">
                      {detailOrder.goodsName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">运费</p>
                    <p className="text-sm font-semibold text-accent-600 mt-0.5">
                      {formatMoney(detailOrder.freight)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">重量</p>
                    <p className="text-sm font-medium mt-0.5">
                      {formatWeight(detailOrder.weight)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">体积</p>
                    <p className="text-sm font-medium mt-0.5">
                      {formatVolume(detailOrder.volume)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">创建时间</p>
                    <p className="text-sm mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDateTime(detailOrder.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-success-500" />
                  装货信息
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">装货地址</p>
                    <p className="text-sm mt-0.5">
                      {detailOrder.pickupAddress}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">联系人</p>
                      <p className="text-sm mt-0.5">
                        {detailOrder.pickupContact}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm mt-0.5">
                        {detailOrder.pickupPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-danger-500" />
                  卸货信息
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">卸货地址</p>
                    <p className="text-sm mt-0.5">
                      {detailOrder.deliveryAddress}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">联系人</p>
                      <p className="text-sm mt-0.5">
                        {detailOrder.deliveryContact}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm mt-0.5">
                        {detailOrder.deliveryPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">编辑订单</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm(null);
                }}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">装货地址</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.pickupAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        pickupAddress: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">装货联系人</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.pickupContact}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        pickupContact: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">装货电话</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.pickupPhone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        pickupPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">卸货地址</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.deliveryAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        deliveryAddress: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">卸货联系人</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.deliveryContact}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        deliveryContact: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">卸货电话</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.deliveryPhone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        deliveryPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">货物名称</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.goodsName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, goodsName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">重量(吨)</label>
                  <input
                    type="number"
                    className="input"
                    value={editForm.weight}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        weight: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">体积(方)</label>
                  <input
                    type="number"
                    className="input"
                    value={editForm.volume}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        volume: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">运费(元)</label>
                  <input
                    type="number"
                    className="input"
                    value={editForm.freight}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        freight: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleEditSave} className="btn-primary gap-2">
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-in">
            {assignSuccessTask ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-success-50/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-success-500" />
                    <h2 className="text-lg font-semibold text-gray-900">派车成功</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignOrderId('');
                      setSelectedVehicleId('');
                      setAssignSuccessTask(null);
                    }}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary-500" />
                      运单信息
                    </h3>
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-xs text-gray-500">运单号</p>
                        <p className="text-sm font-medium text-primary-600 mt-0.5">
                          {assignSuccessTask.order.orderNo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">客户</p>
                        <p className="text-sm font-medium mt-0.5">
                          {assignSuccessTask.order.customerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">货物</p>
                        <p className="text-sm mt-0.5">
                          {assignSuccessTask.order.goodsName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">运费</p>
                        <p className="text-sm font-semibold text-accent-600 mt-0.5">
                          {formatMoney(assignSuccessTask.order.freight)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-success-500" />
                      装货信息
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">装货地址</p>
                        <p className="text-sm mt-0.5">
                          {assignSuccessTask.order.pickupAddress}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">联系人</p>
                          <p className="text-sm font-medium mt-0.5">
                            {assignSuccessTask.order.pickupContact}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">联系电话</p>
                          <p className="text-sm mt-0.5">
                            {assignSuccessTask.order.pickupPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-danger-500" />
                      卸货信息
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">卸货地址</p>
                        <p className="text-sm mt-0.5">
                          {assignSuccessTask.order.deliveryAddress}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">联系人</p>
                          <p className="text-sm font-medium mt-0.5">
                            {assignSuccessTask.order.deliveryContact}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">联系电话</p>
                          <p className="text-sm mt-0.5">
                            {assignSuccessTask.order.deliveryPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary-500" />
                      车辆与司机
                    </h3>
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-xs text-gray-500">车牌号</p>
                        <p className="text-sm font-bold mt-0.5">
                          {assignSuccessTask.vehicle.plateNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">车型</p>
                        <p className="text-sm mt-0.5">
                          {VEHICLE_TYPE_LABELS[assignSuccessTask.vehicle.vehicleType]}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">司机姓名</p>
                        <p className="text-sm font-medium mt-0.5">
                          {assignSuccessTask.driverName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">联系电话</p>
                        <p className="text-sm mt-0.5">
                          {assignSuccessTask.driverPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-primary-50 rounded-lg p-4 text-center">
                      <Route className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">预估里程</p>
                      <p className="text-base font-bold text-primary-600 mt-0.5">
                        {formatDistance(assignSuccessTask.estimatedDistance)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">预估时长</p>
                      <p className="text-base font-bold text-gray-800 mt-0.5">
                        {formatDuration(assignSuccessTask.estimatedDuration)}
                      </p>
                    </div>
                    <div className="bg-accent-50 rounded-lg p-4 text-center">
                      <Calendar className="w-5 h-5 text-accent-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">预计到达</p>
                      <p className="text-sm font-bold text-accent-600 mt-0.5">
                        {formatDateTime(assignSuccessTask.estimatedArrival)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignOrderId('');
                      setSelectedVehicleId('');
                      setAssignSuccessTask(null);
                    }}
                    className="btn-primary"
                  >
                    完成
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">分配车辆</h2>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignOrderId('');
                      setSelectedVehicleId('');
                    }}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                  {currentAssignOrder && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary-500" />
                        待分配订单
                      </h3>
                      <div className="bg-primary-50/50 border border-primary-100 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {currentAssignOrder.orderNo}
                            </span>
                            <span className={ORDER_STATUS_COLORS[currentAssignOrder.status] + ' ml-2'}>
                              {ORDER_STATUS_LABELS[currentAssignOrder.status]}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-accent-600">
                            {formatMoney(currentAssignOrder.freight)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {currentAssignOrder.customerName} · {currentAssignOrder.goodsName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <MapPin className="w-3 h-3 text-success-500 inline mr-0.5" />
                            {currentAssignOrder.pickupAddress.slice(0, 20)}
                            {currentAssignOrder.pickupAddress.length > 20 && '...'}
                          </span>
                          <span>
                            <MapPin className="w-3 h-3 text-danger-500 inline mr-0.5" />
                            {currentAssignOrder.deliveryAddress.slice(0, 20)}
                            {currentAssignOrder.deliveryAddress.length > 20 && '...'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          重量 {formatWeight(currentAssignOrder.weight)} · 体积 {formatVolume(currentAssignOrder.volume)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-success-500" />
                        选择空闲车辆
                      </h3>
                      <span className="text-xs text-gray-500">{idleVehicles.length} 辆可用</span>
                    </div>
                    {idleVehicles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">暂无空闲车辆可用</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                        {idleVehicles.map((v) => {
                          const selected = selectedVehicleId === v.id;
                          const overloaded = currentAssignOrder && currentAssignOrder.weight > v.capacity;
                          return (
                            <div
                              key={v.id}
                              onClick={() => !overloaded && setSelectedVehicleId(v.id)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selected
                                  ? 'border-primary-500 bg-primary-50'
                                  : overloaded
                                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                  : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{v.plateNumber}</span>
                                    <span className="text-xs text-gray-500">
                                      {VEHICLE_TYPE_LABELS[v.vehicleType]}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    载重 {formatWeight(v.capacity)}
                                    {v.driverName && ` · 司机：${v.driverName}`}
                                  </p>
                                </div>
                                {overloaded ? (
                                  <span className="text-xs text-danger-600 bg-danger-50 px-2 py-0.5 rounded">
                                    超重
                                  </span>
                                ) : selected ? (
                                  <CheckCircle2 className="w-5 h-5 text-primary-500" />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssignOrderId('');
                      setSelectedVehicleId('');
                    }}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAssignConfirm}
                    className="btn-primary gap-2"
                    disabled={!selectedVehicleId}
                  >
                    <Truck className="w-4 h-4" />
                    确认派车
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
