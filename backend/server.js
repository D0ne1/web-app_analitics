const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, Media } = require('docx');
const { format } = require('date-fns');
const ruModule = require('date-fns/locale/ru');
const ru = ruModule.default || ruModule;
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const cron = require('node-cron');
const puppeteer = require('puppeteer');


const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });


const app = express();
const port = 5000;

// Supabase URL и сервисный ключ
const supabaseUrl = 'https://nxibdtpmxkslhbbgeerz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aWJkdHBteGtzbGhiYmdlZXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMxMTg5OSwiZXhwIjoyMDYyODg3ODk5fQ.IRGXE4tx2qNHzVWe24fTFK5fKIjvH34gQ898JIOI_v4';

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(bodyParser.json());

//ОФИЦИАНТЫ
// Получить всех официантов
app.get('/api/waiters', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('waiters')
      .select('id, name, surname, phone, hired_at')
      .order('hired_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).send('Ошибка сервера при получении официантов');
  }
});

// Добавить официанта
app.post('/api/waiters', async (req, res) => {
  const { name, surname, phone, hired_at } = req.body;
  if (!name || !surname || !phone || !hired_at) {
    return res.status(400).send('Отсутствуют обязательные поля');
  }
  try {
    const { data, error } = await supabase
      .from('waiters')
      .insert([{ name, surname, phone, hired_at }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).send('Ошибка сервера при добавлении официанта');
  }
});
// Добавить официанта по id
app.put('/api/waiters/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name,surname, phone, hired_at } = req.body;

  if (!name || !surname || !phone || !hired_at) {
    return res.status(400).send('Отсутствуют обязательные поля');
  }

  try {
    console.log({ id, name,surname, phone, hired_at }); // для отладки

    const { data, error } = await supabase
      .from('waiters')
      .update({ name,surname, phone, hired_at })
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
// Удалить официанта
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

//ЗАКАЗЫ
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




// Добавить заказ
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

// Удалить заказ
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
      .select('id, name, category_id, price, is_available, dish_categories(name)')
      .order('id', { ascending: true });
    if (error) throw error;
    const result = data.map(d => ({
      id: d.id,
      name: d.name,
      categoryId: d.category_id,
      categoryName: d.dish_categories ? d.dish_categories.name : '',
      price: d.price,
      isAvailable: d.is_available
    }));
    res.json(result);
  } catch (err) {
    res.status(500).send('Ошибка сервера при получении блюд');
  }
});

// Добавить блюдо
app.post('/api/dishes', async (req, res) => {
  const { name, categoryId, price, isAvailable } = req.body;
  if (!name || !categoryId || typeof price !== 'number') {
    return res.status(400).send('Некорректные данные');
  }
  try {
    const { data, error } = await supabase
      .from('dishes')
      .insert([{ name, category_id: categoryId, price, is_available: !!isAvailable }])
      .select('id, name, category_id, price, is_available, dish_categories(name)')
      .single();
    if (error) throw error;
    res.status(201).json({
      id: data.id,
      name: data.name,
      categoryId: data.category_id,
      categoryName: data.dish_categories ? data.dish_categories.name : '',
      price: data.price,
      isAvailable: data.is_available
    });
  } catch (err) {
    res.status(500).send('Ошибка сервера при добавлении блюда');
  }
});

// Изменить блюдо
app.put('/api/dishes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, categoryId, price, isAvailable } = req.body;
  if (!name || !categoryId || typeof price !== 'number') {
    return res.status(400).send('Некорректные данные для обновления');
  }
  try {
    const { data, error } = await supabase
      .from('dishes')
      .update({
        name,
        category_id: categoryId,
        price,
        is_available: isAvailable ?? true,
      })
      .eq('id', id)
      .select('id, name, category_id, price, is_available, dish_categories(name)')
      .single();
    if (error) throw error;
    res.json({
      id: data.id,
      name: data.name,
      categoryId: data.category_id,
      categoryName: data.dish_categories ? data.dish_categories.name : '',
      price: data.price,
      isAvailable: data.is_available
    });
  } catch (err) {
    console.error('Ошибка при обновлении блюда:', err);
    res.status(500).send('Ошибка сервера при обновлении блюда');
  }
});

