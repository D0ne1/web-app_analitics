import { Dish, Waiter, Order, OrderItem, Forecast } from '../types';
import { format, subDays } from 'date-fns';

// Mock dishes data
export const mockDishes: Dish[] = [
  { id: 1, name: 'Стейк Рибай', category: 'Горячие блюда', price: 1200, isAvailable: true },
  { id: 2, name: 'Паста Карбонара', category: 'Горячие блюда', price: 450, isAvailable: true },
  { id: 3, name: 'Цезарь с курицей', category: 'Салаты', price: 400, isAvailable: true },
  { id: 4, name: 'Борщ', category: 'Супы', price: 300, isAvailable: true },
  { id: 5, name: 'Тирамису', category: 'Десерты', price: 350, isAvailable: true },
  { id: 6, name: 'Картофель фри', category: 'Гарниры', price: 200, isAvailable: true },
  { id: 7, name: 'Греческий салат', category: 'Салаты', price: 380, isAvailable: true },
  { id: 8, name: 'Том ям', category: 'Супы', price: 420, isAvailable: false },
  { id: 9, name: 'Чизкейк', category: 'Десерты', price: 320, isAvailable: true },
  { id: 10, name: 'Пицца Маргарита', category: 'Горячие блюда', price: 550, isAvailable: true },
];

// Mock waiters data
export const mockWaiters: Waiter[] = [
  { id: 1, name: 'Анна Смирнова', phone: '+7 (901) 123-45-67', hiredAt: '2023-01-15' },
  { id: 2, name: 'Иван Петров', phone: '+7 (902) 234-56-78', hiredAt: '2023-02-20' },
  { id: 3, name: 'Мария Иванова', phone: '+7 (903) 345-67-89', hiredAt: '2023-03-10' },
  { id: 4, name: 'Алексей Козлов', phone: '+7 (904) 456-78-90', hiredAt: '2023-04-05' },
];

// Generate mock orders
export const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  
  // Generate 30 orders across the last 7 days
  for (let i = 1; i <= 30; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const orderDate = format(subDays(new Date(), daysAgo), "yyyy-MM-dd'T'HH:mm:ss");
    const waiterId = Math.floor(Math.random() * mockWaiters.length) + 1;
    const waiterName = mockWaiters.find(w => w.id === waiterId)?.name || '';
    const tableNumber = Math.floor(Math.random() * 10) + 1;
    
    // Generate 1-5 items per order
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items: OrderItem[] = [];
    let totalAmount = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const dishId = Math.floor(Math.random() * mockDishes.length) + 1;
      const dish = mockDishes.find(d => d.id === dishId);
      
      if (dish) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = dish.price;
        const itemTotal = price * quantity;
        totalAmount += itemTotal;
        
        items.push({
          id: i * 100 + j,
          orderId: i,
          dishId: dish.id,
          dishName: dish.name,
          quantity,
          price,
        });
      }
    }
    
    orders.push({
      id: i,
      orderDate,
      tableNumber,
      waiterId,
      waiterName,
      totalAmount,
      items,
    });
  }
  
  return orders;
};

// Generate mock forecasts
export const generateMockForecasts = (): Forecast[] => {
  const forecasts: Forecast[] = [];
  
  // Generate forecasts for the next 7 days for each dish
  mockDishes.forEach(dish => {
    for (let i = 1; i <= 7; i++) {
      const forecastDate = format(subDays(new Date(), -i), 'yyyy-MM-dd');
      const predictedSales = Math.floor(Math.random() * 30) + 5;
      
      forecasts.push({
        id: dish.id * 100 + i,
        dishId: dish.id,
        dishName: dish.name,
        forecastDate,
        predictedSales,
        createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss"),
      });
    }
  });
  
  return forecasts;
};

// Mock orders data
export const mockOrders = generateMockOrders();

// Mock forecasts data
export const mockForecasts = generateMockForecasts();