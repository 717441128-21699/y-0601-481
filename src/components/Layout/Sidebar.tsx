import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Truck, Route, UserCheck, AlertTriangle, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: '调度概览', icon: LayoutDashboard },
  { path: '/orders', label: '订单池', icon: Package },
  { path: '/vehicles', label: '车辆看板', icon: Truck },
  { path: '/dispatch', label: '线路规划', icon: Route },
  { path: '/tasks', label: '司机任务', icon: UserCheck },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-gradient-to-b from-primary-800 to-primary-900 text-white flex flex-col shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-primary-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">智运调度</h1>
            <p className="text-xs text-primary-200">Logistics Dispatch</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-primary-100/80 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-500 rounded-r-full" />
                  )}
                  <Icon className={cn('w-5 h-5 transition-transform', isActive && 'text-accent-400')} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className={cn(
                    'w-4 h-4 opacity-0 -translate-x-2 transition-all duration-200',
                    isActive ? 'opacity-100 translate-x-0 text-accent-400' : 'group-hover:opacity-50 group-hover:translate-x-0'
                  )} />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-700/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center font-semibold">
            李
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">调度员小李</p>
            <p className="text-xs text-primary-200/70 truncate">admin@logistics.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
