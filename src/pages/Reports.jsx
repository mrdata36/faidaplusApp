import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useDataSync } from '../context/DataSyncContext';
import { useLanguage } from '../context/LanguageContext';

const reportTypes = [
  { label_key: 'daily_report', value: 'daily' },
  { label_key: 'weekly_report', value: 'weekly' },
  { label_key: 'monthly_report', value: 'monthly' },
  { label_key: 'custom_report', value: 'custom' }
];

const Reports = () => {
  const [type, setType] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { syncKey } = useDataSync();
  const { t } = useLanguage();

  const canSubmit = useMemo(() => type !== 'custom' || (startDate && endDate), [type, startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController();
    fetchReport(controller.signal);
    return () => controller.abort();
  }, [type, syncKey]);

  const fetchReport = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const params = { type, startDate, endDate };
      const response = await axios.get('/api/reports', { params, signal });
      setReport(response.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.error || 'Unable to load report');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await fetchReport();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-battery rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
                {t('financial_reports')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('reports_desc')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[200px_1fr_auto]">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {t('statement_type')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
              >
                {reportTypes.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.label_key)}</option>
                ))}
              </select>
            </div>

            {type === 'custom' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    {t('date')} ({t('add')} - {t('from') || 'from'})
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    {t('date')} ({t('to') || 'to'})
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex items-end">
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full md:w-auto bg-brand-bluecola text-white px-6 py-2 rounded-lg hover:bg-brand-trueblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {loading ? t('generating') : t('generate_report')}
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bluecola"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : report ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('total_revenue')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(report.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('total_expenses')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(report.totalExpense)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-picton/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-brand-bluecola" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('net_profit')}</p>
                    <p className={`text-2xl font-bold ${
                      report.netProfit >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(report.netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-brand-bluecola" />
                {t('transaction_summary')}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">{t('income_transactions')}</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{report.incomeCount}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">{t('expense_transactions')}</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{report.expenseCount}</p>
                </div>
                <div className="bg-brand-picton/10 border border-brand-picton/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-brand-bluecola mb-1">{t('total_transactions')}</p>
                  <p className="text-2xl font-bold text-brand-trueblue">{report.totalTransactions}</p>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-brand-bluecola" />
                {t('category_breakdown')}
              </h2>
              <div className="space-y-3">
                {report.categories.map((entry, index) => (
                  <div key={entry.category} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index % 5 === 0 ? 'bg-brand-picton' :
                        index % 5 === 1 ? 'bg-brand-battery' :
                        index % 5 === 2 ? 'bg-brand-bluecola' :
                        index % 5 === 3 ? 'bg-brand-trueblue' :
                        'bg-brand-absolutezero'
                      }`}></div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{t(entry.category)}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(entry.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('no_report_yet')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('select_report_desc')}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
