import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShellProvider } from './context/AppShellContext';
import { useToast } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';
import ErrorReportingBoundary from './components/ErrorReportingBoundary';
import { ToastViewport } from './components/ui/Feedback';

function AppToastViewport() {
  const { toasts, removeToast } = useToast()
  return <ToastViewport toasts={toasts} onDismiss={removeToast} />
}

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
              <AppToastViewport />
              </div>
            </BrowserRouter>
          </ErrorReportingBoundary>
        </AppShellProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
