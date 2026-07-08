import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, Search, Trash2, Edit, X, CreditCard, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/format';
import { useDataSync } from '../context/DataSyncContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

const transactionCategories = {
  income: ['Sales', 'Service', 'Interest', 'Other Income'],
  expense: [
    'Advertising',
    'Delivery/Freight',
    'Depreciation',
    'Insurance',
    'Interest Expense',
    'Office Supplies',
    'Rent/Lease',
    'Maintenance/Repairs',
    'Travel',
    'Wages/Salaries',
    'Utilities/Telephone',
    'Other Expense'
  ]
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [filters, setFilters] = useState({ type: '', category: '', search: '', startDate: '', endDate: '' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'income', amount: '', category: 'Sales', description: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const { notifyDataChange } = useDataSync();
  const { notifyNewNotification } = useNotifications();
  const { t } = useLanguage();

  const categoryOptions = useMemo(() => transactionCategories[form.type], [form.type]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTransactions(controller.signal);
    return () => controller.abort();
  }, [filters, meta.page]);

  const fetchTransactions = async (signal) => {
    setLoading(true);
    try {
      const params = {
        page: meta.page,
        limit: meta.limit,
        type: filters.type || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };
      const response = await axios.get('/api/transactions', { params, signal });
      setTransactions(response.data.transactions);
      setMeta((prev) => ({ ...prev, totalPages: response.data.meta.totalPages }));
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (transaction = null) => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date
      });
      setSelectedTransaction(transaction);
    } else {
      setSelectedTransaction(null);
      setForm({ type: 'income', amount: '', category: 'Sales', description: '', date: new Date().toISOString().slice(0, 10) });
    }
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveTransaction = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (selectedTransaction) {
        await axios.put(`/api/transactions/${selectedTransaction.id}`, form);
      } else {
        await axios.post('/api/transactions', form);
      }
      await fetchTransactions();
      notifyDataChange();
      notifyNewNotification();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = (id) => {
    setConfirmConfig({
      title: t('confirm_delete_title') || 'Confirm Deletion',
      message: t('confirm_delete_msg') || 'Are you absolutely sure you want to delete this item? This action is irreversible.',
      onConfirm: async () => {
        setConfirmOpen(false);
        try {
          await axios.delete(`/api/transactions/${id}`);
          await fetchTransactions();
          notifyDataChange();
        } catch (err) {
          console.error(err);
        }
      }
    });
    setConfirmOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-trueblue rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
                {t('transactions')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('transactions_desc')}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Filter className="w-4 h-4 text-brand-bluecola" />
              {showFilters ? t('hide_filters') || 'Hide Filters' : t('show_filters') || 'Show Filters'}
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-brand-picton text-white px-6 py-3 rounded-xl hover:bg-brand-battery transition-all duration-200 shadow-sm font-semibold"
            >
              <PlusCircle className="w-5 h-5" />
              {t('add_transaction')}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-brand-bluecola" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('filter_by_type')}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {t('transaction_type')}
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                >
                  <option value="">{t('all')}</option>
                  <option value="income">{t('income')}</option>
                  <option value="expense">{t('expense')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {t('transaction_category')}
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                >
                  <option value="">{t('all')}</option>
                  {transactionCategories.income.map((category) => (
                    <option key={category} value={category}>{t(category)}</option>
                  ))}
                  {transactionCategories.expense.map((category) => (
                    <option key={category} value={category}>{t(category)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {t('date')} ({t('add')} - {t('from') || 'from'})
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {t('date')} ({t('to') || 'to'})
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {t('search')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="search"
                    name="search"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    placeholder={t('search_placeholder')}
                    className="w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bluecola"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {t('no_transactions_found')}
                  </h3>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {t('date')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {t('description')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {t('category')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {t('amount')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {t('type')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {t('actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {transaction.description || '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {t(transaction.category)}
                            </td>
                            <td className={`px-6 py-4 text-sm font-semibold ${
                              transaction.type === 'income'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              <div className="flex items-center gap-2">
                                {transaction.type === 'income' ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : (
                                  <TrendingDown className="w-4 h-4" />
                                )}
                                {formatCurrency(transaction.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'income'
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              }`}>
                                {transaction.type === 'income' ? t('income') : t('expense')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm space-x-3">
                              <button
                                onClick={() => openModal(transaction)}
                                className="text-brand-bluecola hover:text-brand-trueblue transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => deleteTransaction(transaction.id)}
                                className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(transaction.date)}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            transaction.type === 'income'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          }`}>
                            {transaction.type === 'income' ? t('income') : t('expense')}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {transaction.description || '—'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {t(transaction.category)}
                            </p>
                          </div>
                          <div className={`text-base font-bold text-right shrink-0 ${
                            transaction.type === 'income'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 pt-1 border-t border-slate-50 dark:border-slate-700/30">
                          <button
                            onClick={() => openModal(transaction)}
                            className="flex items-center gap-1 text-xs text-brand-bluecola hover:text-brand-trueblue transition-colors font-semibold cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {transactions.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t('page') || 'Page'} {meta.page} {t('of') || 'of'} {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('previous') || 'Previous'}
                  </button>
                  <button
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('next') || 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeModal}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-100 dark:border-slate-700/80"
              >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {selectedTransaction ? t('edit_transaction_title') : t('new_transaction_title')}
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={saveTransaction} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('transaction_type')}
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={(e) => {
                        handleChange(e);
                        setForm((prev) => ({ ...prev, category: transactionCategories[e.target.value][0] }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    >
                      <option value="income">{t('income')}</option>
                      <option value="expense">{t('expense')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('transaction_amount')}
                    </label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('transaction_category')}
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>{t(option)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('transaction_date')}
                    </label>
                    <input
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('transaction_desc_label')}
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Add a description..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-brand-picton text-white hover:bg-brand-battery transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                      {saving ? t('loading') : t('save')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
};

export default Transactions;
