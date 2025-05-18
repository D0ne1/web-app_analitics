import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import axios from 'axios';
import { Dish } from '../../types';

type Category = { id: number; name: string };

const DishesPage: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDish, setNewDish] = useState<Partial<Dish>>({
    name: '',
    categoryId: undefined,
    price: 0,
    isAvailable: true
  });
  const [editDish, setEditDish] = useState<Partial<Dish> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api/dish-categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Ошибка при загрузке категорий:', err));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api/dishes')
      .then(res => {
        const formatted = res.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          categoryId: d.categoryId,
          category: d.categoryName, // для отображения
          price: d.price,
          isAvailable: d.isAvailable,
        }));
        setDishes(formatted);
      })
      .catch(err => console.error('Ошибка при загрузке блюд:', err));
  }, []);

  const openEditModal = (dish: Dish) => {
    setEditDish({
      id: dish.id,
      name: dish.name,
      categoryId: dish.categoryId,
      price: dish.price,
      isAvailable: dish.isAvailable
    });
    setShowEditModal(true);
  };

  const handleUpdateDish = () => {
    if (
      !editDish?.id ||
      !editDish.name ||
      !editDish.categoryId ||
      editDish.price === undefined
    ) return;

    axios.patch(`http://localhost:5000/api/dishes/${editDish.id}`, {
      name: editDish.name,
      categoryId: editDish.categoryId,
      price: editDish.price,
      isAvailable: editDish.isAvailable,
    })
      .then(res => {
        // Подразумевается, что сервер возвращает объект блюда с categoryName и categoryId
        const updated = {
          ...res.data,
          categoryId: res.data.categoryId,
          category: res.data.categoryName,
          isAvailable: res.data.isAvailable,
        };
        setDishes(prev => prev.map(d => (d.id === editDish.id ? updated : d)));
        setShowEditModal(false);
        setEditDish(null);
      })
      .catch(err => {
        console.error('Ошибка при обновлении блюда:', err);
      });
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddDish = () => {
    if (newDish.name && newDish.categoryId && newDish.price !== undefined) {
      axios.post('http://localhost:5000/api/dishes', {
        name: newDish.name,
        categoryId: newDish.categoryId,
        price: newDish.price,
        isAvailable: newDish.isAvailable ?? true
      })
        .then(res => {
          const added = {
            ...res.data,
            categoryId: res.data.categoryId,
            category: categories.find(cat => cat.id === res.data.categoryId)?.name || '',
            isAvailable: res.data.isAvailable,
          };
          setDishes([...dishes, added]);
          setShowAddModal(false);
          setNewDish({ name: '', categoryId: undefined, price: 0, isAvailable: true });
        })
        .catch(err => {
          console.error('Ошибка при добавлении блюда:', err);
        });
    }
  };

  const handleDeleteDish = (id: number) => {
    axios.delete(`http://localhost:5000/api/dishes/${id}`)
      .then(() => {
        setDishes(dishes.filter(d => d.id !== id));
      })
      .catch(err => {
        console.error('Ошибка при удалении блюда:', err);
      });
  };

  const handleToggleAvailability = (id: number) => {
    const dish = dishes.find(d => d.id === id);
    if (!dish) return;

    axios.patch(`http://localhost:5000/api/dishes/${id}/toggle`, {
      isAvailable: !dish.isAvailable
    })
      .then(res => {
        setDishes(dishes.map(d =>
          d.id === id ? { ...d, isAvailable: res.data.isAvailable } : d
        ));
      })
      .catch(err => {
        console.error('Ошибка при обновлении доступности блюда:', err);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Блюда</h1>
          <p className="text-sm text-gray-500">Управление меню ресторана</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => setShowAddModal(true)}
        >
          Добавить блюдо
        </Button>
      </div>

      <Card>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Поиск блюд..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="border border-gray-300 rounded-md px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDishes.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{dish.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{dish.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dish.price} ₽</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleAvailability(dish.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dish.isAvailable
                          ? 'bg-success-100 text-success-800'
                          : 'bg-error-100 text-error-800'
                      }`}
                    >
                      {dish.isAvailable ? 'Доступно' : 'Недоступно'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 size={16} />}
                        onClick={() => openEditModal(dish)}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => handleDeleteDish(dish.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить новое блюдо</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                />
              </div>
              <div>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newDish.categoryId ?? ''}
                  onChange={e => setNewDish({ ...newDish, categoryId: Number(e.target.value) })}
                >
                  <option value="" disabled>Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Цена</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newDish.price}
                  onChange={(e) => setNewDish({ ...newDish, price: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={newDish.isAvailable}
                  onChange={(e) => setNewDish({ ...newDish, isAvailable: e.target.checked })}
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Доступно для заказа
                </label>
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
                onClick={handleAddDish}
              >
                Добавить
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editDish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Изменить блюдо</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={editDish.name}
                  onChange={(e) => setEditDish({ ...editDish, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Категория</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={editDish.categoryId ?? ''}
                  onChange={e => setEditDish({ ...editDish, categoryId: Number(e.target.value) })}
                >
                  <option value="" disabled>Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Цена</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={editDish.price}
                  onChange={(e) => setEditDish({ ...editDish, price: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={editDish.isAvailable}
                  onChange={(e) => setEditDish({ ...editDish, isAvailable: e.target.checked })}
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Доступно для заказа
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                leftIcon={<X size={18} />}
                onClick={() => { setShowEditModal(false); setEditDish(null); }}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                leftIcon={<Check size={18} />}
                onClick={handleUpdateDish}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DishesPage;