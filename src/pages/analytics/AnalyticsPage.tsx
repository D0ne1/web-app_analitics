import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Calendar, BarChart2, TrendingUp, RefreshCcw } from "lucide-react";
// import { format } from "date-fns";
// import { ru } from "date-fns/locale";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Forecast {
  dish_id: number;
  dish_name: string;
  week_forecast: number;
  month_forecast: number;
}

const AnalyticsPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");

  const fetchForecasts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forecasts?timeframe=${timeframe}`,
      );
      const json = await res.json();
      console.log("Ответ /api/forecasts:", json);
      setForecasts(json);
    } catch (err) {
      console.error("Ошибка загрузки прогнозов:", err);
    } finally {
      setIsLoading(false);
    }
  };



const handleRefresh = async () => {
  setIsLoading(true);
  try {
    // 1. Генерируем новый прогноз
    await fetch("http://localhost:5000/api/generate-forecast", { method: "POST" });
    // 2. Загружаем обновлённые прогнозы
    await fetchForecasts();
  } catch (e) {
    alert("Ошибка при обновлении прогноза");
  } finally {
    setIsLoading(false);
  }
};



  useEffect(() => {
    fetchForecasts();
  }, [timeframe]);

  // Данные для графика
 const barChartData = {
  labels: forecasts.map((f) => f.dish_name),
  datasets: [
    {
      label: timeframe === "week" ? "Прогноз на неделю, порций" : "Прогноз на месяц, порций",
      data: timeframe === "week"
        ? forecasts.map((f) => f.week_forecast)
        : forecasts.map((f) => f.month_forecast),
      backgroundColor: "rgba(37, 99, 235, 0.7)",
      borderRadius: 8,
    },
  ],
};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={28} className="text-primary-600" />
            Прогноз продаж блюд
          </h1>
          <p className="text-sm text-gray-500">
            Аналитика прогнозируемых продаж по каждому блюду
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={timeframe === "week" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTimeframe("week")}
            leftIcon={<Calendar size={16} />}
          >
            Неделя
          </Button>
          <Button
            variant={timeframe === "month" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTimeframe("month")}
            leftIcon={<TrendingUp size={16} />}
          >
            Месяц
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCcw size={16} />}
            isLoading={isLoading}
            onClick={handleRefresh}
          >
            Обновить прогноз
          </Button>
        </div>
      </div>

      <Card title="График прогнозируемых продаж">
        <div className="h-96">
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.parsed.y} порций`,
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Порций" },
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </Card>

      <Card title="Таблица прогноза по блюдам">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Блюдо
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Прогноз на неделю
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Прогноз на месяц
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecasts.map((f) => (
                <tr key={f.dish_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {f.dish_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-primary-700 font-semibold">
                    {f.week_forecast} порций
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-secondary-700 font-semibold">
                    {f.month_forecast} порций
                  </td>
                </tr>
              ))}
              {forecasts.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">
                    Данные по прогнозу отсутствуют
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          * Прогноз построен на основании исторических данных и может отличаться от реальных значений
        </p>
      </Card>
    </div>
  );
};

export default AnalyticsPage;