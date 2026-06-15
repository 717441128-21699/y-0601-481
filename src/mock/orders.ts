import type { Order } from '@/types';
import { generateOrderNo } from '@/utils/format';

const today = new Date();

function hoursAgo(hours: number): string {
  const d = new Date(today);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const mockOrders: Order[] = [
  { id: 'o1', orderNo: generateOrderNo(), customerId: 'c1', customerName: '华盛电子科技', pickupAddress: '上海市浦东新区张江高科技园区科苑路88号', pickupContact: '张经理', pickupPhone: '13800138001', deliveryAddress: '江苏省南京市江宁区滨江开发区盛安大道777号', deliveryContact: '李主管', deliveryPhone: '13800138021', goodsName: '电子元器件', weight: 3.5, volume: 8, freight: 1800, status: 'pending', createdAt: hoursAgo(2) },
  { id: 'o2', orderNo: generateOrderNo(), customerId: 'c2', customerName: '恒达建材有限公司', pickupAddress: '江苏省南京市江宁区滨江开发区丽水大街999号', pickupContact: '李总', pickupPhone: '13800138002', deliveryAddress: '上海市嘉定区安亭镇昌吉路200号', deliveryContact: '王经理', deliveryPhone: '13800138022', goodsName: '建筑钢材', weight: 8, volume: 15, freight: 2200, status: 'pending', createdAt: hoursAgo(3) },
  { id: 'o3', orderNo: generateOrderNo(), customerId: 'c3', customerName: '美佳食品集团', pickupAddress: '浙江省杭州市萧山区经济开发区市心北路158号', pickupContact: '王主任', pickupPhone: '13800138003', deliveryAddress: '上海市松江区九亭镇九新公路333号', deliveryContact: '赵主管', deliveryPhone: '13800138023', goodsName: '速冻食品', weight: 2, volume: 12, freight: 1500, status: 'assigned', createdAt: hoursAgo(4), taskId: 't1' },
  { id: 'o4', orderNo: generateOrderNo(), customerId: 'c4', customerName: '顺通机械制造', pickupAddress: '广东省深圳市宝安区福永街道凤凰大道66号', pickupContact: '赵工', pickupPhone: '13800138004', deliveryAddress: '上海市浦东新区临港新城重装备产业区', deliveryContact: '刘工程师', deliveryPhone: '13800138024', goodsName: '机床设备', weight: 15, volume: 30, freight: 6800, status: 'loading', createdAt: hoursAgo(5), taskId: 't2' },
  { id: 'o5', orderNo: generateOrderNo(), customerId: 'c5', customerName: '祥云纺织服装', pickupAddress: '江苏省苏州市工业园区星湖街218号', pickupContact: '刘经理', pickupPhone: '13800138005', deliveryAddress: '浙江省杭州市余杭区临平街道振兴西路128号', deliveryContact: '陈经理', deliveryPhone: '13800138025', goodsName: '服装面料', weight: 1.5, volume: 20, freight: 1200, status: 'transit', createdAt: hoursAgo(6), taskId: 't3' },
  { id: 'o6', orderNo: generateOrderNo(), customerId: 'c6', customerName: '康泰医药集团', pickupAddress: '北京市大兴区生物医药基地天富大街19号', pickupContact: '陈总', pickupPhone: '13800138006', deliveryAddress: '上海市徐汇区枫林路305号中山医院', deliveryContact: '周主任', deliveryPhone: '13800138026', goodsName: '医用药品', weight: 0.8, volume: 3, freight: 3500, status: 'completed', createdAt: hoursAgo(10), taskId: 't4' },
  { id: 'o7', orderNo: generateOrderNo(), customerId: 'c7', customerName: '远大化工股份', pickupAddress: '山东省淄博市齐鲁化学工业区清田路12号', pickupContact: '孙主任', pickupPhone: '13800138007', deliveryAddress: '上海市金山区第二工业区金环路88号', deliveryContact: '吴主管', deliveryPhone: '13800138027', goodsName: '化工原料', weight: 25, volume: 40, freight: 5500, status: 'pending', createdAt: hoursAgo(1) },
  { id: 'o8', orderNo: generateOrderNo(), customerId: 'c8', customerName: '万家福连锁超市', pickupAddress: '湖北省武汉市东西湖区走马岭街道办事处', pickupContact: '周经理', pickupPhone: '13800138008', deliveryAddress: '上海市青浦区华新镇华腾公路318号', deliveryContact: '郑店长', deliveryPhone: '13800138028', goodsName: '日用百货', weight: 4, volume: 18, freight: 4200, status: 'pending', createdAt: hoursAgo(1.5) },
  { id: 'o9', orderNo: generateOrderNo(), customerId: 'c1', customerName: '华盛电子科技', pickupAddress: '上海市浦东新区张江高科技园区祖冲之路2000号', pickupContact: '张经理', pickupPhone: '13800138001', deliveryAddress: '北京市海淀区中关村大街27号', deliveryContact: '李经理', deliveryPhone: '13800138029', goodsName: '服务器设备', weight: 6, volume: 10, freight: 4500, status: 'cancelled', createdAt: hoursAgo(12) },
  { id: 'o10', orderNo: generateOrderNo(), customerId: 'c3', customerName: '美佳食品集团', pickupAddress: '浙江省杭州市萧山区宁围街道市心北路1000号', pickupContact: '王主任', pickupPhone: '13800138003', deliveryAddress: '上海市闵行区虹梅南路3500号', deliveryContact: '沈经理', deliveryPhone: '13800138030', goodsName: '休闲零食', weight: 1.2, volume: 6, freight: 950, status: 'delivered', createdAt: hoursAgo(8), taskId: 't5' },
  { id: 'o11', orderNo: generateOrderNo(), customerId: 'c2', customerName: '恒达建材有限公司', pickupAddress: '江苏省南京市江宁区秣陵街道清水亭西路2号', pickupContact: '李总', pickupPhone: '13800138002', deliveryAddress: '上海市奉贤区金汇镇金闸公路1000号', deliveryContact: '韩工', deliveryPhone: '13800138031', goodsName: '水泥管道', weight: 12, volume: 25, freight: 2800, status: 'pending', createdAt: hoursAgo(0.5) },
  { id: 'o12', orderNo: generateOrderNo(), customerId: 'c5', customerName: '祥云纺织服装', pickupAddress: '江苏省苏州市吴江区盛泽镇舜湖西路555号', pickupContact: '刘经理', pickupPhone: '13800138005', deliveryAddress: '上海市长宁区天山路789号', deliveryContact: '冯经理', deliveryPhone: '13800138032', goodsName: '成品服装', weight: 2, volume: 15, freight: 1300, status: 'pending', createdAt: hoursAgo(0.8) },
];
