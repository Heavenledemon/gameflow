import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShellProvider } from './context/AppShellContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShellProvider>
          <BrowserRouter>
        <div className="app-shell">
          <div style={{ width: '100%', maxWidth: 430 }}>
            <AppRoutes />
          </div>
        </div>
          </BrowserRouter>
        </AppShellProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
