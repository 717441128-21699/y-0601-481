import { Package, Truck, Route, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useTaskStore } from '@/stores/taskStore';
import { useExceptionStore } from '@/stores/exceptionStore';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/utils/constants';
import { formatMoney, formatDateTime } from '@/utils/format';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const orders = useOrderStore((s) => s.orders);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const tasks = useTaskStore((s) => s.tasks);
  const exceptions = useExceptionStore((s) => s.exceptions);

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((t) => t.createdAt.slice(0, 10) === today);
  const idleVehicles = vehicles.filter((v) => v.status === 'idle');
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const pendingExceptions = exceptions.filter((e) => e.status !== 'resolved');

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalFreight = completedTasks.reduce((sum, t) => sum + t.order.freight, 0);

  const stats = [
    { label: '今日订单', value: orders.length, sub: `${pendingOrders.length} 待分配`, icon: Package, color: 'from-primary-500 to-primary-700', trend: 'up', trendValue: '+12%' },
    { label: '在途车辆', value: vehicles.filter((v) => v.status === 'transit').length, sub: `${idleVehicles.length} 空闲`, icon: Truck, color: 'from-accent-500 to-accent-600', trend: 'up', trendValue: '+3' },
    { label: '今日运费', value: formatMoney(totalFreight), sub: '已完成订单', icon: DollarSign, color: 'from-success-500 to-success-600', trend: 'up', trendValue: '+8.5%' },
    { label: '待处理异常', value: pendingExceptions.length, sub: '需及时跟进', icon: AlertTriangle, color: 'from-danger-500 to-danger-600', trend: 'down', trendValue: '-2' },
  ];

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">调度概览</h1>
          <p className="text-sm text-gray-500 mt-1">今日运营数据实时监控</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dispatch" className="btn-primary gap-2">
            <Route className="w-4 h-4" />
            开始调度
          </Link>
          <Link to="/orders" className="btn-secondary gap-2">
            <Package className="w-4 h-4" />
            录入订单
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card p-5 card-hover">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trendValue}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">车辆状态分布</h2>
            <Link to="/vehicles" className="text-sm text-primary-600 hover:text-primary-700 font-medium">查看全部 →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(['idle', 'transit', 'maintenance'] as const).map((status) => {
              const count = vehicles.filter((v) => v.status === status).length;
              const statusLabels: Record<string, string> = { idle: '空闲车辆', transit: '在途车辆', maintenance: '维修中' };
              const statusColors: Record<string, string> = { idle: 'bg-success-50 text-success-700 border-success-200', transit: 'bg-primary-50 text-primary-700 border-primary-200', maintenance: 'bg-danger-50 text-danger-700 border-danger-200' };
              return (
                <div key={status} className={`rounded-xl border-2 p-5 text-center ${statusColors[status]}`}>
                  <p className="text-4xl font-bold">{count}</p>
                  <p className="text-sm font-medium mt-1">{statusLabels[status]}</p>
                  <div className="mt-3 w-full bg-white/50 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status === 'idle' ? 'bg-success-500' : status === 'transit' ? 'bg-primary-500' : 'bg-danger-500'}`}
                      style={{ width: `${(count / vehicles.length) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">待处理异常</h2>
            <Link to="/exceptions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">全部 →</Link>
          </div>
          <div className="space-y-3">
            {pendingExceptions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success-400" />
                <p className="text-sm">暂无待处理异常</p>
              </div>
            ) : (
              pendingExceptions.slice(0, 4).map((ex) => (
                <div key={ex.id} className="p-3 bg-danger-50 rounded-lg border border-danger-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-danger-800 truncate">{ex.description}</p>
                      <p className="text-xs text-danger-500 mt-1">{formatDateTime(ex.reportedAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">最近任务</h2>
          <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">查看全部任务 →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">运单号</th>
                <th className="table-header">客户</th>
                <th className="table-header">车辆/司机</th>
                <th className="table-header">运输路线</th>
                <th className="table-header">预计到达</th>
                <th className="table-header">运费</th>
                <th className="table-header">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="table-cell font-medium text-primary-600">{task.order.orderNo}</td>
                  <td className="table-cell">{task.order.customerName}</td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{task.vehicle.plateNumber}</p>
                      <p className="text-xs text-gray-500">{task.driverName}</p>
                    </div>
                  </td>
                  <td className="table-cell max-w-[200px]">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span className="truncate">{task.order.pickupAddress.slice(0, 6)}...</span>
                      <span className="text-gray-400">→</span>
                      <span className="truncate">{task.order.deliveryAddress.slice(0, 6)}...</span>
                    </div>
                  </td>
                  <td className="table-cell text-sm text-gray-600">{formatDateTime(task.estimatedArrival)}</td>
                  <td className="table-cell font-semibold text-accent-600">{formatMoney(task.order.freight)}</td>
                  <td className="table-cell">
                    <span className={TASK_STATUS_COLORS[task.status]}>{TASK_STATUS_LABELS[task.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
