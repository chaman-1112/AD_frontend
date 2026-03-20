import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import RunDetailPage from './pages/RunDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { apiFetch } from './lib/api.js';
import './index.css';

/**
 * Single layout for all protected routes — stays mounted when you move between /, /history, etc.
 * Before: each route had its own RequireAuth, so every navigation remounted state, showed
 * "Checking session..." again, and a flaky /me could 401 and send you back to login.
 */
function RequireAuthLayout() {
    const [loading, setLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const authCheckSeq = React.useRef(0);

    React.useEffect(() => {
        const seq = ++authCheckSeq.current;
        let cancelled = false;

        apiFetch('/api/auth/me')
            .then((res) => {
                if (cancelled || seq !== authCheckSeq.current) return;
                setIsAuthenticated(res.ok);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled || seq !== authCheckSeq.current) return;
                setIsAuthenticated(false);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                Checking session...
            </div>
        );
    }
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<RequireAuthLayout />}>
                    <Route index element={<App />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="history/:runId" element={<RunDetailPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