// Изменить статус доступности блюда (is_available)
app.patch('/api/dishes/:id/toggle', async (req, res) => {
  const id = parseInt(req.params.id);
  const { isAvailable } = req.body;
  try {
    const { data, error } = await supabase
      .from('dishes')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select('id, name, category_id, price, is_available, dish_categories(name)')
      .single();
    if (error) throw error;
    res.json({
      id: data.id,
      name: data.name,
      categoryId: data.category_id,
      categoryName: data.dish_categories ? data.dish_categories.name : '',
      price: data.price,
      isAvailable: data.is_available
    });
  } catch (err) {
    console.error('Ошибка при обновлении блюда:', err);
    res.status(500).send('Ошибка сервера при обновлении блюда');
  }
});
// Удалить блюдо по id
app.delete('/api/dishes/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('dish_id', id);

    if (itemsError) throw itemsError;

    // Потом само блюдо
    const { error: dishError } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);

    if (dishError) throw dishError;

    res.status(204).send();
  } catch (err) {
    console.error('Ошибка при удалении блюда:', err);
    res.status(500).send('Ошибка сервера при удалении блюда');
  }
});





// Получить все категории блюд
app.get('/api/dish-categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dish_categories')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).send('Ошибка сервера при получении категорий');
  }
});

// Добавить категорию блюда
app.post('/api/dish-categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Название обязательно');
  try {
    const { data, error } = await supabase
      .from('dish_categories')
      .insert([{ name }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).send('Ошибка сервера при добавлении категории');
  }
});




// Получить все заказы для дашборда
app.get('/api/dashboard', async (req, res) => {
  try {
    // timeframe: 'week' (7 дней) или 'month' (31 день)
    const timeframe = req.query.timeframe === 'month' ? 'month' : 'week';
    const now = new Date();
    const periodDays = timeframe === 'month' ? 31 : 7;
    const periodAgo = new Date(now);
    periodAgo.setDate(now.getDate() - periodDays);

    // 1. Получаем заказы за период
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_date, total_amount, waiter_id, waiters(name, surname)')
      .gte('order_date', periodAgo.toISOString())
      .lte('order_date', now.toISOString())
      .order('order_date', { ascending: true });
    if (ordersError) throw ordersError;

    // 2. Метрики по заказам
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount ? Math.round(totalRevenue / orderCount) : 0;

    // 3. Выручка по датам
    const revenueByDateMap = {};
    orders.forEach(order => {
      const dateStr = order.order_date.slice(0, 10);
      revenueByDateMap[dateStr] = (revenueByDateMap[dateStr] || 0) + Number(order.total_amount);
    });
    const revenueData = Object.entries(revenueByDateMap).map(([date, revenue]) => ({ date, revenue }));

    // 4. Топ блюда (по order_items из этих заказов)
    const orderIds = orders.map(o => o.id);
    let topDishes = [];
    if (orderIds.length > 0) {
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('dish_id, quantity, price, dishes(name)')
        .in('order_id', orderIds);
      if (orderItemsError) throw orderItemsError;

      const dishMap = {};
      orderItems.forEach(({ dish_id, quantity, price, dishes }) => {
        if (!dishMap[dish_id])
          dishMap[dish_id] = { name: dishes?.name || 'Неизвестно', revenue: 0, count: 0 };
        dishMap[dish_id].revenue += Number(price) * Number(quantity);
        dishMap[dish_id].count += Number(quantity);
      });
      topDishes = Object.values(dishMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    // 5. Топ официанты (по waiter_id из этих заказов)
    let waiterPerformance = [];
    if (orders.length > 0) {
      const waiterMap = {};
      orders.forEach(({ waiter_id, waiters, total_amount }) => {
        if (!waiter_id) return;
        if (!waiterMap[waiter_id])
          waiterMap[waiter_id] = { 
            name: waiters?.name || 'Без имени', 
            surname: waiters?.surname || '', 
            orderCount: 0, 
            revenue: 0 
          };
        waiterMap[waiter_id].orderCount += 1;
        waiterMap[waiter_id].revenue += Number(total_amount);
      });
      waiterPerformance = Object.values(waiterMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);
    }

    res.json({
      totalRevenue,
      averageOrderValue,
      orderCount,
      revenueData,
      topDishes,
      waiterPerformance,
    });
  } catch (err) {
    console.error('Ошибка в /api/dashboard:', err);
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

  // 2. username и role из своей таблицы users по user.id
  const userId = data.user.id;
  const userEmail = data.user.email;

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('username, role')
    .eq('id', userId)
    .limit(1);

  let username = '';
  let role = '';
  if (users && users.length > 0) {
    username = users[0].username;
    role = users[0].role;
  }

  res.json({
    user: {
      id: userId,
      email: userEmail,
      username,
      role,
    },
  });
});

// Для изменения username и email пользователя
app.put('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  // 1. Обновить имя и email в своей таблице users
  const { error: userError } = await supabase
    .from('users')
    .update({ username, email })
    .eq('id', userId);

  if (userError) {
    return res.status(500).json({ error: 'Ошибка обновления профиля (users)' });
  }

  // 2. Обновить email в Supabase Auth
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email });
  if (authError) {
    console.error("SUPABASE AUTH ERROR:", authError);
    return res.status(500).json({ error: 'Ошибка обновления email (auth)' });
  }

  res.json({ ok: true });
});











