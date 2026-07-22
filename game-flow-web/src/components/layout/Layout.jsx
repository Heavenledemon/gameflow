import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Navigation */}
      <Navbar onMenuClick={toggleSidebar} />
      
      {/* Main Content Area */}
      <div className="flex">
        {/* Side Navigation */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        
        {/* Page Content */}
        <main className="flex-1 p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
