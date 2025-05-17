import React, { useState, useEffect } from 'react';

import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart2,
  Calendar,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format} from 'date-fns';
import { ru } from 'date-fns/locale';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TopDish {
  name: string;
  count: number;
  revenue: number;
}

interface WaiterPerformance {
  name: string;
  orderCount: number;
  revenue: number;
}

const DashboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);

  // Стейты для данных
  const [labels, setLabels] = useState<string[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [topDishes, setTopDishes] = useState<TopDish[]>([]);
  const [waiterPerformance, setWaiterPerformance] = useState<WaiterPerformance[]>([]);
  const [revenueChange, setRevenueChange] = useState(0);
  const [avgOrderChange, setAvgOrderChange] = useState(0);
  const [orderCountChange, setOrderCountChange] = useState(0);
  //const [orders, setOrders] = useState<any[]>([]);


 const fetchData = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(`http://localhost:5000/dashboard?timeframe=${timeframe}`);
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Ошибка получения данных');

    // Для графика — даты и выручка
    const labels = json.revenueData.map((item: any) =>
      format(new Date(item.date), 'dd MMM', { locale: ru })
    );
    const revenueData = json.revenueData.map((item: any) => item.revenue);
    setRevenueChange(json.revenueChange);
    setAvgOrderChange(json.avgOrderChange);
    setOrderCountChange(json.orderCountChange);
    setLabels(labels);
    setRevenueData(revenueData);
    setTotalRevenue(json.totalRevenue);
    setAverageOrderValue(json.averageOrderValue);
    setOrderCount(json.orderCount);
    setTopDishes(json.topDishes || []);
    setWaiterPerformance(json.waiterPerformance || []);
  } catch (err: any) {
    console.error('Ошибка при получении данных:', err.message);
  } finally {
    setIsLoading(false);
  }
};



  // При смене timeframe или при первом рендере подгружаем данные
  useEffect(() => {
    fetchData();
  }, [timeframe]);

  // Данные для графиков
  const revenueChartData = {
    labels,
    datasets: [
      {
        label: 'Выручка',
        data: revenueData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const topDishesChartData = {
    labels: topDishes.map(d => d.name),
    datasets: [
      {
        label: 'Выручка',
        data: topDishes.map(d => d.revenue),
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
          <p className="text-sm text-gray-500">
            Аналитика работы ресторана
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={timeframe === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('week')}
          >
            Неделя
          </Button>
          <Button
            variant={timeframe === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('month')}
          >
            Месяц
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Calendar size={16} />}
            isLoading={isLoading}
            onClick={fetchData}
          >
            Обновить
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border-primary-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Общая выручка</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString('ru-RU')} ₽</h3>
              <p className="text-xs text-primary-700 mt-1 flex items-center">
                {revenueChange >= 0 ? <ChevronsUp size={16} /> : <ChevronsDown size={16} />}
                <span>
                  {revenueChange > 0 && "+"}{revenueChange}% с прошлой недели
                </span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-secondary-50 border-secondary-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-100 text-secondary-600 mr-4">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">Средний чек</p>
              <h3 className="text-2xl font-bold text-gray-900">{averageOrderValue.toLocaleString('ru-RU')} ₽</h3>
              <p className="text-xs text-secondary-700 mt-1 flex items-center">
                {avgOrderChange >= 0 ? <ChevronsUp size={16} /> : <ChevronsDown size={16} />}
                <span>
                  {avgOrderChange > 0 && "+"}{avgOrderChange}% с прошлой недели
                </span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-accent-50 border-accent-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-100 text-accent-600 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-accent-600">Количество заказов</p>
              <h3 className="text-2xl font-bold text-gray-900">{orderCount}</h3>
              <p className="text-xs text-error-700 mt-1 flex items-center">
                {orderCountChange >= 0 ? <ChevronsUp size={16} /> : <ChevronsDown size={16} />}
                <span>
                  {orderCountChange > 0 && "+"}{orderCountChange}% с прошлой недели
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Динамика выручки"
          subtitle="Ежедневный доход ресторана"
          icon={<BarChart2 size={20} />}
          className="lg:col-span-2"
        >
          <div className="h-72">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: context => `${context.parsed.y.toLocaleString('ru-RU')} ₽`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => value.toLocaleString('ru-RU') + ' ₽',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card title="Популярные блюда" subtitle="Топ-5 по выручке">
          <div className="h-80">
            <Bar
              data={topDishesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: context => `${context.parsed.x.toLocaleString('ru-RU')} ₽`,
                    },
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => value.toLocaleString('ru-RU') + ' ₽',
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card title="Эффективность официантов" subtitle="По сумме заказов">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заказы</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Выручка</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waiterPerformance.map((waiter, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{waiter.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{waiter.orderCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{waiter.revenue.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