// Загрузка файла Excel
function excelDateToISOString(excelDate, withTime = false) {
  if (typeof excelDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(excelDate)) {
    // Если строка уже ISO — вернуть как есть
    if (!withTime) return excelDate.slice(0, 10);
    // Если строка без времени, добавить 00:00:00 с T
    if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) return excelDate + 'T00:00:00';
    return excelDate.replace(" ", "T").replace("Z", ""); // Если вдруг формат с пробелом
  }
  if (typeof excelDate === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
    if (withTime) {
      return jsDate.toISOString().slice(0, 19); // "2025-05-15T13:20:00"
    }
    return jsDate.toISOString().slice(0, 10);
  }
  return null;
}


app.post("/api/uploads", upload.single("file"), async (req, res) => {
  try {
    // 1. Очистка таблиц
    await supabase.from('order_items').delete().neq('id', null);
    await supabase.from('orders').delete().neq('id', null);
    await supabase.from('dishes').delete().neq('id', null);
    await supabase.from('waiters').delete().neq('id', null);
    if (!req.file) return res.status(400).json({ error: "Файл не передан" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    // 2. WAITERS
    const waitersSheet = workbook.Sheets["waiters"];
    const waiters = XLSX.utils.sheet_to_json(waitersSheet, { defval: "" });
    const waiterOrigToReal = {};
    for (const w of waiters) {
      const { name, surname, phone, hired_at, orig_id } = w;
      const hiredAtParsed = excelDateToISOString(hired_at, false);
      const { data, error } = await supabase
        .from("waiters")
        .insert([{ name, surname, phone, hired_at: hiredAtParsed }])
        .select()
        .single();
      if (error) throw error;
      waiterOrigToReal[orig_id] = data.id;
    }

   // 3. DISHES
    const dishesSheet = workbook.Sheets["dishes"];
    const dishesArr = XLSX.utils.sheet_to_json(dishesSheet, { defval: "" });

    const dishOrigToReal = {};
    const dishByOrigId = {};

    // 3.1. Уникальные категории
    const categorySet = new Set(
      dishesArr
        .map(d => d.category)
        .filter(name => !!name && !!name.trim())
    );
    const categoryNameToId = {};

    // 3.2. Вставляем категории (если новых ещё нет)
    for (const name of categorySet) {
      const { data, error } = await supabase
        .from("dish_categories")
        .upsert([{ name }], { onConflict: ['name'] })
        .select()
        .single();
      if (error) throw error;
      categoryNameToId[name] = data.id;
    }

    // 3.3. Вставляем блюда
    for (const d of dishesArr) {
      const { name, category, price, is_available, orig_id } = d;
      const category_id = categoryNameToId[category];
      if (!category_id) {
        console.warn(`Пропущено блюдо "${name}" — не найдена категория "${category}"`);
        continue;
      }
      const { data, error } = await supabase
        .from("dishes")
        .insert([{ name, category_id, price: Number(price), is_available }])
        .select()
        .single();
      if (error) throw error;

      dishOrigToReal[orig_id] = data.id;
      dishByOrigId[orig_id] = { ...d, dbId: data.id, price: Number(price) };
    }


        // 4. ORDERS (без total_amount)
        const ordersSheet = workbook.Sheets["orders"];
        const orders = XLSX.utils.sheet_to_json(ordersSheet, { defval: "" });
        const orderOrigToReal = {};
        for (const o of orders) {
          const { order_date, table_number, waiter_orig_id, orig_id } = o;
          const waiter_id = waiterOrigToReal[waiter_orig_id];
          const orderDateParsed = excelDateToISOString(order_date, true);
          // total_amount не указываем!
          const { data, error } = await supabase
            .from("orders")
            .insert([{ order_date: orderDateParsed, table_number, waiter_id, total_amount: 0 }])
            .select()
            .single();
          if (error) throw error;
          orderOrigToReal[orig_id] = data.id;
        }

    // 5. ORDER_ITEMS (price считаем сами)
    const itemsSheet = workbook.Sheets["order_items"];
    const items = XLSX.utils.sheet_to_json(itemsSheet, { defval: "" });

    // Для подсчёта суммы заказа
    const orderIdToSum = {}; // order_id => сумма

    for (const i of items) {
      const { order_orig_id, dish_orig_id, quantity } = i;
      const order_id = orderOrigToReal[order_orig_id];
      const dish_id = dishOrigToReal[dish_orig_id];

      // Получаем цену блюда
      const dish = dishByOrigId[dish_orig_id];
      const pricePerOne = dish ? Number(dish.price) : 0;
      const price = pricePerOne * Number(quantity);

      // Добавляем позицию
      await supabase.from("order_items").insert([{ order_id, dish_id, quantity: Number(quantity), price }]);

      // Копим сумму для order
      if (!orderIdToSum[order_id]) orderIdToSum[order_id] = 0;
      orderIdToSum[order_id] += price;
    }

    // 6. Обновляем total_amount для каждого заказа
    for (const [order_id, total_amount] of Object.entries(orderIdToSum)) {
      await supabase.from("orders").update({ total_amount }).eq("id", order_id);
    }

    // 7. Фиксируем загрузку
    await supabase.from('uploads').insert([{
      file_name: req.file.originalname,
      user_id: req.user?.id || null
    }]);
    res.json({ ok: true, message: "Все данные импортированы!" });
  } catch (e) {
    console.error("Ошибка загрузки файла:", e);
    res.status(500).json({ error: "Ошибка обработки файла" });
  }
});




// Удалить все данные из всех таблиц (кроме users)
app.post('/api/delete-all', async (req, res) => {
  try {
    const errors = [];
    for (const table of ['order_items', 'orders', 'forecasts', 'dishes', 'waiters', 'uploads']) {
      const { error } = await supabase.from(table).delete().not('id', 'is', null);
      if (error) errors.push({ table, error });
    }
    if (errors.length) {
      console.error('Ошибки при удалении:', errors);
      return res.status(500).json({ error: 'Ошибка при удалении данных', details: errors });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("Ошибка при удалении всех данных:", e);
    res.status(500).json({ error: "Ошибка при удалении данных" });
  }
});















async function generateForecasts() {
  // 1. Получаем все блюда
  const { data: dishes, error: dishError } = await supabase.from('dishes').select('id, name');
  if (dishError) throw dishError;
  if (!dishes.length) {
    console.log('Нет блюд в базе!');
    return;
  }

  // 2. Анализируем последние 4 недели
  const weeksToAnalyze = 4;
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - weeksToAnalyze * 7);
  const startDateStr = startDate.toISOString().slice(0, 10);

  // 3. Заказы за период
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_date')
    .gte('order_date', startDateStr);
  if (ordersError) throw ordersError;

  const orderMap = {};
  orders.forEach(o => { orderMap[o.id] = o.order_date; });

  // 4. Позиции заказов
  const orderIds = orders.map(o => o.id);
  let orderItems = [];
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from('order_items')
      .select('dish_id, quantity, order_id')
      .in('order_id', orderIds);
    if (error) throw error;
    orderItems = data;
    orderItems.forEach(oi => {
      oi.order_date = orderMap[oi.order_id] || null;
    });
  }

  // 5. Готовим историю продаж и дни, когда были заказы
  const dishSales = {};
  for (const dish of dishes) {
    // Для каждого блюда: salesByDay[dow] = [кол-во, ...], usedDays = Set(дни недели)
    let salesByDay = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
    let usedDays = new Set();
    orderItems.filter(oi => oi.dish_id === dish.id && oi.order_date).forEach(oi => {
      const dow = new Date(oi.order_date).getDay();
      salesByDay[dow].push(Number(oi.quantity));
      usedDays.add(dow);
    });
    dishSales[dish.id] = { name: dish.name, salesByDay, usedDays };
  }

  // 6. Прогнозируем только для тех дат, где был хотя бы один заказ по этому блюду
  for (const dish of dishes) {
    const { salesByDay, usedDays } = dishSales[dish.id];

    // --- На месяц вперёд ---
    let forecastDates = [];
    for (let i = 0; i < 31; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(now.getDate() + i);
      const dow = forecastDate.getDay();
      if (usedDays.has(dow)) { // Только если в этот день недели были продажи!
        forecastDates.push({ date: forecastDate, dow });
      }
    }
    // 7. Сохраняем прогнозы только для этих дат
    for (const { date, dow } of forecastDates) {
  const arr = salesByDay[dow];
  const m = mean(arr);
  const s = std(arr);
  const forecast = Math.max(0, Math.round(m + s));
  const dateStr = date.toISOString().slice(0, 10);

  
    const { error: upsertError } = await supabase
      .from('forecasts')
      .upsert(
        {
          dish_id: dish.id,
          forecast_date: dateStr,
          predicted_sales: forecast,
        },
        { onConflict: ['dish_id', 'forecast_date'] }
      );
    if (upsertError) {
      console.error('Ошибка upsert:', upsertError, {
        dish_id: dish.id,
        forecast_date: dateStr,
        predicted_sales: forecast
      });
    } else {
      
    }
  }
  }
  
}

// Функции для статистики
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1));
}


