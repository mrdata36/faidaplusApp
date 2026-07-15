import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  CreditCard,
  Package,
  FileText,
  Bell,
  Settings,
  LogOut,
  Moon,
  SunMedium,
  Menu,
  ChevronRight,
  User,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { language, changeLanguage, t } = useLanguage();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: Home, label: t('dashboard'), key: 'dashboard' },
    { path: '/transactions', icon: CreditCard, label: t('transactions'), key: 'transactions' },
    { path: '/products', icon: Package, label: t('products'), key: 'products' },
    { path: '/reports', icon: FileText, label: t('reports'), key: 'reports' },
    { path: '/notifications', icon: Bell, label: t('notifications'), key: 'notifications' },
    { path: '/settings', icon: Settings, label: t('settings'), key: 'settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      
      {/* DESKTOP PERSISTENT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 sidebar-bg sidebar-border border-r shrink-0 h-screen sticky top-0 z-20 print:hidden">
        {/* Brand / Logo Header */}
        <div className="p-6 sidebar-border border-b flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-semibold text-lg tracking-tight leading-none">Faida Plus</h1>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">{t('enterprise_view')}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('management')}</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isNotification = item.path === '/notifications';
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 gap-3 text-sm font-medium ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className="h-4.5 w-4.5" />
                  {isNotification && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] rounded-full h-4.5 w-4.5 flex items-center justify-center font-bold ring-2 ring-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 opacity-75" />}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Profile / Footer */}
        <div className="p-4 sidebar-border border-t bg-slate-100 dark:bg-slate-950/30 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-semibold shrink-0">
              {user?.full_name?.charAt(0).toUpperCase() || <User className="h-4 w-4 text-slate-400" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-none mb-1">{user?.full_name || 'Admin User'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.business_name || 'Business Manager'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-red-950/40 hover:text-slate-900 dark:hover:text-red-400 p-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR (sticky on desktop and mobile) */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm transition-colors duration-300 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Brand Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-slate-950 dark:text-white text-base">FaidaPlus</span>
            </Link>

            {/* Desktop Page Title / Business context */}
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('financial_portal')}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{user?.business_name || t('enterprise_view')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick action or Business context widget */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="font-medium">{user?.business_name || t('live_account')}</span>
            </div>

            {/* Language Selector Button */}
            <button
              onClick={() => changeLanguage(language === 'en' ? 'sw' : 'en')}
              className="inline-flex h-10 px-3.5 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95"
              title={language === 'en' ? 'Badilisha kwenda Kiswahili' : 'Switch to English'}
            >
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              <span>{language === 'en' ? 'EN' : 'SW'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunMedium className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-blue-600" />}
            </button>
          </div>
        </header>

        {/* PAGE DYNAMIC CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-visible">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* MOBILE FULLY RESPONSIVE SLIDING DRAWER */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-300 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 z-50 h-full w-72 overflow-y-auto sidebar-bg text-slate-900 dark:text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">F</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">FaidaPlus</h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('business_control_panel')}</span>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-slate-100 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold block mb-1">{t('active_workspace')}</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[180px] block">{user?.business_name || 'Workspace'}</span>
          </div>
          {/* Mobile language switch inside drawer header */}
          <button
            onClick={() => changeLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
          >
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>{language === 'en' ? 'EN' : 'SW'}</span>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl gap-3 text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 absolute bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-950">
          <div className="mb-4 px-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">👤 {user?.full_name || 'User Account'}</p>
          </div>
          <button
            onClick={() => {
              logout();
              setDrawerOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/95 p-2.5 text-xs font-semibold text-white hover:bg-red-700 transition"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg safe-area-bottom print:hidden">
        <nav className="flex items-center justify-around py-1">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold transition-colors ${
                  active ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600"
          >
            <Menu className="h-4.5 w-4.5" />
            <span>{t('more')}</span>
          </button>
        </nav>
      </div>

    </div>
  );
};

export default Layout;
