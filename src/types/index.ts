export type Role = 'admin' | 'analyst' | 'waiter';

export interface User {
  id: number;
  username: string;
  role: Role;
  email: string;
  createdAt: string;
}

export interface Dish {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  price: number;
  isAvailable: boolean;
}

export interface Waiter {
  id: number;
  name: string;
  surname: string;
  phone: string;
  hiredAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  dishId: number;
  dishName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderDate: string;
  tableNumber: number;
  waiterId: number;
  waiterName: string;
  totalAmount: number;
  items: OrderItem[];
}

export interface Forecast {
  id: number;
  dishId: number;
  dishName: string;
  forecastDate: string;
  predictedSales: number;
  createdAt: string;
}

export interface Upload {
  id: number;
  fileName: string;
  uploadDate: string;
  userId: number;
}

export interface SalesData {
  date: string;
  amount: number;
}

export interface TopDish {
  name: string;
  count: number;
  revenue: number;
}

export interface WaiterPerformance {
  name: string;
  orderCount: number;
  revenue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  averageOrderValue: number;
  orderCount: number;
  topDishes: TopDish[];
  dailySales: SalesData[];
  waiterPerformance: WaiterPerformance[];
}