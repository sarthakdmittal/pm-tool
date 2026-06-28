export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  clientName?: string;
  location?: string;
  projectCode?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on_hold' | 'delayed';
  createdAt: string;
  overallCompletion?: number;
  totalContractValue?: number;
}

export interface Payment {
  _id: string;
  project: string;
  invoiceNumber?: string;
  description?: string;
  amount: number;
  paymentDate?: string;
  dueDate?: string;
  status: 'pending' | 'received' | 'overdue';
  notes?: string;
}

export interface Phase {
  _id: string;
  project: string;
  phaseName: 'supply' | 'installation' | 'testing' | 'handover';
  startDate: string;
  endDate: string;
  completionPercent: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
}

export interface Material {
  _id: string;
  project: string;
  sNo?: number;
  description: string;
  orderedQty?: number;
  unit?: string;
  billedQty?: number;
  invoicedNumber?: string;
  completionStatus?: string;
  executedQty?: number;
  remainingQty?: number;
  expectedClosureSchedule?: string;
  dependencyIfAny?: string;
  ownership?: string;
  expectedResolutionTime?: string;
  remarks?: string;
  isClosed?: boolean;
}

export interface ActiveDevice {
  _id: string;
  project: string;
  sNo?: number;
  areaLocation: string;
  deviceItems: { itemName: string; quantity: number }[];
}

export interface ActiveDeviceColumn {
  _id: string;
  project: string;
  columns: string[];
}

export interface EPBAXItem {
  _id: string;
  project: string;
  slNo?: number;
  location: string;
  installationStatus?: string;
  handoverStatus?: string;
  pendingWork?: string;
  remarks?: string;
}

export interface PassiveItem {
  _id: string;
  project: string;
  slNo?: number;
  location: string;
  cablingAllocated: number;
  cablingCompleted: number;
  cablingVendor?: string;
  remarks?: string;
  completionPercent?: number;
}

export interface Task {
  _id: string;
  project: string;
  phase?: string;
  phaseName?: string;
  name: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'done' | 'overdue';
  completionPercent: number;
}

export interface MaterialStats {
  total: number;
  closed: number;
  open: number;
  totalOrdered: number;
  totalExecuted: number;
  totalBilled: number;
  completionPercent: number;
}

export interface PassiveStats {
  totalAllocated: number;
  totalCompleted: number;
  count: number;
  completionPercent: number;
}

export interface EPBAXStats {
  total: number;
  installedCount: number;
  handedOverCount: number;
}

export interface DeviceTypeStat {
  installed: number;
  remaining: number;
  completionPercent: number;
}

export interface ActiveDeviceStats {
  totalLocations: number;
  totalDevicesInstalled: number;
  columns: string[];
  columnTotals: Record<string, number>;
  deviceStats: Record<string, DeviceTypeStat>;
  activeDeviceCompletionPercent?: number;
}

export interface PaymentStats {
  totalContract: number;
  totalReceived: number;
  percentPaid: number;
}

export interface ProjectStats {
  overallCompletion: number;
  expectedCompletion: number;
  isOnTrack: boolean;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  phases: Phase[];
  taskStats: {
    total: number;
    done: number;
    overdue: number;
    inProgress: number;
    pending: number;
  };
  materialStats: MaterialStats;
  passiveStats: PassiveStats;
  epbaxStats: EPBAXStats;
  activeDeviceStats: ActiveDeviceStats;
  paymentStats?: PaymentStats;
}

export interface AuthResponse {
  token: string;
  user: User;
}