//--- API для фронта ---
app.get('/api/forecasts', async (req, res) => {
  try {
    const timeframe = req.query.timeframe === 'month' ? 'month' : 'week';
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let periodEnd = new Date(today);
    periodEnd.setDate(periodEnd.getDate() + (timeframe === 'month' ? 31 : 7));
    const periodEndStr = periodEnd.toISOString().slice(0, 10);

    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('id, name');
    if (dishesError) throw dishesError;

    const { data: forecasts, error: forecastsError } = await supabase
      .from('forecasts')
      .select('dish_id, forecast_date, predicted_sales')
      .gte('forecast_date', todayStr)
      .lte('forecast_date', periodEndStr);
    if (forecastsError) throw forecastsError;

    // Группируем по блюдам
    const forecastMap = {};
    for (const dish of dishes) {
      forecastMap[dish.id] = {
        dish_id: dish.id,
        dish_name: dish.name,
        week_forecast: 0,
        month_forecast: 0,
      };
    }

    for (const f of forecasts) {
      const d = new Date(f.forecast_date);
      const daysFromToday = Math.floor((d - today) / (1000 * 60 * 60 * 24));
      if (daysFromToday < 7) {
        forecastMap[f.dish_id].week_forecast += Number(f.predicted_sales);
      }
      if (daysFromToday < 31) {
        forecastMap[f.dish_id].month_forecast += Number(f.predicted_sales);
      }
    }

    res.json(Object.values(forecastMap));
  } catch (error) {
    console.error('Ошибка при получении прогнозов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении прогнозов' });
  }
});


