const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '重庆': { lat: 29.5630, lng: 106.5516 },
  '西安': { lat: 34.3416, lng: 108.9398 },
  '天津': { lat: 39.0842, lng: 117.2010 },
  '苏州': { lat: 31.2990, lng: 120.5853 },
  '郑州': { lat: 34.7466, lng: 113.6254 },
  '长沙': { lat: 28.2282, lng: 112.9388 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '济南': { lat: 36.6512, lng: 117.1201 },
  '合肥': { lat: 31.8206, lng: 117.2272 },
  '福州': { lat: 26.0745, lng: 119.2965 },
  '厦门': { lat: 24.4798, lng: 118.0894 },
  '昆明': { lat: 25.0389, lng: 102.7183 },
  '南昌': { lat: 28.6820, lng: 115.8579 },
  '沈阳': { lat: 41.8057, lng: 123.4315 },
  '大连': { lat: 38.9140, lng: 121.6147 },
  '石家庄': { lat: 38.0428, lng: 114.5149 },
  '太原': { lat: 37.8706, lng: 112.5489 },
  '长春': { lat: 43.8171, lng: 125.3235 },
  '哈尔滨': { lat: 45.8038, lng: 126.5349 },
  '南宁': { lat: 22.8170, lng: 108.3665 },
  '贵阳': { lat: 26.6470, lng: 106.6302 },
  '兰州': { lat: 36.0611, lng: 103.8343 },
  '乌鲁木齐': { lat: 43.8256, lng: 87.6168 },
  '呼和浩特': { lat: 40.8414, lng: 111.7519 },
  '银川': { lat: 38.4872, lng: 106.2309 },
  '西宁': { lat: 36.6171, lng: 101.7782 },
  '海口': { lat: 20.0440, lng: 110.1999 },
  '三亚': { lat: 18.2528, lng: 109.5120 },
  '宁波': { lat: 29.8683, lng: 121.5440 },
  '无锡': { lat: 31.4912, lng: 120.3119 },
  '温州': { lat: 27.9938, lng: 120.6994 },
  '佛山': { lat: 23.0218, lng: 113.1219 },
  '东莞': { lat: 23.0208, lng: 113.7518 },
  '中山': { lat: 22.5176, lng: 113.3928 },
  '珠海': { lat: 22.2707, lng: 113.5767 },
  '惠州': { lat: 23.1115, lng: 114.4153 },
  '江门': { lat: 22.5787, lng: 113.0818 },
  '常州': { lat: 31.7727, lng: 119.9469 },
  '徐州': { lat: 34.2617, lng: 117.1845 },
  '南通': { lat: 31.9801, lng: 120.8943 },
  '扬州': { lat: 32.3947, lng: 119.4129 },
  '绍兴': { lat: 30.0300, lng: 120.5800 },
  '嘉兴': { lat: 30.7466, lng: 120.7555 },
  '金华': { lat: 29.0785, lng: 119.6475 },
  '台州': { lat: 28.6564, lng: 121.4208 },
  '芜湖': { lat: 31.3528, lng: 118.4329 },
  '蚌埠': { lat: 32.9155, lng: 117.3893 },
  '洛阳': { lat: 34.6197, lng: 112.4540 },
  '襄阳': { lat: 32.0089, lng: 112.1215 },
  '宜昌': { lat: 30.6918, lng: 111.2864 },
  '岳阳': { lat: 29.3559, lng: 113.1325 },
  '常德': { lat: 29.0317, lng: 111.6983 },
  '衡阳': { lat: 26.8932, lng: 112.5717 },
  '赣州': { lat: 25.8310, lng: 114.9347 },
  '九江': { lat: 29.7058, lng: 116.0035 },
  '烟台': { lat: 37.4638, lng: 121.4480 },
  '潍坊': { lat: 36.7067, lng: 119.1617 },
  '淄博': { lat: 36.8131, lng: 118.0548 },
  '临沂': { lat: 35.1047, lng: 118.3564 },
  '威海': { lat: 37.5135, lng: 122.1215 },
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function extractCity(address: string): string | null {
  for (const city of Object.keys(CITY_COORDINATES)) {
    if (address.includes(city)) {
      return city;
    }
  }
  return null;
}

export function estimateDistance(pickupAddress: string, deliveryAddress: string): number {
  const pickupCity = extractCity(pickupAddress);
  const deliveryCity = extractCity(deliveryAddress);

  if (pickupCity && deliveryCity) {
    const p = CITY_COORDINATES[pickupCity];
    const d = CITY_COORDINATES[deliveryCity];
    const straight = haversineDistance(p.lat, p.lng, d.lat, d.lng);
    return Math.round(straight * 1.2);
  }

  return Math.round(50 + Math.random() * 800);
}

export function estimateDuration(distance: number, vehicleType: string): number {
  const speedMap: Record<string, number> = {
    van: 50,
    truck_4_2: 55,
    truck_6_8: 55,
    truck_9_6: 50,
    truck_13: 48,
    truck_17_5: 45,
  };
  const speed = speedMap[vehicleType] || 50;
  const driveTime = distance / speed;
  const loadUnloadTime = 2;
  return Math.round((driveTime + loadUnloadTime) * 10) / 10;
}

export function estimateArrival(durationHours: number): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + Math.round(durationHours * 60));
  return now.toISOString();
}
