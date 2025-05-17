const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const JWT_SECRET = 'your_super_secret_key'; 

const app = express();
const port = 5000;

// Supabase URL и сервисный ключ
const supabaseUrl = 'https://nxibdtpmxkslhbbgeerz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aWJkdHBteGtzbGhiYmdlZXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTE4OTksImV4cCI6MjA2Mjg4Nzg5OX0.f6rEUnaoWOkB6wsOPfrLwO9RmatB18R3P-0r5gWBNOA';

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(bodyParser.json());


// Получить всех официантов
app.get('/api/waiters', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('waiters')
      .select('id, name, phone, hired_at')
      .order('hired_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера при получении официантов');
  }
});
app.post('/api/waiters', async (req, res) => {
  const { name, phone, hired_at } = req.body;

  if (!name || !phone || !hired_at) {
    return res.status(400).send('Отсутствуют обязательные поля');
  }

  try {
    const { data, error } = await supabase
      .from('waiters')
      .insert([{ name, phone, hired_at }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Ошибка в POST /api/waiters:', err);
    res.status(500).send('Ошибка сервера при добавлении официанта');
  }
});
app.put('/api/waiters/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, hired_at } = req.body;

  if (!name || !phone || !hired_at) {
    return res.status(400).send('Отсутствуют обязательные поля');
  }

  try {
    console.log({ id, name, phone, hired_at }); // <-- временно для отладки

    const { data, error } = await supabase
      .from('waiters')
      .update({ name, phone, hired_at })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).send('Официант не найден');
    }

    res.json(data[0]);
  } catch (err) {
    console.error('Ошибка в PUT /api/waiters/:id:', err);
    res.status(500).send('Ошибка сервера при обновлении официанта');
  }
});

app.delete('/api/waiters/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Удалить сначала все заказы этого официанта
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('waiter_id', id);

    if (orderError) throw orderError;

    // Затем удалить самого официанта
    const { error: waiterError } = await supabase
      .from('waiters')
      .delete()
      .eq('id', id);

    if (waiterError) throw waiterError;

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера при удалении официанта и его заказов');
  }
});


