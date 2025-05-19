import React from 'react';
import Button from '../../components/common/Button';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChefHat, 
  Users, 
  FileText, 
  BarChart3, 
  Upload, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  allowedRoles: Role[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, allowedRoles }) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) return null;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors ${
          isActive ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600 pl-5' : ''
        }`
      }
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 hidden md:block bg-white border-r border-gray-200 overflow-y-auto">
      <div className="py-6 px-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-primary-700">Resto`run</h2>
        <p className="text-sm text-gray-500 mt-1">Аналитика ресторана</p>
      </div>
      
      <nav className="mt-6 flex flex-col gap-1">
        <NavItem 
          to="/dashboard" 
          icon={<LayoutDashboard size={20} />} 
          label="Дашборд" 
          allowedRoles={['admin', 'analyst', 'waiter']} 
        />
        <NavItem 
          to="/dishes" 
          icon={<ChefHat size={20} />} 
          label="Блюда" 
          allowedRoles={['admin', 'analyst', 'waiter']} 
        />
        <NavItem 
          to="/waiters" 
          icon={<Users size={20} />} 
          label="Официанты" 
          allowedRoles={['admin']} 
        />
        <NavItem 
          to="/orders" 
          icon={<FileText size={20} />} 
          label="Заказы" 
          allowedRoles={['admin', 'waiter']} 
        />
        <NavItem 
          to="/analytics" 
          icon={<BarChart3 size={20} />} 
          label="Аналитика" 
          allowedRoles={['admin', 'analyst']} 
        />
        <NavItem 
          to="/uploads" 
          icon={<Upload size={20} />} 
          label="Загрузки" 
          allowedRoles={['admin', 'analyst']} 
        />
        {/* Центрируем кнопку */}
        <div className="flex justify-center my-1">
          <Button onClick={() => window.open('http://localhost:5000/api/export-full-report-pdf')}>
            Экспорт полного отчёта
          </Button>
        </div>
        <NavItem 
          to="/settings" 
          icon={<Settings size={20} />} 
          label="Настройки" 
          allowedRoles={['admin']} 
        />
      </nav>
    </aside>
  );
};

export default Sidebar;