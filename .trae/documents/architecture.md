## 1. 架构设计

```mermaid
flowchart TD
    A["前端应用 (React + Vite)"] --> B["UI 组件层"]
    B --> C["页面组件 (6个核心页面)"]
    B --> D["通用组件 (表格/卡片/表单/筛选器)"]
    A --> E["状态管理层 (Zustand)"]
    E --> F["订单数据 Store"]
    E --> G["车辆数据 Store"]
    E --> H["任务调度 Store"]
    A --> I["工具函数层"]
    I --> J["里程/时间估算"]
    I --> K["数据导出 (CSV/Excel)"]
    I --> L["日期格式化"]
    A --> M["Mock 数据层"]
    M --> N["订单 Mock 数据"]
    M --> O["车辆 Mock 数据"]
    M --> P["统计数据 Mock"]

    style A fill:#1E40AF,color:#fff
    style E fill:#F97316,color:#fff
```

## 2. 技术说明
- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite
- **样式方案**：TailwindCSS@3
- **状态管理**：Zustand
- **路由**：React Router DOM
- **图标库**：Lucide React
- **拖拽库**：@dnd-kit/core + @dnd-kit/sortable
- **图表库**：Recharts
- **数据导出**：xlsx (SheetJS)
- **后端**：无（纯前端，使用 Mock 数据）
- **初始化工具**：vite-init

## 3. 路由定义
| 路由 | 页面 | 用途 |
|------|------|------|
| / | Dashboard | 系统概览，快捷入口 |
| /orders | 订单池 | 运单管理与批量录入 |
| /vehicles | 车辆看板 | 车辆状态展示与筛选 |
| /dispatch | 线路规划 | 拖拽分配、路线估算 |
| /tasks | 司机任务 | 派车单与任务节点管理 |
| /exceptions | 异常处理 | 异常上报与跟踪 |
| /reports | 统计报表 | 运费汇总、完成率、数据导出 |

## 4. 数据模型

