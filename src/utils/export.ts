import * as XLSX from 'xlsx';
import type { DispatchTask, Order } from '@/types';
import { TASK_STATUS_LABELS, ORDER_STATUS_LABELS } from './constants';
import { formatDateTime, formatMoney } from './format';

function tasksToExportData(tasks: DispatchTask[]): any[] {
  return tasks.map((task) => {
    const hasDeliveryDone = task.nodes.some((n) => n.nodeType === 'delivery_done');
    const isSigned = task.status === 'completed' && task.proofImageUrl;

    let signStatus: string;
    if (isSigned) {
      signStatus = '已签收';
    } else if (task.status === 'completed' && !task.proofImageUrl) {
      signStatus = '已完成未签收';
    } else if (hasDeliveryDone) {
      signStatus = '待签收（已送达）';
    } else {
      signStatus = '未签收';
    }

    let proofStatus: string;
    if (isSigned) {
      proofStatus = '已上传回单';
    } else {
      proofStatus = '未上传回单';
    }

    return {
      '运单号': task.order.orderNo,
      '客户名称': task.order.customerName,
      '货物名称': task.order.goodsName,
      '重量(吨)': task.order.weight,
      '体积(方)': task.order.volume,
      '运费(元)': task.order.freight,
      '装货地址': task.order.pickupAddress,
      '装货联系人': task.order.pickupContact,
      '装货电话': task.order.pickupPhone,
      '卸货地址': task.order.deliveryAddress,
      '卸货联系人': task.order.deliveryContact,
      '卸货电话': task.order.deliveryPhone,
      '车牌号': task.vehicle.plateNumber,
      '司机姓名': task.driverName,
      '司机电话': task.driverPhone,
      '预估里程(km)': task.estimatedDistance,
      '预计到达': formatDateTime(task.estimatedArrival),
      '任务状态': TASK_STATUS_LABELS[task.status],
      '签收状态': signStatus,
      '签收凭证': proofStatus,
      '创建时间': formatDateTime(task.createdAt),
    };
  });
}

function ordersToExportData(orders: Order[]): any[] {
  return orders.map((order) => ({
    '运单号': order.orderNo,
    '客户名称': order.customerName,
    '货物名称': order.goodsName,
    '重量(吨)': order.weight,
    '体积(方)': order.volume,
    '运费(元)': order.freight,
    '装货地址': order.pickupAddress,
    '装货联系人': order.pickupContact,
    '装货电话': order.pickupPhone,
    '卸货地址': order.deliveryAddress,
    '卸货联系人': order.deliveryContact,
    '卸货电话': order.deliveryPhone,
    '订单状态': ORDER_STATUS_LABELS[order.status],
    '创建时间': formatDateTime(order.createdAt),
  }));
}

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToCSV(data: any[], fileName: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = String(row[header] ?? '');
        return value.includes(',') || value.includes('"') || value.includes('\n')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDispatchList(tasks: DispatchTask[], format: 'xlsx' | 'csv' = 'xlsx'): void {
  const data = tasksToExportData(tasks);
  const fileName = `调度清单_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'xlsx') {
    exportToExcel(data, fileName, '调度清单');
  } else {
    exportToCSV(data, fileName);
  }
}

export function exportOrderList(orders: Order[], format: 'xlsx' | 'csv' = 'xlsx'): void {
  const data = ordersToExportData(orders);
  const fileName = `订单列表_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'xlsx') {
    exportToExcel(data, fileName, '订单列表');
  } else {
    exportToCSV(data, fileName);
  }
}

export function generateDispatchSheet(task: DispatchTask): string {
  return `
═══════════════════════════════════════════
           物 流 派 车 单
═══════════════════════════════════════════

【运单信息】
运单号：${task.order.orderNo}
客户：${task.order.customerName}
货物：${task.order.goodsName}
重量：${task.order.weight}吨    体积：${task.order.volume}方
运费：${formatMoney(task.order.freight)}

【装货信息】
地址：${task.order.pickupAddress}
联系人：${task.order.pickupContact}
电话：${task.order.pickupPhone}

【卸货信息】
地址：${task.order.deliveryAddress}
联系人：${task.order.deliveryContact}
电话：${task.order.deliveryPhone}

【车辆与司机】
车牌号：${task.vehicle.plateNumber}
司机：${task.driverName}
电话：${task.driverPhone}

【运输信息】
预估里程：${task.estimatedDistance}km
预计到达：${formatDateTime(task.estimatedArrival)}

═══════════════════════════════════════════
      请司机按时到达，注意行车安全
═══════════════════════════════════════════
  `.trim();
}
