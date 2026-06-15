import { Bell, Search, Calendar, User } from 'lucide-react';
import { useOrderStore } from '@/stores/orderStore';
import { useExceptionStore } from '@/stores/exceptionStore';
import { formatDate } from '@/utils/format';

export default function Header() {
  const orders = useOrderStore((s) => s.orders);
  const exceptions = useExceptionStore((s) => s.exceptions);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const pendingExceptions = exceptions.filter((e) => e.status !== 'resolved').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索运单号、车牌号、客户..."
            className="w-80 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 font-medium">{formatDate(new Date(), 'YYYY年MM月DD日')}</span>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {(pendingOrders + pendingExceptions) > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px font-bold rounded-full flex items-center justify-center">
              {pendingOrders + pendingExceptions}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
