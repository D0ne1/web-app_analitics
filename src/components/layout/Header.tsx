import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center md:hidden">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div className="flex-1 md:text-center md:flex-initial">
        <h1 className="text-xl font-semibold text-gray-800">Resto&#96;run</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Bell icon and notification badge removed */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <User size={16} />
            </div>
            <span className="hidden md:inline font-medium">{user?.username}</span>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 animate-fade-in">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                Роль: {user?.role === 'admin' ? 'Администратор' : user?.role === 'analyst' ? 'Аналитик' : 'Официант'}
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;