### 4.1 实体关系图

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : "拥有"
    VEHICLE ||--o{ DISPATCH_TASK : "执行"
    DRIVER ||--o{ DISPATCH_TASK : "执行"
    ORDER ||--|| DISPATCH_TASK : "关联"
    DISPATCH_TASK ||--o{ TASK_NODE : "包含"
    DISPATCH_TASK ||--o{ EXCEPTION : "产生"

    CUSTOMER {
        string id PK "客户ID"
        string name "客户名称"
        string contact "联系人"
        string phone "联系电话"
        string address "地址"
    }

    VEHICLE {
        string id PK "车辆ID"
        string plateNumber "车牌号"
        string vehicleType "车型"
        number capacity "载重(吨)"
        string status "状态: idle/transit/maintenance"
        string driverId FK "当前司机ID"
    }

    DRIVER {
        string id PK "司机ID"
        string name "司机姓名"
        string phone "联系电话"
        string licenseType "驾照类型"
    }

    ORDER {
        string id PK "订单ID"
        string orderNo "运单号"
        string customerId FK "客户ID"
        string pickupAddress "装货地址"
        string pickupContact "装货联系人"
        string pickupPhone "装货电话"
        string deliveryAddress "卸货地址"
        string deliveryContact "卸货联系人"
        string deliveryPhone "卸货电话"
        string goodsName "货物名称"
        number weight "重量(吨)"
        number volume "体积(方)"
        number freight "运费(元)"
        string status "状态: pending/assigned/loading/transit/delivered/completed/cancelled"
        date createdAt "创建时间"
    }

    DISPATCH_TASK {
        string id PK "任务ID"
        string orderId FK "订单ID"
        string vehicleId FK "车辆ID"
        string driverId FK "司机ID"
        number estimatedDistance "预估里程(km)"
        number estimatedDuration "预估时长(小时)"
        datetime estimatedArrival "预计到达时间"
        string status "任务状态"
        datetime createdAt "创建时间"
    }

    TASK_NODE {
        string id PK "节点ID"
        string taskId FK "任务ID"
        string nodeType "节点类型: pickup_start/pickup_done/transit/delivery_start/delivery_done"
        string location "位置"
        datetime timestamp "时间戳"
        string remark "备注"
    }

    EXCEPTION {
        string id PK "异常ID"
        string taskId FK "任务ID"
        string type "异常类型: congestion/damage/late/other"
        string description "异常描述"
        string status "处理状态: pending/processing/resolved"
        string images "图片URL列表(JSON)"
        datetime reportedAt "上报时间"
        string handler "处理人"
    }
```

### 4.2 TypeScript 类型定义

```typescript
// 订单类型
export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  pickupAddress: string;
  pickupContact: string;
  pickupPhone: string;
  deliveryAddress: string;
  deliveryContact: string;
  deliveryPhone: string;
  goodsName: string;
  weight: number;
  volume: number;
  freight: number;
  status: OrderStatus;
  createdAt: string;
  taskId?: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'loading' | 'transit' | 'delivered' | 'completed' | 'cancelled';

// 车辆类型
export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  status: VehicleStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  currentLocation?: string;
  nextMaintenanceDate?: string;
}

export type VehicleType = 'van' | 'truck_4_2' | 'truck_6_8' | 'truck_9_6' | 'truck_13' | 'truck_17_5';
export type VehicleStatus = 'idle' | 'transit' | 'maintenance';

// 调度任务类型
export interface DispatchTask {
  id: string;
  orderId: string;
  order: Order;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driverName: string;
  driverPhone: string;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedArrival: string;
  status: TaskStatus;
  nodes: TaskNode[];
  exceptions: ExceptionRecord[];
  createdAt: string;
  proofImageUrl?: string;
}

export type TaskStatus = 'pending' | 'loading' | 'transit' | 'delivering' | 'completed' | 'exception';

// 任务节点
export interface TaskNode {
  id: string;
  taskId: string;
  nodeType: NodeType;
  location: string;
  timestamp: string;
  remark?: string;
}

export type NodeType = 'pickup_start' | 'pickup_done' | 'transit_checkpoint' | 'delivery_start' | 'delivery_done';

// 异常记录
export interface ExceptionRecord {
  id: string;
  taskId: string;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  images: string[];
  reportedAt: string;
  handler?: string;
  handleRemark?: string;
  handledAt?: string;
}

export type ExceptionType = 'congestion' | 'damage' | 'late' | 'other';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

// 客户类型
export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
}

// 统计数据类型
export interface StatisticsData {
  totalOrders: number;
  completedOrders: number;
  totalFreight: number;
  onTimeRate: number;
  exceptionCount: number;
  byCustomer: CustomerStat[];
  byVehicle: VehicleStat[];
}

export interface CustomerStat {
  customerId: string;
  customerName: string;
  orderCount: number;
  completedCount: number;
  totalFreight: number;
  completionRate: number;
}

export interface VehicleStat {
  vehicleId: string;
  plateNumber: string;
  taskCount: number;
  completedCount: number;
  totalDistance: number;
  totalFreight: number;
  completionRate: number;
}
```

## 5. 项目目录结构

```
src/
├── components/          # 通用组件
│   ├── Layout/          # 布局组件
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppLayout.tsx
│   ├── Order/           # 订单相关组件
│   │   ├── OrderCard.tsx
│   │   ├── OrderTable.tsx
│   │   └── OrderBatchImport.tsx
│   ├── Vehicle/         # 车辆相关组件
│   │   ├── VehicleCard.tsx
│   │   ├── VehicleKanban.tsx
│   │   └── VehicleFilter.tsx
│   ├── Dispatch/        # 调度相关组件
│   │   ├── DraggableOrder.tsx
│   │   ├── VehicleDropZone.tsx
│   │   └── RouteEstimator.tsx
│   ├── Task/            # 任务相关组件
│   │   ├── DispatchSheet.tsx
│   │   └── TaskTimeline.tsx
│   ├── Exception/       # 异常相关组件
│   │   ├── ExceptionForm.tsx
│   │   └── ExceptionList.tsx
│   └── Report/          # 报表相关组件
│       ├── FreightChart.tsx
│       ├── CompletionRateChart.tsx
│       └── ExportButton.tsx
├── pages/               # 页面组件
│   ├── Dashboard.tsx
│   ├── OrderPool.tsx
│   ├── VehicleBoard.tsx
│   ├── RoutePlanning.tsx
│   ├── DriverTasks.tsx
│   ├── ExceptionHandler.tsx
│   └── StatisticsReport.tsx
├── stores/              # Zustand 状态管理
│   ├── orderStore.ts
│   ├── vehicleStore.ts
│   ├── taskStore.ts
│   └── exceptionStore.ts
├── mock/                # Mock 数据
│   ├── orders.ts
│   ├── vehicles.ts
│   ├── tasks.ts
│   ├── customers.ts
│   └── statistics.ts
├── utils/               # 工具函数
│   ├── distance.ts      # 里程估算
│   ├── export.ts        # 数据导出
│   ├── format.ts        # 格式化
│   └── constants.ts     # 常量定义
├── types/               # 类型定义
│   └── index.ts
├── router/              # 路由配置
│   └── index.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## 6. 核心功能实现说明

### 6.1 拖拽分配（线路规划）
- 使用 @dnd-kit/core 实现拖拽功能
- 订单卡片为可拖拽源（Draggable）
- 车辆卡片为放置目标（Droppable）
- 拖拽完成后自动创建调度任务，关联订单与车辆

### 6.2 里程与 ETA 估算
- 基于城市坐标的简化距离计算（Haversine 公式）
- 根据里程和车型平均速度估算运输时长
- 考虑装卸货时间（默认各 1 小时）
- 输出预估里程、时长、预计到达时间

### 6.3 数据导出
- 使用 xlsx 库生成 Excel 文件
- 支持 CSV 和 XLSX 两种格式
- 导出当日所有调度任务及订单信息
- 导出内容包含：运单号、客户、车辆、司机、装卸地址、运费、状态等

### 6.4 状态管理
- 使用 Zustand 管理全局状态
- 订单、车辆、任务、异常分别独立 Store
- 支持跨组件状态共享与更新
- 内置 Mock 数据初始化
