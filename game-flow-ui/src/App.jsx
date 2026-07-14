import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShellProvider } from './context/AppShellContext';
import AppRoutes from './routes/AppRoutes';
import ErrorReportingBoundary from './components/ErrorReportingBoundary';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShellProvider>
          <ErrorReportingBoundary>
            <BrowserRouter>
              <div className="app-shell">
                <div style={{ width: '100%', maxWidth: 430 }}>
                  <AppRoutes />
                </div>
              </div>
            </BrowserRouter>
          </ErrorReportingBoundary>
        </AppShellProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
