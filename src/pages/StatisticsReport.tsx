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
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useOrderStore } from '@/stores/orderStore';
import { mockStatistics } from '@/mock/statistics';
import type { CustomerStat, VehicleStat } from '@/types';
import { formatMoney, formatDistance } from '@/utils/format';
import { exportDispatchList } from '@/utils/export';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function StatisticsReport() {
  const tasks = useTaskStore((s) => s.tasks);
  const orders = useOrderStore((s) => s.orders);
  const [activeTab, setActiveTab] = useState<'customer' | 'vehicle'>('customer');

  const stats = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const totalFreight = completedTasks.reduce((sum, t) => sum + t.order.freight, 0);
    const exceptionCount = tasks.filter((t) => t.status === 'exception').length;
    const onTimeTasks = tasks.filter(
      (t) => t.status === 'completed' && new Date(t.estimatedArrival) >= new Date(t.createdAt)
    );
    const onTimeRate =
      completedTasks.length > 0
        ? Math.round((onTimeTasks.length / completedTasks.length) * 1000) / 10
        : mockStatistics.onTimeRate;

    return {
      totalOrders: orders.length || mockStatistics.totalOrders,
      completedOrders: completedOrders.length || mockStatistics.completedOrders,
      totalFreight: totalFreight || mockStatistics.totalFreight,
      onTimeRate: onTimeRate || mockStatistics.onTimeRate,
      exceptionCount: exceptionCount || mockStatistics.exceptionCount,
    };
  }, [tasks, orders]);

  const statCards = [
    {
      label: '总订单数',
      value: stats.totalOrders,
      icon: Package,
      color: 'from-primary-500 to-primary-700',
      sub: '全部订单',
    },
    {
      label: '已完成数',
      value: stats.completedOrders,
      icon: CheckCircle2,
      color: 'from-success-500 to-success-600',
      sub: `完成率 ${stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%`,
    },
    {
      label: '总运费',
      value: formatMoney(stats.totalFreight),
      icon: DollarSign,
      color: 'from-accent-500 to-accent-600',
      sub: '已完成订单运费',
    },
    {
      label: '准点率',
      value: `${stats.onTimeRate}%`,
      icon: Clock,
      color: 'from-primary-500 to-primary-700',
      sub: '按时送达比例',
    },
    {
      label: '异常数',
      value: stats.exceptionCount,
      icon: AlertTriangle,
      color: 'from-danger-500 to-danger-600',
      sub: '待处理/处理中',
    },
  ];

  const barData = useMemo(() => {
    if (activeTab === 'customer') {
      return mockStatistics.byCustomer.map((c: CustomerStat) => ({
        name: c.customerName.length > 6 ? c.customerName.slice(0, 6) + '...' : c.customerName,
        订单数: c.orderCount,
        已完成: c.completedCount,
        运费: Math.round(c.totalFreight / 100) * 100,
      }));
    }
    return mockStatistics.byVehicle.map((v: VehicleStat) => ({
      name: v.plateNumber,
      任务数: v.taskCount,
      已完成: v.completedCount,
      运费: Math.round(v.totalFreight / 100) * 100,
    }));
  }, [activeTab]);

  const pieData = useMemo(() => {
    if (activeTab === 'customer') {
      return mockStatistics.byCustomer.map((c: CustomerStat) => ({
        name: c.customerName,
        value: c.totalFreight,
      }));
    }
    return mockStatistics.byVehicle.map((v: VehicleStat) => ({
      name: v.plateNumber,
      value: v.totalFreight,
    }));
  }, [activeTab]);

  const handleExport = (format: 'xlsx' | 'csv') => {
    exportDispatchList(tasks, format);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计报表</h1>
          <p className="text-sm text-gray-500 mt-1">运营数据统计与分析</p>
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

      <div className="grid grid-cols-5 gap-5">
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
                <TrendingUp className="w-4 h-4 text-success-500" />
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
              按客户汇总
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
              按车辆汇总
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              运费分布
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="运费" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              运费占比
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
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
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
                    <th className="table-header">已完成</th>
                    <th className="table-header">完成率</th>
                    <th className="table-header">总运费</th>
                  </>
                ) : (
                  <>
                    <th className="table-header">车牌号</th>
                    <th className="table-header">任务数</th>
                    <th className="table-header">已完成</th>
                    <th className="table-header">总里程</th>
                    <th className="table-header">总运费</th>
                    <th className="table-header">完成率</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'customer'
                ? mockStatistics.byCustomer.map((c: CustomerStat) => (
                    <tr key={c.customerId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="table-cell font-medium">{c.customerName}</td>
                      <td className="table-cell">{c.orderCount}</td>
                      <td className="table-cell">
                        <span className="text-success-600 font-medium">{c.completedCount}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success-500 rounded-full"
                              style={{ width: `${c.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{c.completionRate}%</span>
                        </div>
                      </td>
                      <td className="table-cell font-semibold text-accent-600">
                        {formatMoney(c.totalFreight)}
                      </td>
                    </tr>
                  ))
                : mockStatistics.byVehicle.map((v: VehicleStat) => (
                    <tr key={v.vehicleId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="table-cell font-medium">{v.plateNumber}</td>
                      <td className="table-cell">{v.taskCount}</td>
                      <td className="table-cell">
                        <span className="text-success-600 font-medium">{v.completedCount}</span>
                      </td>
                      <td className="table-cell">{formatDistance(v.totalDistance)}</td>
                      <td className="table-cell font-semibold text-accent-600">
                        {formatMoney(v.totalFreight)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success-500 rounded-full"
                              style={{ width: `${v.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{v.completionRate}%</span>
                        </div>
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
