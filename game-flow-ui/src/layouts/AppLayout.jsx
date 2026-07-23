import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileAppShell from '../components/layout/MobileAppShell';
import BottomNav from '../components/navigation/BottomNav';
import { useAppShell } from '../context/AppShellContext';

const AppLayout = () => {
  const { pathname } = useLocation();
  const { topBar, clearTopBar, immersiveMode, exitImmersiveMode } = useAppShell();

  useEffect(() => {
    return () => {
      clearTopBar();
      exitImmersiveMode();
    };
  }, [pathname, clearTopBar, exitImmersiveMode]);

  return (
    <MobileAppShell
      topBar={topBar}
      bottomNavigation={<BottomNav />}
      showBottomNavigation={!immersiveMode}
      immersive={immersiveMode}
    >
      <Outlet />
    </MobileAppShell>
  );
};

export default AppLayout;