// Получить все заказы
app.get('/api/orders', async (req, res) => {
  try {
    let { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_date,
        table_number,
        waiter_id,
        total_amount,
        waiters!inner(name),
        order_items (
          id,
          dish_id,
          quantity,
          price,
          dishes!inner(name)
        )
      `)
      .order('order_date', { ascending: false })
      .limit(100);

    if (error) throw error;

    orders = orders.map(order => ({
      id: order.id,
      orderDate: order.order_date,
      tableNumber: order.table_number,
      waiterId: order.waiter_id,
      waiterName: order.waiters.name,
      totalAmount: order.total_amount,
      items: order.order_items.map(item => ({
        id: item.id,
        dishId: item.dish_id,
        dishName: item.dishes.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера при получении заказов');
  }
});


app.put('/api/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { tableNumber, waiterId } = req.body;

  if (!waiterId) {
    return res.status(400).json({ error: 'waiterId обязателен' });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ table_number: tableNumber, waiter_id: waiterId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка сервера при обновлении заказа');
  }
});


app.delete('/api/orders/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Заказ удалён' });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    res.status(500).json({ error: 'Ошибка при удалении заказа' });
  }
});


// Получить все блюда
app.get('/api/dishes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .select('id, name, category, price, is_available');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении блюд:', err);
    res.status(500).send('Ошибка сервера при получении блюд');
  }
});

// Добавить новое блюдо
app.post('/api/dishes', async (req, res) => {
  const { name, category, price, isAvailable } = req.body;

  if (!name || !category || typeof price !== 'number') {
    return res.status(400).send('Некорректные данные');
  }

  try {
    const { data, error } = await supabase
      .from('dishes')
      .insert([{ name, category, price, is_available: isAvailable }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Ошибка при добавлении блюда:', err);
    res.status(500).send('Ошибка сервера при добавлении блюда');
  }
});

// Удалить блюдо
app.delete('/api/dishes/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    console.error('Ошибка при удалении блюда:', err);
    res.status(500).send('Ошибка сервера при удалении блюда');
  }
});

// Изменить статус доступности блюда
app.patch('/api/dishes/:id/toggle', async (req, res) => {
  const id = parseInt(req.params.id);
  const { isAvailable } = req.body;

  try {
    const { data, error } = await supabase
      .from('dishes')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Ошибка при обновлении блюда:', err);
    res.status(500).send('Ошибка сервера при обновлении блюда');
  }
});
// Обновить блюдо по id
app.put('/api/dishes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, price, isAvailable } = req.body;

  if (!name || !category || typeof price !== 'number') {
    return res.status(400).send('Некорректные данные для обновления');
  }

  try {
    const { data, error } = await supabase
      .from('dishes')
      .update({
        name,
        category,
        price,
        is_available: isAvailable ?? true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Ошибка при обновлении блюда:', err);
    res.status(500).send('Ошибка сервера при обновлении блюда');
  }
});








app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. Выручка за последние 7 дней (группировка по дате)
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('order_date, total_amount')
      .gte('order_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('order_date', { ascending: true });

    if (revenueError) throw revenueError;

    // 2. Общая выручка
    const totalRevenue = revenueData.reduce((sum, order) => sum + order.total_amount, 0);

    // 3. Кол-во заказов
    const orderCount = revenueData.length;

    // 4. Средний чек
    const averageOrderValue = orderCount ? Math.round(totalRevenue / orderCount) : 0;

    // 5. Топ-5 популярных блюд по выручке за 7 дней
    const { data: topDishes, error: dishesError } = await supabase
      .from('order_items')
      .select('dish_id, quantity, price, dishes(name)')
      .gte('order_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (dishesError) throw dishesError;

    // Сгруппируем по блюдам и посчитаем выручку
    const dishMap = {};
    topDishes.forEach(({ dish_id, quantity, price, dishes }) => {
      if (!dishMap[dish_id]) {
        dishMap[dish_id] = { name: dishes.name, revenue: 0, count: 0 };
      }
      dishMap[dish_id].revenue += price * quantity;
      dishMap[dish_id].count += quantity;
    });

    // Превращаем в массив и сортируем по выручке
    const topDishesArr = Object.values(dishMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 6. Топ-4 официанта по сумме заказов
    const { data: waitersData, error: waitersError } = await supabase.rpc('waiter_performance', {
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString(),
    });

    if (waitersError) throw waitersError;

    // Отправляем в ответ
    res.json({
      totalRevenue,
      averageOrderValue,
      orderCount,
      topDishes: topDishesArr,
      waiterPerformance: waitersData,
      revenueData, // можно дальше форматировать по датам на клиенте
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера при получении данных дашборда');
  }
});







const fetchData = async () => {
  setIsLoading(true);
  try {
    const res = await fetch(`/dashboard?timeframe=${timeframe}`);
    const json = await res.json();
    console.log('Dashboard data:', json);

    // Пример распаковки и установки данных в состояние
    setTotalRevenue(json.totalRevenue);
    setAverageOrderValue(json.averageOrderValue);
    setOrderCount(json.orderCount);

    // Для графика — даты и выручка
    setLabels(json.revenueData.map(item => item.date));
    setRevenueData(json.revenueData.map(item => item.revenue));

    setTopDishes(json.topDishes);
    setWaiterPerformance(json.waiterPerformance);
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
  } finally {
    setIsLoading(false);
  }
};

app.get('/dashboard', async (req, res) => {
  const timeframe = req.query.timeframe || 'week';

  const now = new Date();
  let startDate = new Date();
  let prevStartDate = new Date();
  let prevEndDate = new Date();

  if (timeframe === 'week') {
    startDate.setDate(now.getDate() - 7);
    prevEndDate = new Date(startDate);
    prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate.setMonth(now.getMonth() - 1);
    prevEndDate = new Date(startDate);
    prevStartDate = new Date(startDate);
    prevStartDate.setMonth(startDate.getMonth() - 1);
  } else {
    // По умолчанию — всё время. Проценты изменений будут 0.
    startDate = null;
    prevStartDate = null;
    prevEndDate = null;
  }

  try {
    // 1. Заказы за период
    let ordersQuery = supabase
      .from('orders')
      .select('id, order_date, total_amount');

    if (startDate) {
      ordersQuery = ordersQuery
        .gte('order_date', startDate.toISOString())
        .lte('order_date', now.toISOString());
    }
    ordersQuery = ordersQuery.order('order_date', { ascending: true });
    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // 2. Заказы за прошлый период для сравнения
    let prevOrders = [];
    if (prevStartDate && prevEndDate) {
      let prevOrdersQuery = supabase
        .from('orders')
        .select('id, order_date, total_amount')
        .gte('order_date', prevStartDate.toISOString())
        .lte('order_date', prevEndDate.toISOString());
      prevOrdersQuery = prevOrdersQuery.order('order_date', { ascending: true });
      const { data, error } = await prevOrdersQuery;
      if (error) throw error;
      prevOrders = data;
    }

    // Метрики текущего периода
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount ? Math.round(totalRevenue / orderCount) : 0;

    // Метрики прошлого периода
    const prevTotalRevenue = prevOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const prevOrderCount = prevOrders.length;
    const prevAverageOrderValue = prevOrderCount ? Math.round(prevTotalRevenue / prevOrderCount) : 0;

    // Проценты изменений
    function calcPercent(current, prev) {
      if (prev === 0) return current === 0 ? 0 : 100;
      return ((current - prev) / prev * 100).toFixed(1);
    }
    const revenueChange = calcPercent(totalRevenue, prevTotalRevenue);
    const avgOrderChange = calcPercent(averageOrderValue, prevAverageOrderValue);
    const orderCountChange = calcPercent(orderCount, prevOrderCount);

    // Группировка по дате для графика
    const revenueByDateMap = {};
    orders.forEach(order => {
      const dateStr = order.order_date.slice(0, 10);
      revenueByDateMap[dateStr] = (revenueByDateMap[dateStr] || 0) + Number(order.total_amount);
    });
    const revenueData = Object.entries(revenueByDateMap).map(([date, revenue]) => ({ date, revenue }));

    // Топ-5 популярных блюд (фильтруем по orders.order_date)
    let orderItemsQuery = supabase
      .from('order_items')
      .select(`
        dish_id,
        quantity,
        price,
        dishes(name),
        orders(order_date)
      `);

    if (startDate) {
      orderItemsQuery = orderItemsQuery
        .gte('orders.order_date', startDate.toISOString())
        .lte('orders.order_date', now.toISOString());
    }

    const { data: orderItems, error: orderItemsError } = await orderItemsQuery;
    if (orderItemsError) throw orderItemsError;

    // Группируем блюда
    const dishMap = {};
    orderItems.forEach(({ dish_id, quantity, price, dishes }) => {
      if (!dishMap[dish_id]) dishMap[dish_id] = { name: dishes.name, revenue: 0, count: 0 };
      dishMap[dish_id].revenue += price * quantity;
      dishMap[dish_id].count += quantity;
    });
    const topDishes = Object.values(dishMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Топ-4 официанта по сумме заказов
    let waiterOrdersQuery = supabase
      .from('orders')
      .select('waiter_id, waiters(name), total_amount');
    if (startDate) {
      waiterOrdersQuery = waiterOrdersQuery
        .gte('order_date', startDate.toISOString())
        .lte('order_date', now.toISOString());
    }
    const { data: waiterOrders, error: waiterOrdersError } = await waiterOrdersQuery;
    if (waiterOrdersError) throw waiterOrdersError;

    const waiterMap = {};
    waiterOrders.forEach(({ waiter_id, total_amount, waiters }) => {
      if (!waiterMap[waiter_id]) waiterMap[waiter_id] = { name: waiters.name, revenue: 0, orderCount: 0 };
      waiterMap[waiter_id].revenue += Number(total_amount);
      waiterMap[waiter_id].orderCount += 1;
    });
    const waiterPerformance = Object.values(waiterMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    // Отдаём клиенту все метрики и проценты изменений
    res.json({
      totalRevenue,
      averageOrderValue,
      orderCount,
      revenueData,
      topDishes,
      waiterPerformance,
      revenueChange,
      avgOrderChange,
      orderCountChange,
    });
  } catch (error) {
    console.error('Ошибка в /dashboard:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении данных дашборда' });
  }
});




app.post('/api/register', async (req, res) => {
  const { email, password, username, role } = req.body;
  if (!email || !password || !username || !role) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  // 1. Регистрация в Auth
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // 2. Создание профиля в users
  const userId = data.user.id;
  const { error: insertError } = await supabase
    .from('users')
    .insert([{ id: userId, email, username, role }]);
  if (insertError) return res.status(400).json({ error: insertError.message });

  res.status(201).json({ user: { id: userId, email, username, role } });
});



// app.post('/api/login', async (req, res) => {
//   // ВРЕМЕННО: жёстко прописываем e-mail и пароль для теста
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email: 'dpanfilov12@.com', // <-- ТВОЙ email, который точно зарегистрирован!
//     password: '123123',    // <-- Пароль, который вводил при регистрации!
//   });
//   console.log('ТЕСТ:', data, error);

//   // Можно возвращать результат теста на фронт (или просто смотреть в логе Node.js)
//   res.json({ data, error });
// });



// Логин пользователя
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  // 1. Логин через Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data || !data.user) {
    return res.status(400).json({ error: 'Неверная почта или пароль' });
  }

  // 2. Получить username и роль из своей таблицы users по email
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('username, role')
    .eq('email', email)
    .limit(1);

  let username = '';
  let role = '';
  if (users && users.length > 0) {
    username = users[0].username;
    role = users[0].role;
  }

  res.json({
    user: {
      id: data.user.id,
      email,
      username,
      role,
    },
   
  });
});




















// ▶ Запуск сервера
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
