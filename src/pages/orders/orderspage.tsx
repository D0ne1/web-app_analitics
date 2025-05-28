import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Order } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);


  // Загрузка заказов с сервера
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order =>
    order.waiterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNumber.toString().includes(searchTerm)
  );

const handleDeleteOrder = async (id: number) => {
  try {
    await axios.delete(`http://localhost:5000/api/orders/${id}`);
    // Если сервер ответил успешно, обновляем список заказов локально
    setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
  } catch (error) {
    console.error('Ошибка при удалении заказа:', error);
    alert('Не удалось удалить заказ. Попробуйте снова.');
  }
};


  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingOrder(null);
  };



// В saveEdit добавляем:
const saveEdit = async () => {
  if (!editingOrder) return;

  try {
    await axios.put(`http://localhost:5000/api/orders/${editingOrder.id}`, {
      tableNumber: editingOrder.tableNumber,
      waiterId: editingOrder.waiterId,
    });

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === editingOrder.id ? editingOrder : order
      )
    );
    closeEdit();
    //setUpdateMessage('Заказ обновлен. Пожалуйста, обновите страницу для отображения изменений.');
  } catch (err) {
    console.error('Ошибка при обновлении заказа:', err);
    setUpdateMessage('Ошибка при обновлении заказа. Попробуйте снова.');
  }
};


{updateMessage && (
  <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
    {updateMessage}
    <button
      className="ml-4 text-yellow-600 underline"
      onClick={() => setUpdateMessage(null)}
    >
      Закрыть
    </button>
  </div>
)}


  const updateEditingOrder = (field: keyof Order, value: any) => {
    if (!editingOrder) return;
    setEditingOrder({ ...editingOrder, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <p className="text-sm text-gray-500">Управление заказами ресторана</p>
        </div>
      </div>
      {updateMessage && (
        <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded relative">
          {updateMessage}
          <button
            onClick={() => setUpdateMessage(null)}
            className="absolute top-1 right-2 text-yellow-700 font-bold"
            aria-label="Закрыть сообщение"
          >
            ×
          </button>
        </div>
      )}
      <Card>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск по официанту или столу..."
            className="pl-4 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата заказа</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Стол</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Официант</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Блюда</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.orderDate), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.tableNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.waiterName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.totalAmount} ₽</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.items.map(item => (
                      <div key={item.id}>
                        {item.dishName} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 size={16} />}
                        onClick={() => openEdit(order)}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Заказы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isEditOpen && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Редактировать заказ #{editingOrder.id}</h2>

            <label className="block mb-2 font-medium">Номер стола</label>
            <input
              type="number"
              value={editingOrder.tableNumber}
              onChange={e => updateEditingOrder('tableNumber', parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              min={1}
            />

            <label className="block mb-2 font-medium">ID официанта</label>
            <input
              type="number"
              value={editingOrder.waiterId}
              onChange={e => updateEditingOrder('waiterId', parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              min={1}
            />

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={closeEdit}>Отмена</Button>
              <Button onClick={saveEdit}>Сохранить</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
