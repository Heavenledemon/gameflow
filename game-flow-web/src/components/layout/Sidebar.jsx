import { X } from 'lucide-react';
import { navItems } from '../../data/navItems';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* 1. Mobile Overlay (Darkens background when sidebar is open on small screens) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose} 
          aria-label="Close sidebar"
        />
      )}

      {/* 2. Sidebar Container */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40
        transform transition-all duration-300 ease-in-out group
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
        md:translate-x-0 md:static md:shadow-none
        md:w-16 md:hover:w-64 /* Collapsed by default, expands on hover on desktop */
      `}>
        
        {/* Mobile Close Button */}
        <div className="flex justify-end p-2 md:hidden">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* 3. Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.id} item={item} />
          ))}
        </nav>
      </aside>
    </>
  );
};

// --- Sub-component for a single link ---
const SidebarLink = ({ item }) => {
  const Icon = item.icon;
  
  return (
    <a 
      href={item.href} 
      className="flex items-center gap-4 px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors overflow-hidden whitespace-nowrap"
    >
      <Icon size={20} className="text-gray-500 flex-shrink-0" />
      <span className="font-medium transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
        {item.label}
      </span>
    </a>
  );
};

export default Sidebar;
