import { useState, useEffect } from 'react';
import { Menu, Bell, Search } from 'lucide-react';

const Navbar = ({ onMenuClick, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        console.log('Debounced search term:', searchTerm);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onSearch]);

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      
      {/* Left Side: Menu Toggle & Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="p-2 rounded-md hover:bg-gray-100 md:hidden" // Only show hamburger on mobile
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">GameFlow</h1>
      </div>

      {/* Right Side: Search, Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Debounced Search Input (Desktop) */}
        <div className="hidden md:flex items-center w-64 relative mr-2">
          <Search className="absolute left-3 text-gray-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search games, creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition-all duration-200"
          />
        </div>

        {/* Mobile Search Icon */}
        <button className="p-2 rounded-full hover:bg-gray-100 md:hidden">
          <Search size={20} className="text-gray-600" />
        </button>
        
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ml-2 shadow-sm cursor-pointer hover:bg-blue-700 transition-colors">
          JD
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

