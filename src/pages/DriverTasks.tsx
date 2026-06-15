import { useState, useMemo, useRef } from 'react';
import {
  Package,
  Truck,
  MapPin,
  User,
  Clock,
  Search,
  X,
  Route,
  Weight,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Filter,
  Copy,
  Check,
  ArrowRight,
  UploadCloud,
  Image as ImageIcon,
  Download,
  Eye,
  FileImage,
  Info,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useToast } from '@/components/Toast/Toast';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  NODE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from '@/utils/constants';
import {
  formatWeight,
  formatDistance,
  formatDuration,
  formatDateTime,
  formatMoney,
  formatVolume,
  formatPhone,
} from '@/utils/format';
import { generateDispatchSheet } from '@/utils/export';
import type { DispatchTask, TaskStatus, NodeType } from '@/types';

const NODE_ORDER: NodeType[] = [
  'pickup_start',
  'pickup_done',
  'transit_checkpoint',
  'delivery_start',
  'delivery_done',
];

interface DispatchSheetModalProps {
  task: DispatchTask;
  onClose: () => void;
}

function DispatchSheetModal({ task, onClose }: DispatchSheetModalProps) {
  const [copied, setCopied] = useState(false);
  const content = generateDispatchSheet(task);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('复制失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">派车单</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 rounded-lg p-5 border border-gray-200 leading-relaxed">
            {content}
          </pre>
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            关闭
          </button>
          <button onClick={handleCopy} className="btn-primary flex-1 gap-2">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制派车单
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MarkNodeModalProps {
  task: DispatchTask;
  onClose: () => void;
  onConfirm: (nodeType: NodeType, location: string, remark?: string) => void;
}

function MarkNodeModal({ task, onClose, onConfirm }: MarkNodeModalProps) {
  const completedNodes = task.nodes.map((n) => n.nodeType);
  const nextNodeIndex = NODE_ORDER.findIndex((n) => !completedNodes.includes(n));
  const availableNodes = nextNodeIndex === -1 ? [] : NODE_ORDER.slice(nextNodeIndex);

  const [selectedNode, setSelectedNode] = useState<NodeType | null>(
    availableNodes[0] || null
  );
  const [location, setLocation] = useState('');
  const [remark, setRemark] = useState('');

  const handleConfirm = () => {
    if (!selectedNode || !location.trim()) return;
    onConfirm(selectedNode, location.trim(), remark.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">标记任务节点</h3>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {availableNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success-400" />
              <p className="text-sm">所有节点已完成</p>
            </div>
          ) : (
            <>
              <div>
                <label className="label">选择节点</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableNodes.map((node) => (
                    <button
                      key={node}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                        selectedNode === node
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {NODE_TYPE_LABELS[node]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">当前位置</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="请输入当前位置"
                  className="input"
                />
              </div>
              <div>
                <label className="label">备注（可选）</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="填写备注信息"
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </>
          )}
        </div>
        {availableNodes.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedNode || !location.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认标记
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CompleteSignModalProps {
  task: DispatchTask;
  onClose: () => void;
  onConfirm: (proofImageUrl?: string) => void;
}

function CompleteSignModal({ task, onClose, onConfirm }: CompleteSignModalProps) {
  const { showToast } = useToast();
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('图片大小不能超过 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProofImage(result);
      showToast('凭证图片上传成功', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    onConfirm(proofImage || undefined);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900">完成签收</h3>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2 bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">运单号</span>
                <span className="font-medium text-gray-900">{task.order.orderNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">客户</span>
                <span className="font-medium text-gray-900">{task.order.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">车牌号</span>
                <span className="font-medium text-gray-900">{task.vehicle.plateNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">司机</span>
                <span className="font-medium text-gray-900">{task.driverName}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0 flex items-center gap-1">
                  <UploadCloud className="w-4 h-4" />
                  上传签收凭证
                </label>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Info className="w-3 h-3" />
                  支持 JPG/PNG，最大 10MB
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {proofImage ? (
                <div className="relative group">
                  <img
                    src={proofImage}
                    alt="签收凭证"
                    className="w-full h-56 object-cover rounded-lg border-2 border-primary-200 cursor-pointer"
                    onClick={() => setPreviewOpen(true)}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-white transition-colors"
                      title="预览"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setProofImage(null)}
                      className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-danger-50 hover:text-danger-600 transition-colors"
                      title="删除"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div
                    className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded text-xs text-gray-600"
                  >
                    <ImageIcon className="w-3 h-3" />
                    点击图片预览
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                >
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600 mb-0.5">
                    点击上传签收凭证
                  </p>
                  <p className="text-xs text-gray-400">
                    签收单、回单、收货确认单等图片文件
                  </p>
                </div>
              )}
            </div>

            {!proofImage && (
              <div className="flex items-start gap-2 p-3 bg-warning-50 rounded-lg border border-warning-100">
                <Info className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-warning-700">
                  <p className="font-medium mb-0.5">建议上传签收凭证</p>
                  <p className="opacity-80">
                    上传签收凭证可作为客户确认收货的法律依据，方便后续对账结算。
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 sticky bottom-0">
            <button onClick={onClose} className="btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="btn-success flex-1 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {proofImage ? '确认签收' : '确认签收（无凭证）'}
            </button>
          </div>
        </div>
      </div>

      {previewOpen && proofImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-8 animate-fade-in"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewOpen(false);
              }}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={proofImage}
              alt="签收凭证预览"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 flex justify-center">
              <a
                href={proofImage}
                download={`签收凭证_${task.order.orderNo}.png`}
                className="btn-primary gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                下载图片
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface TaskDetailModalProps {
  task: DispatchTask;
  onClose: () => void;
  onViewSheet: () => void;
}

function TaskDetailModal({ task, onClose, onViewSheet }: TaskDetailModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">任务详情</h3>
              <span className={TASK_STATUS_COLORS[task.status]}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-500" />
                订单信息
              </h4>
              <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-500">运单号</p>
                  <p className="text-sm font-semibold text-primary-600 mt-0.5">
                    {task.order.orderNo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">客户名称</p>
                  <p className="text-sm font-medium mt-0.5">
                    {task.order.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">运费</p>
                  <p className="text-sm font-semibold text-accent-600 mt-0.5">
                    {formatMoney(task.order.freight)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">货物名称</p>
                  <p className="text-sm mt-0.5">{task.order.goodsName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">重量</p>
                  <p className="text-sm mt-0.5">{formatWeight(task.order.weight)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">体积</p>
                  <p className="text-sm mt-0.5">{formatVolume(task.order.volume)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-success-500" />
                  装货信息
                </h4>
                <div className="bg-success-50/50 border border-success-100 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">装货地址</p>
                    <p className="text-sm mt-0.5">{task.order.pickupAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">联系人</p>
                      <p className="text-sm font-medium mt-0.5">
                        {task.order.pickupContact}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm mt-0.5">
                        {formatPhone(task.order.pickupPhone)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-danger-500" />
                  卸货信息
                </h4>
                <div className="bg-danger-50/50 border border-danger-100 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">卸货地址</p>
                    <p className="text-sm mt-0.5">{task.order.deliveryAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">联系人</p>
                      <p className="text-sm font-medium mt-0.5">
                        {task.order.deliveryContact}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm mt-0.5">
                        {formatPhone(task.order.deliveryPhone)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary-500" />
                  车辆信息
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">车牌号</p>
                      <p className="text-sm font-bold mt-0.5">
                        {task.vehicle.plateNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">车型</p>
                      <p className="text-sm mt-0.5">
                        {VEHICLE_TYPE_LABELS[task.vehicle.vehicleType]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">司机姓名</p>
                      <p className="text-sm font-medium mt-0.5">
                        {task.driverName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="text-sm mt-0.5">
                        {formatPhone(task.driverPhone)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4 text-accent-500" />
                  运输信息
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">预估里程</p>
                      <p className="text-sm font-bold text-primary-600 mt-0.5">
                        {formatDistance(task.estimatedDistance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">预估时长</p>
                      <p className="text-sm font-medium mt-0.5">
                        {formatDuration(task.estimatedDuration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">预计到达</p>
                      <p className="text-sm font-semibold text-accent-600 mt-0.5">
                        {formatDateTime(task.estimatedArrival)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">创建时间</p>
                    <p className="text-sm mt-0.5">
                      {formatDateTime(task.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                任务时间轴
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="relative">
                  <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />
                  <div className="space-y-1">
                    {NODE_ORDER.map((nodeType, idx) => {
                      const node = task.nodes.find((n) => n.nodeType === nodeType);
                      const isCompleted = !!node;
                      const completedTypes = task.nodes.map((n) => n.nodeType);
                      const isNext =
                        !isCompleted &&
                        (idx === 0 || completedTypes.includes(NODE_ORDER[idx - 1]));

                      return (
                        <div
                          key={nodeType}
                          className="relative flex items-start gap-3 py-2"
                        >
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? 'bg-success-500'
                                : isNext
                                ? 'bg-primary-500 ring-4 ring-primary-100'
                                : 'bg-gray-200'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <Circle
                                className={`w-3 h-3 ${
                                  isNext ? 'text-white' : 'text-gray-400'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${
                                  isCompleted
                                    ? 'text-gray-900'
                                    : isNext
                                    ? 'text-primary-700'
                                    : 'text-gray-400'
                                }`}
                              >
                                {NODE_TYPE_LABELS[nodeType]}
                              </span>
                              {isNext && <span className="badge-primary">进行中</span>}
                            </div>
                            {node && (
                              <div className="mt-1 text-xs text-gray-500">
                                <span>{formatDateTime(node.timestamp)}</span>
                                {node.location && <span className="mx-1">·</span>}
                                {node.location && <span>{node.location}</span>}
                                {node.remark && (
                                  <p className="mt-0.5 text-gray-400">
                                    备注：{node.remark}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {task.status === 'completed' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-primary-500" />
                  签收凭证
                </h4>
                {task.proofImageUrl ? (
                  <div className="relative group">
                    <img
                      src={task.proofImageUrl}
                      alt="签收凭证"
                      className="w-full max-h-80 object-contain bg-gray-100 rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => setImagePreview(task.proofImageUrl)}
                    />
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => setImagePreview(task.proofImageUrl)}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-white transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div
                      className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-success-500 text-white rounded text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      已上传签收凭证
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-warning-50 rounded-lg border border-warning-100">
                    <Info className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-warning-700">
                        该任务未上传签收凭证
                      </p>
                      <p className="text-xs text-warning-600 mt-0.5 opacity-80">
                        建议在完成签收时上传签收单、回单等凭证文件
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="btn-secondary flex-1">
              关闭
            </button>
            <button onClick={onViewSheet} className="btn-primary flex-1 gap-2">
              <FileText className="w-4 h-4" />
              查看派车单
            </button>
          </div>
        </div>
      </div>

      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-8 animate-fade-in"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImagePreview(null);
              }}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imagePreview}
              alt="签收凭证预览"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 flex justify-center">
              <a
                href={imagePreview}
                download={`签收凭证_${task.order.orderNo}.png`}
                className="btn-primary gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                下载图片
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface TaskCardProps {
  task: DispatchTask;
  onViewDetail: () => void;
  onViewSheet: () => void;
  onMarkNode: () => void;
  onCompleteSign: () => void;
}

function TaskCard({
  task,
  onViewDetail,
  onViewSheet,
  onMarkNode,
  onCompleteSign,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const completedNodeTypes = task.nodes.map((n) => n.nodeType);

  return (
    <div className="card p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 cursor-pointer" onClick={onViewDetail}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors">
              {task.order.orderNo}
            </span>
            <span className={TASK_STATUS_COLORS[task.status]}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
            {task.status === 'completed' && task.proofImageUrl && (
              <span className="badge-success flex items-center gap-1">
                <FileImage className="w-3 h-3" />
                有凭证
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail();
              }}
              className="ml-auto text-xs text-gray-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              详情
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{task.order.customerName}</p>
        </div>
        <span className="text-lg font-bold text-accent-600 ml-4">
          {formatMoney(task.order.freight)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div className="p-3 bg-success-50 rounded-lg border border-success-100">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-success-600 font-medium mb-0.5">装货地址</p>
                <p className="text-sm text-gray-800 line-clamp-2">
                  {task.order.pickupAddress}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {task.order.pickupContact} · {formatPhone(task.order.pickupPhone)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-danger-50 rounded-lg border border-danger-100">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-danger-600 font-medium mb-0.5">卸货地址</p>
                <p className="text-sm text-gray-800 line-clamp-2">
                  {task.order.deliveryAddress}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {task.order.deliveryContact} ·{' '}
                  {formatPhone(task.order.deliveryPhone)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-500" />
              <span className="text-gray-600">{task.vehicle.plateNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{task.driverName}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {formatDistance(task.estimatedDistance)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {formatDuration(task.estimatedDuration)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-accent-500" />
            <span className="text-gray-600">预计到达：</span>
            <span className="font-medium text-accent-600">
              {formatDateTime(task.estimatedArrival)}
            </span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                <Package className="w-4 h-4 text-gray-400" />
                {task.order.goodsName}
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Weight className="w-4 h-4 text-gray-400" />
                {formatWeight(task.order.weight)}
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                {formatVolume(task.order.volume)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">任务进度</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-ghost p-1 text-xs flex items-center gap-1"
          >
            {expanded ? (
              <>
                收起 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                展开详情 <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />
          <div className="space-y-1">
            {NODE_ORDER.map((nodeType, idx) => {
              const node = task.nodes.find((n) => n.nodeType === nodeType);
              const isCompleted = completedNodeTypes.includes(nodeType);
              const isNext =
                !isCompleted &&
                (idx === 0 || completedNodeTypes.includes(NODE_ORDER[idx - 1]));

              return (
                <div
                  key={nodeType}
                  className="relative flex items-start gap-3 py-1.5"
                >
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-success-500'
                        : isNext
                        ? 'bg-primary-500 ring-4 ring-primary-100'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Circle
                        className={`w-3 h-3 ${isNext ? 'text-white' : 'text-gray-400'}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isCompleted
                            ? 'text-gray-900'
                            : isNext
                            ? 'text-primary-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {NODE_TYPE_LABELS[nodeType]}
                      </span>
                      {isNext && <span className="badge-primary">进行中</span>}
                    </div>
                    {node && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span>{formatDateTime(node.timestamp)}</span>
                        {node.location && <span className="mx-1">·</span>}
                        {node.location && <span>{node.location}</span>}
                        {node.remark && (
                          <p className="mt-0.5 text-gray-400">备注：{node.remark}</p>
                        )}
                      </div>
                    )}
                    {!node && expanded && isNext && (
                      <p className="mt-1 text-xs text-primary-500">
                        点击"标记节点"记录当前状态
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
        <button onClick={onViewSheet} className="btn-secondary gap-1.5 flex-1">
          <FileText className="w-4 h-4" />
          派车单
        </button>
        <button
          onClick={onMarkNode}
          disabled={task.status === 'completed'}
          className="btn-primary gap-1.5 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-4 h-4" />
          标记节点
        </button>
        <button
          onClick={onCompleteSign}
          disabled={task.status === 'completed'}
          className="btn-success gap-1.5 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          {task.status === 'completed' ? '已签收' : '完成签收'}
        </button>
      </div>
    </div>
  );
}

export default function DriverTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTaskNode = useTaskStore((s) => s.addTaskNode);
  const completeTask = useTaskStore((s) => s.completeTask);
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [viewingSheetTask, setViewingSheetTask] = useState<DispatchTask | null>(null);
  const [viewingDetailTask, setViewingDetailTask] = useState<DispatchTask | null>(null);
  const [markingNodeTask, setMarkingNodeTask] = useState<DispatchTask | null>(null);
  const [completingTask, setCompletingTask] = useState<DispatchTask | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        return (
          task.order.orderNo.toLowerCase().includes(kw) ||
          task.order.customerName.toLowerCase().includes(kw) ||
          task.vehicle.plateNumber.toLowerCase().includes(kw) ||
          task.driverName.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [tasks, statusFilter, searchKeyword]);

  const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: TASK_STATUS_LABELS.pending },
    { value: 'loading', label: TASK_STATUS_LABELS.loading },
    { value: 'transit', label: TASK_STATUS_LABELS.transit },
    { value: 'delivering', label: TASK_STATUS_LABELS.delivering },
    { value: 'completed', label: TASK_STATUS_LABELS.completed },
    { value: 'exception', label: TASK_STATUS_LABELS.exception },
  ];

  const handleMarkNode = (
    nodeType: NodeType,
    location: string,
    remark?: string
  ) => {
    if (!markingNodeTask) return;
    addTaskNode(markingNodeTask.id, nodeType, location, remark);
    showToast(`节点「${NODE_TYPE_LABELS[nodeType]}」标记成功`, 'success');
    setMarkingNodeTask(null);
  };

  const handleCompleteSign = (proofImageUrl?: string) => {
    if (!completingTask) return;
    completeTask(completingTask.id, proofImageUrl);
    if (proofImageUrl) {
      showToast('签收完成，凭证已上传', 'success');
    } else {
      showToast('签收完成（未上传凭证）', 'info');
    }
    setCompletingTask(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">司机任务</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理运输任务，跟踪执行进度，上传签收凭证
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-1 flex-wrap">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索运单号、客户、车牌、司机"
                className="input pl-9"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        共 {filteredTasks.length} 个任务
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无符合条件的任务</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onViewDetail={() => setViewingDetailTask(task)}
              onViewSheet={() => setViewingSheetTask(task)}
              onMarkNode={() => setMarkingNodeTask(task)}
              onCompleteSign={() => setCompletingTask(task)}
            />
          ))}
        </div>
      )}

      {viewingSheetTask && (
        <DispatchSheetModal
          task={viewingSheetTask}
          onClose={() => setViewingSheetTask(null)}
        />
      )}

      {viewingDetailTask && (
        <TaskDetailModal
          task={viewingDetailTask}
          onClose={() => setViewingDetailTask(null)}
          onViewSheet={() => {
            setViewingSheetTask(viewingDetailTask);
            setViewingDetailTask(null);
          }}
        />
      )}

      {markingNodeTask && (
        <MarkNodeModal
          task={markingNodeTask}
          onClose={() => setMarkingNodeTask(null)}
          onConfirm={handleMarkNode}
        />
      )}

      {completingTask && (
        <CompleteSignModal
          task={completingTask}
          onClose={() => setCompletingTask(null)}
          onConfirm={handleCompleteSign}
        />
      )}
    </div>
  );
}
