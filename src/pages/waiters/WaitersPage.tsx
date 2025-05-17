import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, Phone } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Waiter } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';


const WaitersPage: React.FC = () => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editWaiter, setEditWaiter] = useState<Waiter | null>(null);
  const [newWaiter, setNewWaiter] = useState<Partial<Waiter>>({
    name: '',
    phone: '',
    hiredAt: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);

  // Загрузка официантов с бекенда
  const loadWaiters = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/waiters')
      .then(res => res.json())
      .then(data => {
        const normalized = data.map((w: any) => ({
          id: w.id,
          name: w.name,
          phone: w.phone,
          hiredAt: w.hired_at || w.hiredAt,
        }));
        setWaiters(normalized);
      })
      .catch(err => console.error('Ошибка загрузки официантов:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWaiters();
  }, []);

  const filteredWaiters = waiters.filter(waiter =>
    waiter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Добавление официанта через API
  const handleAddWaiter = () => {
    if (!newWaiter.name || !newWaiter.phone || !newWaiter.hiredAt) return;

    fetch('http://localhost:5000/api/waiters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newWaiter.name,
        phone: newWaiter.phone,
        hired_at: newWaiter.hiredAt,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Ошибка при добавлении официанта');
        return res.json();
      })
      .then((addedWaiter) => {
        setWaiters(prev => [...prev, {
          id: addedWaiter.id,
          name: addedWaiter.name,
          phone: addedWaiter.phone,
          hiredAt: addedWaiter.hired_at,
        }]);
        setShowAddModal(false);
        setNewWaiter({ name: '', phone: '', hiredAt: format(new Date(), 'yyyy-MM-dd') });
      })
      .catch(err => {
        alert(err.message);
        console.error(err);
      });
  };
const handleUpdateWaiter = () => {
  if (!editWaiter) return;

  fetch(`http://localhost:5000/api/waiters/${editWaiter.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: editWaiter.name,
      phone: editWaiter.phone,
      hired_at: editWaiter.hiredAt,
    }),
  })
    .then(res => {
      if (!res.ok) throw new Error('Ошибка при обновлении официанта');
      return res.json();
    })
    .then((updatedWaiter) => {
      setWaiters(prev =>
        prev.map(w => w.id === updatedWaiter.id
          ? { ...w, name: updatedWaiter.name, phone: updatedWaiter.phone, hiredAt: updatedWaiter.hired_at }
          : w
        )
      );
      setEditWaiter(null);
    })
    .catch(err => {
      alert(err.message);
      console.error(err);
    });
};

  // Удаление официанта через API
  const handleDeleteWaiter = (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить официанта?')) return;

    fetch(`http://localhost:5000/api/waiters/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Ошибка при удалении официанта');
        // После удаления обновляем список
        setWaiters(prev => prev.filter(w => w.id !== id));
      })
      .catch(err => {
        alert(err.message);
        console.error(err);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Официанты</h1>
          <p className="text-sm text-gray-500">Управление персоналом ресторана</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          Добавить официанта
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск официантов..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Телефон</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата найма</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWaiters.map((waiter) => (
                  <tr key={waiter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{waiter.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone size={16} className="mr-2" />
                        {waiter.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {waiter.hiredAt ? format(new Date(waiter.hiredAt), 'd MMMM yyyy', { locale: ru }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit2 size={16} />}
                          onClick={() => setEditWaiter(waiter)}
                        >
                          Изменить
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 size={16} />}
                          onClick={() => handleDeleteWaiter(waiter.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWaiters.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">Официанты не найдены</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить нового официанта</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ФИО</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newWaiter.name}
                  onChange={(e) => setNewWaiter({ ...newWaiter, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Телефон</label>
                <input
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newWaiter.phone}
                  onChange={(e) => setNewWaiter({ ...newWaiter, phone: e.target.value })}
                  placeholder="+7 (999) 999-99-99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата найма</label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newWaiter.hiredAt}
                  onChange={(e) => setNewWaiter({ ...newWaiter, hiredAt: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                leftIcon={<X size={18} />}
                onClick={() => setShowAddModal(false)}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                leftIcon={<Check size={18} />}
                onClick={handleAddWaiter}
              >
                Добавить
              </Button>
            </div>
          </div>
        </div>
      )}
      {editWaiter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Редактировать официанта</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ФИО</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={editWaiter.name}
                  onChange={(e) => setEditWaiter({ ...editWaiter, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Телефон</label>
                <input
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={editWaiter.phone}
                  onChange={(e) => setEditWaiter({ ...editWaiter, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата найма</label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={editWaiter.hiredAt}
                  onChange={(e) => setEditWaiter({ ...editWaiter, hiredAt: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" leftIcon={<X size={18} />} onClick={() => setEditWaiter(null)}>
                Отмена
              </Button>
              <Button variant="primary" leftIcon={<Check size={18} />} onClick={handleUpdateWaiter}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WaitersPage;
