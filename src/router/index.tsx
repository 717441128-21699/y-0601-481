import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/Layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import OrderPool from '@/pages/OrderPool';
import VehicleBoard from '@/pages/VehicleBoard';
import RoutePlanning from '@/pages/RoutePlanning';
import DriverTasks from '@/pages/DriverTasks';
import ExceptionHandler from '@/pages/ExceptionHandler';
import StatisticsReport from '@/pages/StatisticsReport';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/orders', element: <OrderPool /> },
      { path: '/vehicles', element: <VehicleBoard /> },
      { path: '/dispatch', element: <RoutePlanning /> },
      { path: '/tasks', element: <DriverTasks /> },
      { path: '/exceptions', element: <ExceptionHandler /> },
      { path: '/reports', element: <StatisticsReport /> },
    ],
  },
]);
