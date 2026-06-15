import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Wrench,
  X,
  Filter,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { useExceptionStore } from '@/stores/exceptionStore';
import { useTaskStore } from '@/stores/taskStore';
import type { ExceptionType, ExceptionStatus, DispatchTask } from '@/types';
import {
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_STATUS_LABELS,
  EXCEPTION_STATUS_COLORS,
} from '@/utils/constants';
import { formatDateTime } from '@/utils/format';

const EXCEPTION_TYPE_COLORS: Record<ExceptionType, string> = {
  congestion: 'badge-warning',
  damage: 'badge-danger',
  late: 'badge-primary',
  other: 'badge-gray',
};

export default function ExceptionHandler() {
  const exceptions = useExceptionStore((s) => s.exceptions);
  const addException = useExceptionStore((s) => s.addException);
  const updateExceptionStatus = useExceptionStore((s) => s.updateExceptionStatus);
  const tasks = useTaskStore((s) => s.tasks);

  const [typeFilter, setTypeFilter] = useState<ExceptionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [newExceptionType, setNewExceptionType] = useState<ExceptionType>('congestion');
  const [newExceptionDesc, setNewExceptionDesc] = useState('');

  const [detailException, setDetailException] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [handleRemark, setHandleRemark] = useState('');

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((ex) => {
      if (typeFilter !== 'all' && ex.type !== typeFilter) return false;
      if (statusFilter !== 'all' && ex.status !== statusFilter) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const task = tasks.find((t) => t.id === ex.taskId);
        const orderNo = task?.order.orderNo || '';
        return (
          ex.description.toLowerCase().includes(keyword) ||
          orderNo.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }, [exceptions, typeFilter, statusFilter, searchKeyword, tasks]);

  const availableTasks: DispatchTask[] = tasks.filter(
    (t) => t.status !== 'completed'
  );

  const handleCreateException = () => {
    if (!selectedTaskId || !newExceptionDesc.trim()) return;
    addException(selectedTaskId, newExceptionType, newExceptionDesc.trim());
    setIsModalOpen(false);
    setSelectedTaskId('');
    setNewExceptionType('congestion');
    setNewExceptionDesc('');
  };

  const handleStartProcess = (id: string) => {
    setProcessingId(id);
    setHandleRemark('');
  };

  const handleConfirmProcess = (id: string) => {
    updateExceptionStatus(id, 'processing', '当前调度员', handleRemark.trim() || undefined);
    setProcessingId(null);
    setHandleRemark('');
  };

  const handleResolve = (id: string) => {
    setProcessingId(id);
    setHandleRemark('');
    const ex = exceptions.find((e) => e.id === id);
    if (ex?.status === 'processing') {
      updateExceptionStatus(id, 'resolved', '当前调度员', '已解决');
      setProcessingId(null);
    }
  };

  const handleConfirmResolve = (id: string) => {
    updateExceptionStatus(id, 'resolved', '当前调度员', handleRemark.trim() || '已解决');
    setProcessingId(null);
    setHandleRemark('');
  };

  const getTaskByExceptionId = (taskId: string) => tasks.find((t) => t.id === taskId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">异常处理</h1>
          <p className="text-sm text-gray-500 mt-1">管理运输过程中的异常事件</p>
        </div>
        <button
          className="btn-primary gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          新建异常上报
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input w-36"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExceptionType | 'all')}
            >
              <option value="all">全部类型</option>
              {(Object.keys(EXCEPTION_TYPE_LABELS) as ExceptionType[]).map((type) => (
                <option key={type} value={type}>
                  {EXCEPTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <select
            className="input w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExceptionStatus | 'all')}
          >
            <option value="all">全部状态</option>
            {(Object.keys(EXCEPTION_STATUS_LABELS) as ExceptionStatus[]).map((status) => (
              <option key={status} value={status}>
                {EXCEPTION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="搜索异常描述或运单号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredExceptions.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-success-300" />
            <p className="mt-4 text-gray-500">暂无异常记录</p>
          </div>
        ) : (
          filteredExceptions.map((ex) => {
            const task = getTaskByExceptionId(ex.taskId);
            const isDetailOpen = detailException === ex.id;
            const isProcessing = processingId === ex.id;

            return (
              <div key={ex.id} className="card p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={EXCEPTION_TYPE_COLORS[ex.type]}>
                      {EXCEPTION_TYPE_LABELS[ex.type]}
                    </span>
                    <span className={EXCEPTION_STATUS_COLORS[ex.status]}>
                      {EXCEPTION_STATUS_LABELS[ex.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(ex.reportedAt)}
                  </div>
                </div>

                <p className="text-sm text-gray-900 font-medium mb-2">{ex.description}</p>

                {task && (
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    关联运单: <span className="text-primary-600 font-medium">{task.order.orderNo}</span>
                    <span className="mx-1">·</span>
                    {task.order.customerName}
                  </div>
                )}

                {(ex.handler || ex.handleRemark) && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs space-y-1">
                    {ex.handler && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <User className="w-3 h-3" />
                        处理人: {ex.handler}
                      </div>
                    )}
                    {ex.handleRemark && (
                      <div className="text-gray-600 pl-4">备注: {ex.handleRemark}</div>
                    )}
                    {ex.handledAt && (
                      <div className="text-gray-400 pl-4">
                        处理时间: {formatDateTime(ex.handledAt)}
                      </div>
                    )}
                  </div>
                )}

                {isDetailOpen && (
                  <div className="bg-primary-50 rounded-lg p-3 mb-3 text-xs text-primary-700 animate-fade-in">
                    <div className="font-medium mb-1">异常详情</div>
                    <div>异常ID: {ex.id}</div>
                    <div>上报时间: {formatDateTime(ex.reportedAt)}</div>
                    {task && (
                      <>
                        <div>车牌号: {task.vehicle.plateNumber}</div>
                        <div>司机: {task.driverName} ({task.driverPhone})</div>
                        <div>
                          路线: {task.order.pickupAddress} → {task.order.deliveryAddress}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isProcessing && (
                  <div className="mb-3 space-y-2 animate-fade-in">
                    <textarea
                      className="input text-xs"
                      rows={2}
                      placeholder="请输入处理备注..."
                      value={handleRemark}
                      onChange={(e) => setHandleRemark(e.target.value)}
                    />
                    <div className="flex gap-2">
                      {ex.status === 'pending' && (
                        <button
                          className="btn-accent text-xs px-3 py-1.5"
                          onClick={() => handleConfirmProcess(ex.id)}
                        >
                          确认处理中
                        </button>
                      )}
                      {(ex.status === 'pending' || ex.status === 'processing') && (
                        <button
                          className="btn-success text-xs px-3 py-1.5"
                          onClick={() => handleConfirmResolve(ex.id)}
                        >
                          标记已解决
                        </button>
                      )}
                      <button
                        className="btn-ghost text-xs px-3 py-1.5"
                        onClick={() => {
                          setProcessingId(null);
                          setHandleRemark('');
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {!isProcessing && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                    <button
                      className="btn-ghost text-xs px-3 py-1.5 gap-1"
                      onClick={() => setDetailException(isDetailOpen ? null : ex.id)}
                    >
                      <Eye className="w-3 h-3" />
                      {isDetailOpen ? '收起详情' : '查看详情'}
                    </button>
                    {ex.status === 'pending' && (
                      <button
                        className="btn-accent text-xs px-3 py-1.5 gap-1"
                        onClick={() => handleStartProcess(ex.id)}
                      >
                        <Wrench className="w-3 h-3" />
                        处理
                      </button>
                    )}
                    {ex.status === 'processing' && (
                      <button
                        className="btn-success text-xs px-3 py-1.5 gap-1"
                        onClick={() => handleResolve(ex.id)}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        标记已解决
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-danger-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-danger-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">新建异常上报</h2>
              </div>
              <button
                className="btn-ghost p-2"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTaskId('');
                  setNewExceptionType('congestion');
                  setNewExceptionDesc('');
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">选择任务</label>
                <select
                  className="input"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                >
                  <option value="">请选择关联的运输任务</option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.order.orderNo} - {task.order.customerName} ({task.vehicle.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">异常类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(EXCEPTION_TYPE_LABELS) as ExceptionType[]).map((type) => (
                    <button
                      key={type}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        newExceptionType === type
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                      onClick={() => setNewExceptionType(type)}
                    >
                      {EXCEPTION_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">异常描述</label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  placeholder="请详细描述异常情况..."
                  value={newExceptionDesc}
                  onChange={(e) => setNewExceptionDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTaskId('');
                  setNewExceptionType('congestion');
                  setNewExceptionDesc('');
                }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                disabled={!selectedTaskId || !newExceptionDesc.trim()}
                onClick={handleCreateException}
              >
                提交上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
