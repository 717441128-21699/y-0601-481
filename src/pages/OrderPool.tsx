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
  FileUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

interface ImportRow {
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
  orderNo?: string;
}

interface ImportValidation {
  rowIndex: number;
  issues: {
    type: 'error' | 'warning';
    field: string;
    message: string;
  }[];
  isDuplicate: boolean;
  isOverweight: boolean;
}

const IMPORT_TEMPLATE_COLUMNS = [
  { key: 'orderNo', label: '运单号(可选)', required: false },
  { key: 'customerName', label: '客户名称', required: true },
  { key: 'pickupAddress', label: '装货地址', required: true },
  { key: 'pickupContact', label: '装货联系人', required: true },
  { key: 'pickupPhone', label: '装货电话', required: true },
  { key: 'deliveryAddress', label: '卸货地址', required: true },
  { key: 'deliveryContact', label: '卸货联系人', required: true },
  { key: 'deliveryPhone', label: '卸货电话', required: true },
  { key: 'goodsName', label: '货物名称', required: true },
  { key: 'weight', label: '重量(吨)', required: true },
  { key: 'volume', label: '体积(方)', required: false },
  { key: 'freight', label: '运费(元)', required: true },
];

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

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importValidations, setImportValidations] = useState<Map<number, ImportValidation>>(new Map());
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      showToast('请上传 Excel (.xlsx, .xls) 或 CSV 格式的文件', 'error');
      return;
    }

    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedData: ImportRow[] = jsonData.map((row, idx) => ({
          orderNo: String(row['运单号'] || row['orderNo'] || row['运单号(可选)'] || ''),
          customerName: String(row['客户名称'] || row['customerName'] || ''),
          pickupAddress: String(row['装货地址'] || row['pickupAddress'] || ''),
          pickupContact: String(row['装货联系人'] || row['pickupContact'] || ''),
          pickupPhone: String(row['装货电话'] || row['pickupPhone'] || ''),
          deliveryAddress: String(row['卸货地址'] || row['deliveryAddress'] || ''),
          deliveryContact: String(row['卸货联系人'] || row['deliveryContact'] || ''),
          deliveryPhone: String(row['卸货电话'] || row['deliveryPhone'] || ''),
          goodsName: String(row['货物名称'] || row['goodsName'] || ''),
          weight: Number(row['重量(吨)'] || row['weight'] || 0),
          volume: Number(row['体积(方)'] || row['volume'] || 0),
          freight: Number(row['运费(元)'] || row['freight'] || 0),
        }));

        if (parsedData.length === 0) {
          showToast('文件中没有数据', 'error');
          return;
        }

        setImportData(parsedData);
        validateImportData(parsedData);
        setImportStep('preview');
      } catch (err) {
        console.error(err);
        showToast('文件解析失败，请检查文件格式', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const validateImportData = (data: ImportRow[]) => {
    const validations = new Map<number, ImportValidation>();
    const existingOrderNos = new Set(orders.map((o) => o.orderNo));
    const orderNosInFile = new Map<string, number[]>();

    data.forEach((row, rowIndex) => {
      const validation: ImportValidation = {
        rowIndex,
        issues: [],
        isDuplicate: false,
        isOverweight: false,
      };

      if (row.orderNo) {
        if (existingOrderNos.has(row.orderNo)) {
          validation.issues.push({
            type: 'error',
            field: 'orderNo',
            message: `运单号 ${row.orderNo} 已存在于系统中`,
          });
          validation.isDuplicate = true;
        }
        if (orderNosInFile.has(row.orderNo)) {
          orderNosInFile.get(row.orderNo)!.push(rowIndex);
        } else {
          orderNosInFile.set(row.orderNo, [rowIndex]);
        }
      }

      if (!row.customerName?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'customerName',
          message: '客户名称不能为空',
        });
      }
      if (!row.pickupAddress?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'pickupAddress',
          message: '装货地址不能为空',
        });
      }
      if (!row.pickupContact?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'pickupContact',
          message: '装货联系人不能为空',
        });
      }
      if (!row.pickupPhone?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'pickupPhone',
          message: '装货电话不能为空',
        });
      }
      if (!row.deliveryAddress?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'deliveryAddress',
          message: '卸货地址不能为空',
        });
      }
      if (!row.deliveryContact?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'deliveryContact',
          message: '卸货联系人不能为空',
        });
      }
      if (!row.deliveryPhone?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'deliveryPhone',
          message: '卸货电话不能为空',
        });
      }
      if (!row.goodsName?.trim()) {
        validation.issues.push({
          type: 'error',
          field: 'goodsName',
          message: '货物名称不能为空',
        });
      }
      if (!row.weight || row.weight <= 0) {
        validation.issues.push({
          type: 'error',
          field: 'weight',
          message: '重量必须大于0',
        });
      }
      if (row.weight > 40) {
        validation.issues.push({
          type: 'warning',
          field: 'weight',
          message: `重量 ${row.weight}吨 超过最大车型载重(40吨)，需使用特殊车辆`,
        });
        validation.isOverweight = true;
      }
      if (!row.freight || row.freight <= 0) {
        validation.issues.push({
          type: 'error',
          field: 'freight',
          message: '运费必须大于0',
        });
      }

      validations.set(rowIndex, validation);
    });

    orderNosInFile.forEach((indices, orderNo) => {
      if (indices.length > 1) {
        indices.forEach((idx) => {
          const v = validations.get(idx)!;
          v.issues.push({
            type: 'error',
            field: 'orderNo',
            message: `运单号 ${orderNo} 在文件中重复出现`,
          });
          v.isDuplicate = true;
        });
      }
    });

    setImportValidations(validations);
  };

  const hasImportErrors = useMemo(() => {
    for (const v of importValidations.values()) {
      if (v.issues.some((i) => i.type === 'error')) {
        return true;
      }
    }
    return false;
  }, [importValidations]);

  const importStats = useMemo(() => {
    let total = importData.length;
    let errors = 0;
    let warnings = 0;
    let duplicates = 0;
    let overweight = 0;

    for (const v of importValidations.values()) {
      if (v.issues.some((i) => i.type === 'error')) errors++;
      if (v.issues.some((i) => i.type === 'warning')) warnings++;
      if (v.isDuplicate) duplicates++;
      if (v.isOverweight) overweight++;
    }

    return { total, errors, warnings, duplicates, overweight };
  }, [importData, importValidations]);

  const handleImportConfirm = () => {
    if (hasImportErrors) {
      showToast('存在错误，请修正后再导入', 'error');
      return;
    }

    const validRows = importData.filter((_, idx) => {
      const v = importValidations.get(idx);
      return !v?.issues.some((i) => i.type === 'error');
    });

    let successCount = 0;
    const errors: string[] = [];

    validRows.forEach((row, idx) => {
      try {
        const customer = mockCustomers.find(
          (c) => c.name === row.customerName.trim()
        );
        const orderData: BatchOrderForm = {
          customerId: customer?.id || `c-${Date.now()}-${idx}`,
          customerName: row.customerName.trim(),
          pickupAddress: row.pickupAddress.trim(),
          pickupContact: row.pickupContact.trim(),
          pickupPhone: row.pickupPhone.trim(),
          deliveryAddress: row.deliveryAddress.trim(),
          deliveryContact: row.deliveryContact.trim(),
          deliveryPhone: row.deliveryPhone.trim(),
          goodsName: row.goodsName.trim(),
          weight: row.weight,
          volume: row.volume,
          freight: row.freight,
        };
        addOrder(orderData);
        successCount++;
      } catch (err) {
        errors.push(`第 ${idx + 1} 行：${err instanceof Error ? err.message : '未知错误'}`);
      }
    });

    setImportResult({
      success: successCount,
      failed: validRows.length - successCount,
      errors,
    });
    setImportStep('result');
    showToast(`成功导入 ${successCount} 条订单`, 'success');
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      IMPORT_TEMPLATE_COLUMNS.map((c) => c.label),
      [
        'YD202501010001',
        '华盛电子科技',
        '深圳市南山区科技园北区',
        '张经理',
        '13800138000',
        '广州市天河区珠江新城',
        '李主管',
        '13900139000',
        '电子元器件',
        '5',
        '10',
        '1500',
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '运单导入模板');
    XLSX.writeFile(wb, '运单导入模板.xlsx');
  };

  const resetImport = () => {
    setImportStep('upload');
    setImportData([]);
    setImportFileName('');
    setImportValidations(new Map());
    setImportResult(null);
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
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportStep('upload');
              setImportData([]);
              setImportFileName('');
              setImportValidations(new Map());
              setImportResult(null);
            }}
            className="btn-secondary gap-2"
          >
            <FileUp className="w-4 h-4" />
            Excel 导入
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[1100px] max-h-[85vh] overflow-hidden flex flex-col animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Excel 批量导入</h2>
                <div className="flex gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      importStep === 'upload' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    1. 上传文件
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      importStep === 'preview' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    2. 预览校验
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      importStep === 'result' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    3. 导入结果
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImport();
                }}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importStep === 'upload' && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      支持 Excel (.xlsx, .xls) 和 CSV 格式文件。请先下载模板，按模板格式填写后上传。
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Download className="w-3.5 h-3.5 inline mr-1" />
                      下载导入模板
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 transition-colors bg-gray-50/30">
                    <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-base font-medium text-gray-700 mb-2">
                      拖拽文件到此处，或点击选择文件
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      支持 .xlsx, .xls, .csv 格式，最多 500 条
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="import-file-input"
                    />
                    <label
                      htmlFor="import-file-input"
                      className="btn-primary inline-flex cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      选择文件
                    </label>
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      导入说明
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• 必填字段不能为空，否则无法导入</li>
                      <li>• 运单号为可选，不填则系统自动生成</li>
                      <li>• 重量超过 40 吨会提示超重警告</li>
                      <li>• 重复运单号会被标记为错误</li>
                      <li>• 导入前请仔细预览校验结果</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {importStep === 'preview' && (
              <>
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        文件名：<span className="font-medium text-gray-900">{importFileName}</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        共 <span className="font-semibold text-gray-900">{importStats.total}</span> 条数据
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                        正常：<span className="font-semibold text-gray-700">{importStats.total - importStats.errors}</span>
                      </span>
                      {importStats.errors > 0 && (
                        <span className="text-xs flex items-center gap-1 px-2 py-1 bg-danger-50 text-danger-700 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          错误：<span className="font-semibold">{importStats.errors}</span>
                        </span>
                      )}
                      {importStats.warnings > 0 && (
                        <span className="text-xs flex items-center gap-1 px-2 py-1 bg-warning-50 text-warning-700 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          警告：<span className="font-semibold">{importStats.warnings}</span>
                        </span>
                      )}
                      {importStats.duplicates > 0 && (
                        <span className="text-xs flex items-center gap-1 px-2 py-1 bg-danger-50 text-danger-700 rounded">
                          重复：<span className="font-semibold">{importStats.duplicates}</span>
                        </span>
                      )}
                      {importStats.overweight > 0 && (
                        <span className="text-xs flex items-center gap-1 px-2 py-1 bg-warning-50 text-warning-700 rounded">
                          超重：<span className="font-semibold">{importStats.overweight}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto scrollbar-thin">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-100">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-16">行号</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-28">运单号</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">客户名称</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">装货地址</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">装货联系</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">装货电话</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">卸货地址</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">卸货联系</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">卸货电话</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">货物名称</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700 w-16">重量</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700 w-16">体积</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700 w-16">运费</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">问题</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {importData.map((row, rowIndex) => {
                        const validation = importValidations.get(rowIndex);
                        const hasError = validation?.issues.some((i) => i.type === 'error');
                        const hasWarning = validation?.issues.some((i) => i.type === 'warning');
                        return (
                          <tr
                            key={rowIndex}
                            className={
                              hasError
                                ? 'bg-danger-50/50'
                                : hasWarning
                                ? 'bg-warning-50/30'
                                : 'hover:bg-gray-50/30'
                            }
                          >
                            <td className="px-3 py-2 font-medium text-gray-700">{rowIndex + 1}</td>
                            <td className={`px-3 py-2 ${validation?.isDuplicate ? 'text-danger-600 font-medium' : 'text-gray-700'}`}>
                              {row.orderNo || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-700 truncate" title={row.customerName}>
                              {row.customerName}
                            </td>
                            <td className="px-3 py-2 text-gray-600 truncate" title={row.pickupAddress}>
                              {row.pickupAddress}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{row.pickupContact}</td>
                            <td className="px-3 py-2 text-gray-600">{row.pickupPhone}</td>
                            <td className="px-3 py-2 text-gray-600 truncate" title={row.deliveryAddress}>
                              {row.deliveryAddress}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{row.deliveryContact}</td>
                            <td className="px-3 py-2 text-gray-600">{row.deliveryPhone}</td>
                            <td className="px-3 py-2 text-gray-700">{row.goodsName}</td>
                            <td className={`px-3 py-2 text-right ${validation?.isOverweight ? 'text-warning-600 font-medium' : 'text-gray-700'}`}>
                              {row.weight}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">{row.volume || 0}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{row.freight}</td>
                            <td className="px-3 py-2">
                              {validation && validation.issues.length > 0 && (
                                <div className="space-y-0.5">
                                  {validation.issues.map((issue, idx) => (
                                    <p
                                      key={idx}
                                      className={`text-[10px] truncate ${
                                        issue.type === 'error' ? 'text-danger-600' : 'text-warning-600'
                                      }`}
                                      title={issue.message}
                                    >
                                      {issue.type === 'error' ? '❌' : '⚠️'} {issue.message}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {hasImportErrors ? (
                      <span className="text-danger-600">
                        ❌ 存在错误，无法导入。请修正文件后重新上传。
                      </span>
                    ) : importStats.warnings > 0 ? (
                      <span className="text-warning-600">
                        ⚠️ 存在警告，您可以继续导入，但请留意相关提示。
                      </span>
                    ) : (
                      <span className="text-success-600">
                        ✅ 全部数据校验通过，可以导入。
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetImport}
                      className="btn-secondary"
                    >
                      重新上传
                    </button>
                    <button
                      onClick={handleImportConfirm}
                      disabled={hasImportErrors}
                      className={hasImportErrors ? 'btn-disabled' : 'btn-primary gap-2'}
                    >
                      <Save className="w-4 h-4" />
                      确认导入
                    </button>
                  </div>
                </div>
              </>
            )}

            {importStep === 'result' && importResult && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="max-w-md mx-auto text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    importResult.failed === 0 ? 'bg-success-100' : 'bg-warning-100'
                  }`}>
                    {importResult.failed === 0 ? (
                      <CheckCircle2 className="w-8 h-8 text-success-600" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-warning-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {importResult.failed === 0 ? '导入完成' : '导入完成，部分失败'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    共 {importResult.success + importResult.failed} 条数据
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-success-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-success-600">{importResult.success}</p>
                      <p className="text-xs text-success-700 mt-1">成功</p>
                    </div>
                    <div className="bg-danger-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-danger-600">{importResult.failed}</p>
                      <p className="text-xs text-danger-700 mt-1">失败</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-2">失败详情：</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <p key={idx} className="text-xs text-danger-600">
                            {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={resetImport}
                      className="btn-secondary flex-1"
                    >
                      继续导入
                    </button>
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        resetImport();
                      }}
                      className="btn-primary flex-1"
                    >
                      完成
                    </button>
                  </div>
                </div>
              </div>
            )}
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
