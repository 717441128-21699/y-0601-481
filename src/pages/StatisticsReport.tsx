import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Package,
  CheckCircle2,
  DollarSign,
  Clock,
  AlertTriangle,
  Download,
  TrendingUp,
  Users,
  Truck,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useOrderStore } from '@/stores/orderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useExceptionStore } from '@/stores/exceptionStore';
import type { CustomerStat, VehicleStat, DispatchTask } from '@/types';
import { formatMoney, formatDistance } from '@/utils/format';
import { exportDispatchList } from '@/utils/export';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function StatisticsReport() {
  const tasks = useTaskStore((s) => s.tasks);
  const orders = useOrderStore((s) => s.orders);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const exceptions = useExceptionStore((s) => s.exceptions);
  const [activeTab, setActiveTab] = useState<'customer' | 'vehicle'>('customer');

  const stats = useMemo(() => {
    const notCancelledOrders = orders.filter((o) => o.status !== 'cancelled');

    const signedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.proofImageUrl
    );
    const inProgressTasks = tasks.filter((t) => {
      const hasDeliveryDone = t.nodes.some((n) => n.nodeType === 'delivery_done');
      return hasDeliveryDone && !(t.status === 'completed' && t.proofImageUrl);
    });

    const totalFreight = signedTasks.reduce(
      (sum, t) => sum + (t.order.freight || 0),
      0
    );
    const totalFreightAll = notCancelledOrders.reduce(
      (sum, o) => sum + (o.freight || 0),
      0
    );

    const onTimeTasks = signedTasks.filter((t) => {
      const doneNode = t.nodes.find((n) => n.nodeType === 'delivery_done');
      if (doneNode) {
        return new Date(doneNode.timestamp) <= new Date(t.estimatedArrival);
      }
      return true;
    });
    const onTimeRate =
      signedTasks.length > 0
        ? Math.round((onTimeTasks.length / signedTasks.length) * 1000) / 10
        : 0;

    const pendingExceptions = exceptions.filter(
      (e) => e.status !== 'resolved'
    ).length;

    return {
      totalOrders: notCancelledOrders.length,
      inProgressOrders: inProgressTasks.length,
      completedOrders: signedTasks.length,
      totalFreight: totalFreight,
      totalFreightAll: totalFreightAll,
      onTimeRate: onTimeRate,
      exceptionCount: pendingExceptions,
    };
  }, [tasks, orders, exceptions]);

  const byCustomerStats = useMemo<CustomerStat[]>(() => {
    const customerMap = new Map<string, CustomerStat>();
    const orderTaskMap = new Map<string, DispatchTask>();
    for (const task of tasks) {
      orderTaskMap.set(task.orderId, task);
    }

    for (const order of orders) {
      if (order.status === 'cancelled') continue;

      const key = order.customerId || order.customerName;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: order.customerId,
          customerName: order.customerName,
          orderCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          totalFreight: 0,
          completionRate: 0,
        });
      }
      const stat = customerMap.get(key)!;
      stat.orderCount += 1;
      stat.totalFreight += order.freight || 0;

      const task = orderTaskMap.get(order.id);
      if (task) {
        const isSigned = task.status === 'completed' && task.proofImageUrl;
        const hasDeliveryDone = task.nodes.some(
          (n) => n.nodeType === 'delivery_done'
        );
        if (isSigned) {
          stat.completedCount += 1;
        } else if (hasDeliveryDone) {
          stat.inProgressCount += 1;
        }
      }
    }

    return Array.from(customerMap.values())
      .map((s) => ({
        ...s,
        completionRate:
          s.orderCount > 0
            ? Math.round((s.completedCount / s.orderCount) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalFreight - a.totalFreight);
  }, [orders, tasks]);

  const byVehicleStats = useMemo<VehicleStat[]>(() => {
    const vehicleMap = new Map<string, VehicleStat>();

    for (const vehicle of vehicles) {
      vehicleMap.set(vehicle.id, {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        taskCount: 0,
        inProgressCount: 0,
        completedCount: 0,
        totalDistance: 0,
        totalFreight: 0,
        completionRate: 0,
      });
    }

    for (const task of tasks) {
      const stat = vehicleMap.get(task.vehicleId);
      if (!stat) {
        vehicleMap.set(task.vehicleId, {
          vehicleId: task.vehicleId,
          plateNumber: task.vehicle.plateNumber,
          taskCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          totalDistance: 0,
          totalFreight: 0,
          completionRate: 0,
        });
      }
      const s = vehicleMap.get(task.vehicleId)!;
      s.taskCount += 1;
      s.totalDistance += task.estimatedDistance || 0;
      s.totalFreight += task.order.freight || 0;

      const isSigned = task.status === 'completed' && task.proofImageUrl;
      const hasDeliveryDone = task.nodes.some(
        (n) => n.nodeType === 'delivery_done'
      );
      if (isSigned) {
        s.completedCount += 1;
      } else if (hasDeliveryDone) {
        s.inProgressCount += 1;
      }
    }

    return Array.from(vehicleMap.values())
      .filter((s) => s.taskCount > 0)
      .map((s) => ({
        ...s,
        completionRate:
          s.taskCount > 0
            ? Math.round((s.completedCount / s.taskCount) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalFreight - a.totalFreight);
  }, [tasks, vehicles]);

  const overallCompletionRate =
    stats.totalOrders > 0
      ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
      : 0;

  const statCards = [
    {
      label: '总订单数',
      value: stats.totalOrders,
      icon: Package,
      color: 'from-primary-500 to-primary-700',
      sub: '不含已取消',
    },
    {
      label: '进行中',
      value: stats.inProgressOrders,
      icon: Loader2,
      color: 'from-warning-500 to-warning-600',
      sub: '已送达待签收',
    },
    {
      label: '已签收完成',
      value: stats.completedOrders,
      icon: FileCheck,
      color: 'from-success-500 to-success-600',
      sub: `签收率 ${overallCompletionRate}%`,
    },
    {
      label: '已签收运费',
      value: formatMoney(stats.totalFreight),
      icon: DollarSign,
      color: 'from-accent-500 to-accent-600',
      sub: `总额 ${formatMoney(stats.totalFreightAll)}`,
    },
    {
      label: '准点率',
      value: `${stats.onTimeRate}%`,
      icon: Clock,
      color: 'from-primary-500 to-primary-700',
      sub: stats.onTimeRate >= 90 ? '表现优秀' : '持续关注',
    },
    {
      label: '待处理异常',
      value: stats.exceptionCount,
      icon: AlertTriangle,
      color: 'from-danger-500 to-danger-600',
      sub: stats.exceptionCount > 0 ? '及时处理' : '运行正常',
    },
  ];

  const barData = useMemo(() => {
    if (activeTab === 'customer') {
      return byCustomerStats.map((c) => ({
        name:
          c.customerName.length > 6
            ? c.customerName.slice(0, 6) + '...'
            : c.customerName,
        fullName: c.customerName,
        订单数: c.orderCount,
        进行中: c.inProgressCount,
        已签收: c.completedCount,
        运费: Math.round(c.totalFreight),
      }));
    }
    return byVehicleStats.map((v) => ({
      name: v.plateNumber,
      任务数: v.taskCount,
      进行中: v.inProgressCount,
      已签收: v.completedCount,
      运费: Math.round(v.totalFreight),
    }));
  }, [activeTab, byCustomerStats, byVehicleStats]);

  const pieData = useMemo(() => {
    if (activeTab === 'customer') {
      return byCustomerStats
        .filter((c) => c.totalFreight > 0)
        .map((c) => ({
          name: c.customerName,
          value: c.totalFreight,
        }));
    }
    return byVehicleStats
      .filter((v) => v.totalFreight > 0)
      .map((v) => ({
        name: v.plateNumber,
        value: v.totalFreight,
      }));
  }, [activeTab, byCustomerStats, byVehicleStats]);

  const handleExport = (format: 'xlsx' | 'csv') => {
    exportDispatchList(tasks, format);
  };

  const emptyData =
    (activeTab === 'customer' ? byCustomerStats : byVehicleStats)
      .length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">统计报表</h1>
            <span className="inline-flex items-center gap-1 text-xs text-success-600 bg-success-50 px-2 py-1 rounded-full">
              <RefreshCw className="w-3 h-3" />
              实时数据
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            按签收完成口径统计：需上传签收凭证才算完成，已送达未签收算进行中
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary gap-2"
            onClick={() => handleExport('csv')}
          >
            <FileText className="w-4 h-4" />
            导出 CSV
          </button>
          <button
            className="btn-primary gap-2"
            onClick={() => handleExport('xlsx')}
          >
            <FileSpreadsheet className="w-4 h-4" />
            导出 Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card p-5 card-hover">
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp
                  className={`w-4 h-4 ${
                    idx === 4
                      ? stats.exceptionCount > 0
                        ? 'text-danger-500'
                        : 'text-success-500'
                      : 'text-success-500'
                  }`}
                />
              </div>
              <div className="mt-4">
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">数据汇总</h2>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'customer'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('customer')}
            >
              <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              按客户汇总（{byCustomerStats.length}）
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'vehicle'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('vehicle')}
            >
              <Truck className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              按车辆汇总（{byVehicleStats.length}）
            </button>
          </div>
        </div>

        {emptyData ? (
          <div className="py-16 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              暂无{activeTab === 'customer' ? '客户' : '车辆'}统计数据
            </p>
            <p className="text-xs mt-1">
              创建订单和调度任务后数据将自动汇总
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {activeTab === 'customer' ? '客户订单与运费' : '车辆任务与运费'}
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#F3F4F6"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === '运费') return formatMoney(value);
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {activeTab === 'customer' ? (
                        <>
                          <Bar
                            dataKey="订单数"
                            fill="#2563EB"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="进行中"
                            fill="#F59E0B"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="已签收"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                          />
                        </>
                      ) : (
                        <>
                          <Bar
                            dataKey="任务数"
                            fill="#2563EB"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="进行中"
                            fill="#F59E0B"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="已签收"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                          />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  运费占比分布
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name.length > 4 ? name.slice(0, 4) + '...' : name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value) => (value.length > 6 ? value.slice(0, 6) + '...' : value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {activeTab === 'customer' ? (
                      <>
                        <th className="table-header">客户名称</th>
                        <th className="table-header">订单数</th>
                        <th className="table-header">进行中</th>
                        <th className="table-header">已签收</th>
                        <th className="table-header">签收率</th>
                        <th className="table-header">总运费</th>
                      </>
                    ) : (
                      <>
                        <th className="table-header">车牌号</th>
                        <th className="table-header">任务数</th>
                        <th className="table-header">进行中</th>
                        <th className="table-header">已签收</th>
                        <th className="table-header">总里程</th>
                        <th className="table-header">总运费</th>
                        <th className="table-header">签收率</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeTab === 'customer'
                    ? byCustomerStats.map((c) => (
                        <tr
                          key={c.customerId || c.customerName}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="table-cell font-medium">
                            {c.customerName}
                          </td>
                          <td className="table-cell">
                            <span className="font-semibold text-gray-800">
                              {c.orderCount}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-warning-600 font-medium">
                              {c.inProgressCount > 0 ? c.inProgressCount : '-'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-success-600 font-medium">
                              {c.completedCount > 0 ? c.completedCount : '-'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-success-500 rounded-full"
                                  style={{
                                    width: `${Math.min(c.completionRate, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600 w-10">
                                {c.completionRate}%
                              </span>
                            </div>
                          </td>
                          <td className="table-cell font-semibold text-accent-600">
                            {formatMoney(c.totalFreight)}
                          </td>
                        </tr>
                      ))
                    : byVehicleStats.map((v) => (
                        <tr
                          key={v.vehicleId}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="table-cell font-medium">
                            {v.plateNumber}
                          </td>
                          <td className="table-cell">
                            <span className="font-semibold text-gray-800">
                              {v.taskCount}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-warning-600 font-medium">
                              {v.inProgressCount > 0 ? v.inProgressCount : '-'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-success-600 font-medium">
                              {v.completedCount > 0 ? v.completedCount : '-'}
                            </span>
                          </td>
                          <td className="table-cell">
                            {formatDistance(v.totalDistance)}
                          </td>
                          <td className="table-cell font-semibold text-accent-600">
                            {formatMoney(v.totalFreight)}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-success-500 rounded-full"
                                  style={{
                                    width: `${Math.min(v.completionRate, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600 w-10">
                                {v.completionRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