app.post('/api/generate-forecast', async (req, res) => {
  try {
    await generateForecasts();
    res.json({ ok: true, message: 'Прогноз успешно обновлён!' });
  } catch (err) {
    console.error('Ошибка генерации прогноза:', err);
    res.status(500).json({ error: 'Ошибка генерации прогноза' });
  }
});























// --- Функция безопасного форматирования дат ---
function safeFormat(dateValue, pattern) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (isNaN(d)) return "";
  try {
    return format(d, pattern, { locale: ru });
  } catch (e) {
    return "";
  }
}
app.get('/api/export-full-report-pdf', async (req, res) => {
  try {
    const width = 800, height = 400;
    const chartCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "white" });

    // --- Получение данных за неделю и месяц ---
    const [weekDashboard, monthDashboard] = await Promise.all([
      fetch('http://localhost:5000/api/dashboard?timeframe=week').then(r => r.json()),
      fetch('http://localhost:5000/api/dashboard?timeframe=month').then(r => r.json()),
    ]);

    // --- Графики за неделю ---
    const weekRevenueChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'line',
      data: {
        labels: weekDashboard.revenueData.map(item => safeFormat(item.date, 'dd MMM')),
        datasets: [{
          label: 'Выручка',
          data: weekDashboard.revenueData.map(item => item.revenue),
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' ₽' } } }
      }
    });

    const weekTopDishesChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: weekDashboard.topDishes.map(d => d.name),
        datasets: [{
          label: 'Выручка',
          data: weekDashboard.topDishes.map(d => d.revenue),
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(6, 182, 212, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ]
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        indexAxis: 'y',
        scales: { x: { beginAtZero: true, ticks: { callback: v => v + ' ₽' } } }
      }
    });

    const weekTopWaitersChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: weekDashboard.waiterPerformance.map(w => w.name + (w.surname ? ' ' + w.surname : '')),
        datasets: [{
          label: 'Выручка официанта',
          data: weekDashboard.waiterPerformance.map(w => w.revenue),
          backgroundColor: [
            'rgba(249, 115, 22, 0.7)',
            'rgba(37, 99, 235, 0.7)',
            'rgba(6, 182, 212, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ],
          borderRadius: 8,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Официант" } },
          x: { beginAtZero: true, title: { display: true, text: "Выручка" }, ticks: { callback: v => v + ' ₽', stepSize: 1 } }
        }
      }
    });

    // --- Графики за месяц ---
    const monthRevenueChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'line',
      data: {
        labels: monthDashboard.revenueData.map(item => safeFormat(item.date, 'dd MMM')),
        datasets: [{
          label: 'Выручка',
          data: monthDashboard.revenueData.map(item => item.revenue),
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' ₽' } } }
      }
    });

    const monthTopDishesChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: monthDashboard.topDishes.map(d => d.name),
        datasets: [{
          label: 'Выручка',
          data: monthDashboard.topDishes.map(d => d.revenue),
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(6, 182, 212, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ]
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        indexAxis: 'y',
        scales: { x: { beginAtZero: true, ticks: { callback: v => v + ' ₽' } } }
      }
    });

    const monthTopWaitersChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: monthDashboard.waiterPerformance.map(w => w.name + (w.surname ? ' ' + w.surname : '')),
        datasets: [{
          label: 'Выручка официанта',
          data: monthDashboard.waiterPerformance.map(w => w.revenue),
          backgroundColor: [
            'rgba(249, 115, 22, 0.7)',
            'rgba(37, 99, 235, 0.7)',
            'rgba(6, 182, 212, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ],
          borderRadius: 8,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Официант" } },
          x: { beginAtZero: true, title: { display: true, text: "Выручка" }, ticks: { callback: v => v + ' ₽', stepSize: 1 } }
        }
      }
    });

    // --- Прогнозы ---
    const { data: dishes } = await supabase.from('dishes').select('id, name');
    const { data: forecasts } = await supabase.from('forecasts').select('dish_id, forecast_date, predicted_sales');

    const today = new Date();
    // --- Прогноз на неделю ---
    const weekForecastMap = {};
    for (const dish of dishes) weekForecastMap[dish.id] = { name: dish.name, total: 0 };
    for (const f of forecasts) {
      const days = (new Date(f.forecast_date) - today) / (1000 * 60 * 60 * 24);
      if (days < 7) weekForecastMap[f.dish_id].total += Number(f.predicted_sales);
    }
    const weekForecastData = Object.values(weekForecastMap).filter(x => x.total > 0);

    const weekForecastChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: weekForecastData.map(d => d.name),
        datasets: [{
          label: "Прогноз на неделю, порций",
          data: weekForecastData.map(d => d.total),
          backgroundColor: "rgba(37, 99, 235, 0.7)",
          borderRadius: 8,
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} порций` } }
        },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Блюдо" } },
          x: { beginAtZero: true, title: { display: true, text: "Порций" }, ticks: { stepSize: 1 } }
        }
      }
    });

    // --- Прогноз на месяц ---
    const monthForecastMap = {};
    for (const dish of dishes) monthForecastMap[dish.id] = { name: dish.name, total: 0 };
    for (const f of forecasts) {
      const days = (new Date(f.forecast_date) - today) / (1000 * 60 * 60 * 24);
      if (days < 31) monthForecastMap[f.dish_id].total += Number(f.predicted_sales);
    }
    const monthForecastData = Object.values(monthForecastMap).filter(x => x.total > 0);

    const monthForecastChartImgBuffer = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: monthForecastData.map(d => d.name),
        datasets: [{
          label: "Прогноз на месяц, порций",
          data: monthForecastData.map(d => d.total),
          backgroundColor: "rgba(6, 182, 212, 0.7)",
          borderRadius: 8,
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} порций` } }
        },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Блюдо" } },
          x: { beginAtZero: true, title: { display: true, text: "Порций" }, ticks: { stepSize: 1 } }
        }
      }
    });

    // --- HTML-отчёт ---
    const tableRows = (arr) =>
      arr.map(d => `<tr><td>${d.name}</td><td>${d.total}</td></tr>`).join('\n');
    const forecastTable = (arr) =>
      `<table>
        <tr><th>Название</th><th>Количество позиций</th></tr>
        ${tableRows(arr)}
      </table>`;

    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          h1, h2, h3 { color: #2563EB; }
          h2, h3 { margin-bottom: 8px; margin-top: 24px; }
          img.forecast { margin-top: 0; margin-bottom: 16px; display: block; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px;}
          th, td { border: 1px solid #ccc; padding: 4px; }
        </style>
      </head>
      <body>
        <h1>Дашборд ресторана</h1>
        <h2>Ключевые метрики за неделю</h2>
        <table>
          <tr><td>Общая выручка</td><td>${weekDashboard.totalRevenue} ₽</td></tr>
          <tr><td>Средний чек</td><td>${weekDashboard.averageOrderValue} ₽</td></tr>
          <tr><td>Количество заказов</td><td>${weekDashboard.orderCount}</td></tr>
        </table>
        <h3>Динамика выручки за неделю</h3>
        <img src="data:image/png;base64,${weekRevenueChartImgBuffer.toString('base64')}" width="800"/>
        <h3>Топ-5 по выручке за неделю</h3>
        <img src="data:image/png;base64,${weekTopDishesChartImgBuffer.toString('base64')}" width="800"/>
        <h3>Топ официанты по выручке за неделю</h3>
        <img src="data:image/png;base64,${weekTopWaitersChartImgBuffer.toString('base64')}" width="800"/>

        <h2>Ключевые метрики за месяц</h2>
        <table>
          <tr><td>Общая выручка</td><td>${monthDashboard.totalRevenue} ₽</td></tr>
          <tr><td>Средний чек</td><td>${monthDashboard.averageOrderValue} ₽</td></tr>
          <tr><td>Количество заказов</td><td>${monthDashboard.orderCount}</td></tr>
        </table>
        <h3>Динамика выручки за месяц</h3>
        <img src="data:image/png;base64,${monthRevenueChartImgBuffer.toString('base64')}" width="800"/>
        <h3>Топ-5 по выручке за месяц</h3>
        <img src="data:image/png;base64,${monthTopDishesChartImgBuffer.toString('base64')}" width="800"/>
        <h3>Топ официанты по выручке за месяц</h3>
        <img src="data:image/png;base64,${monthTopWaitersChartImgBuffer.toString('base64')}" width="800"/>

        <h2>Прогнозирование на неделю</h2>
        <img class="forecast" src="data:image/png;base64,${weekForecastChartImgBuffer.toString('base64')}" width="800"/>
        ${forecastTable(weekForecastData)}

        <h2>Прогнозирование на месяц</h2>
        <img class="forecast" src="data:image/png;base64,${monthForecastChartImgBuffer.toString('base64')}" width="800"/>
        ${forecastTable(monthForecastData)}
      </body>
      </html>
    `;

    // --- PDF через puppeteer ---
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report_Resto`run.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Ошибка экспорта отчёта:', err);
    res.status(500).json({ error: 'Ошибка экспорта отчёта' });
  }
});








if (require.main === module) {
  app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
