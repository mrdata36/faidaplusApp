import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import axios from 'axios';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import Layout from '../components/Layout';
import { useDataSync } from '../context/DataSyncContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const chartColors = ['var(--brand-1)', 'var(--brand-2)', 'var(--brand-3)', 'var(--brand-4)'];

const Dashboard = () => {
  const [summary, setSummary] = useState({ income: 0, expenses: 0, profit: 0, lowStockCount: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartTheme, setChartTheme] = useState({
    axis: 'var(--text-secondary)',
    grid: 'var(--border)',
    tooltipBg: 'var(--surface)',
    tooltipText: 'var(--text)',
    legendText: 'var(--text)',
  });
  const { syncKey } = useDataSync();
  const { theme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    fetchDashboard();
  }, [syncKey]);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setChartTheme({
      axis: styles.getPropertyValue('--text-tertiary').trim() || '#94A3B8',
      grid: styles.getPropertyValue('--border').trim() || '#E2E8F0',
      tooltipBg: styles.getPropertyValue('--surface').trim() || '#FFFFFF',
      tooltipText: styles.getPropertyValue('--text').trim() || '#0F172A',
      legendText: styles.getPropertyValue('--text').trim() || '#0F172A',
    });
  }, [theme]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, chartResponse, pieResponse, recentResponse] = await Promise.all([
        axios.get('/api/dashboard/summary'),
        axios.get('/api/dashboard/chart'),
        axios.get('/api/dashboard/pie'),
        axios.get('/api/transactions', { params: { page: 1, limit: 5 } }),
      ]);

      setSummary(summaryResponse.data || { income: 0, expenses: 0, profit: 0, lowStockCount: 0 });
      setChartData(Array.isArray(chartResponse.data) ? chartResponse.data : []);
      setPieData(Array.isArray(pieResponse.data) ? pieResponse.data : []);
      setRecentTransactions(Array.isArray(recentResponse.data?.transactions) ? recentResponse.data.transactions : []);
    } catch (fetchError) {
      console.error('Failed to load dashboard data:', fetchError);
      setError('Unable to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  const insights = [
    {
      title: t('revenue_pulse'),
      description: summary.profit >= 0 ? t('profit_stable') : t('costs_outpacing'),
      badge: summary.profit >= 0 ? t('on_track') : t('needs_attention'),
      accent: summary.profit >= 0 ? 'bg-primary-green/10 text-primary-green' : 'bg-danger/10 text-danger',
    },
    {
      title: t('stock_watch'),
      description: `${summary.lowStockCount} ${summary.lowStockCount === 1 ? t('single_stock_alert') : t('low_stock_alert')}`, 
      badge: t('inventory'),
      accent: 'bg-brand-picton/10 text-brand-trueblue',
    },
    {
      title: t('growth_insight'),
      description: t('marketing_focus'),
      badge: t('ai_insight'),
      accent: 'bg-primary-blue/10 text-primary-blue',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-primary-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="card border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard')}</p>
              <h1 className="mt-3 text-3xl font-display font-semibold text-slate-950 dark:text-white">{t('growth_hub')}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                {t('dashboard_desc')}
              </p>
            </div>
            <div className="inline-flex items-center rounded-3xl border border-primary-blue/20 bg-primary-blue/10 px-4 py-3 text-sm font-semibold text-primary-blue">
              {t('live_sync')}
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-[28px] border border-danger/20 bg-danger/10 p-6 text-danger">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <StatCard label={t('total_income')} value={formatCurrency(summary.income)} icon={<TrendingUp className="w-5 h-5 text-[var(--success)]" />} highlight="bg-[var(--success)]/10 text-[var(--success)]" />
          <StatCard label={t('total_expenses')} value={formatCurrency(summary.expenses)} icon={<TrendingDown className="w-5 h-5 text-[var(--danger)]" />} highlight="bg-[var(--danger)]/10 text-[var(--danger)]" />
          <StatCard label={t('net_profit')} value={formatCurrency(summary.profit)} icon={<DollarSign className={`w-5 h-5 ${summary.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} />} highlight={summary.profit >= 0 ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'} />
          <StatCard label={t('low_stock')} value={summary.lowStockCount} icon={<Package className="w-5 h-5 text-[var(--warning)]" />} highlight="bg-[var(--warning)]/10 text-[var(--warning)]" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('income_vs_expenses')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('weekly_trend')}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('auto_updating')}</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="date" tickLine={false} tick={{ fill: chartTheme.axis }} axisLine={{ stroke: chartTheme.axis }} />
                  <YAxis tickLine={false} tick={{ fill: chartTheme.axis }} axisLine={{ stroke: chartTheme.axis }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.grid, color: chartTheme.tooltipText }}
                    labelStyle={{ color: chartTheme.axis }}
                    itemStyle={{ color: chartTheme.tooltipText }}
                  />
                  <Legend wrapperStyle={{ color: chartTheme.legendText }} />
                  <Line type="monotone" dataKey="income" name={t('income')} stroke="var(--success)" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expense" name={t('expense')} stroke="var(--danger)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('expense_breakdown')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('monthly_spend')}</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={Array.isArray(pieData) ? pieData : []} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={4}>
                    {Array.isArray(pieData)
                      ? pieData.map((entry, index) => (
                          <Cell key={entry.category || index} fill={chartColors[index % chartColors.length]} />
                        ))
                      : null}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {insights.map((insight) => (
            <motion.div 
              key={insight.title} 
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="card p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-semibold text-slate-950 dark:text-white">{insight.title}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${insight.accent}`}>{insight.badge}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{insight.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('recent_transactions')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('recent_desc')}</p>
            </div>
            <Link to="/transactions" className="inline-flex items-center rounded-full bg-primary-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-picton">
              {t('view_all_transactions')}
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {t('no_transactions_yet')}
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-900 dark:text-slate-200">
                  <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">{t('date')}</th>
                      <th className="px-4 py-3">{t('description')}</th>
                      <th className="px-4 py-3">{t('category')}</th>
                      <th className="px-4 py-3">{t('amount')}</th>
                      <th className="px-4 py-3">{t('type')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                        <td className="px-4 py-3">{transaction.date}</td>
                        <td className="px-4 py-3">{transaction.description || '—'}</td>
                        <td className="px-4 py-3">{transaction.category}</td>
                        <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{formatCurrency(transaction.amount)}</td>
                        <td className="px-4 py-3 uppercase text-xs tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          {transaction.type === 'income' ? t('income') : t('expense')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Card View */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="py-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {transaction.description || '—'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <span>{transaction.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        {transaction.type === 'income' ? t('income') : t('expense')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value, icon, highlight }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="card p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white tracking-tight">{value}</p>
      </div>
      <div className={`rounded-2xl p-3 flex items-center justify-center ${highlight}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

export default Dashboard;
