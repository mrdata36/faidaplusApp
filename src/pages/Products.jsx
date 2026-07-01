import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PlusCircle, ShoppingCart, Edit, Trash2, DollarSign, X, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { formatCurrency } from '../utils/format';
import { useDataSync } from '../context/DataSyncContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

const productCategories = ['Food', 'Electronics', 'Clothing', 'Services', 'Other'];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [form, setForm] = useState({ product_name: '', category: 'Food', buying_price: '', selling_price: '', quantity: 0, low_stock_threshold: 5 });
  const [saleForm, setSaleForm] = useState({ quantity_sold: 1 });
  const [error, setError] = useState('');
  const { notifyDataChange } = useDataSync();
  const { notifyNewNotification } = useNotifications();
  const { t } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchProducts = async (signal) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/products', { signal });
      setProducts(response.data.products);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setForm({
        product_name: product.product_name,
        category: product.category,
        buying_price: product.buying_price,
        selling_price: product.selling_price,
        quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold
      });
    } else {
      setSelectedProduct(null);
      setForm({ product_name: '', category: 'Food', buying_price: '', selling_price: '', quantity: 0, low_stock_threshold: 5 });
    }
    setError('');
    setModalOpen(true);
  };

  const openSaleModal = (product) => {
    setSelectedProduct(product);
    setSaleForm({ quantity_sold: 1 });
    setSaleOpen(true);
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaleChange = (e) => {
    const { name, value } = e.target;
    setSaleForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (selectedProduct) {
        await axios.put(`/api/products/${selectedProduct.id}`, form);
      } else {
        await axios.post('/api/products', form);
      }
      await fetchProducts();
      notifyDataChange();
      notifyNewNotification();
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save product');
      console.error(err);
    }
  };

  const sellProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`/api/products/${selectedProduct.id}/sell`, saleForm);
      await fetchProducts();
      notifyDataChange();
      notifyNewNotification();
      setSaleOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to record sale');
      console.error(err);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm(t('delete') + '?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      await fetchProducts();
      notifyDataChange();
    } catch (err) {
      console.error(err);
    }
  };

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { status: t('out_of_stock'), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: AlertTriangle };
    if (product.quantity <= product.low_stock_threshold) return { status: t('low_stock'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: AlertTriangle };
    return { status: t('in_stock'), color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle };
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-battery rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
                {t('inventory_hub')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t('inventory_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-3 rounded-lg hover:bg-brand-trueblue transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            {t('add_product')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bluecola"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {t('no_products_found')}
            </h3>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product) => {
              const stockInfo = getStockStatus(product);
              const StatusIcon = stockInfo.icon;
              const margin = product.selling_price > 0 ? ((product.selling_price - product.buying_price) / product.selling_price) * 100 : 0;

              return (
                <div key={product.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            {product.product_name}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">{t(product.category)}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stockInfo.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${stockInfo.color}`} />
                          <span className={stockInfo.color}>{stockInfo.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{t('buying_price_label')}</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(product.buying_price)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{t('selling_price_label')}</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(product.selling_price)}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{t('stock_label')}</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {product.quantity}
                          </p>
                        </div>
                        <div className="bg-brand-picton/10 rounded-lg p-3">
                          <p className="text-xs font-medium text-brand-bluecola uppercase tracking-wide mb-1">{t('profit_margin')}</p>
                          <p className="text-lg font-semibold text-brand-trueblue">
                            {margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:items-end">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openSaleModal(product)}
                          disabled={product.quantity === 0}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {t('sell')}
                        </button>
                        <button
                          onClick={() => openProductModal(product)}
                          className="flex items-center gap-2 bg-brand-battery text-white px-4 py-2 rounded-lg hover:bg-brand-trueblue transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Product Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {selectedProduct ? t('edit_product_title') : t('new_product_title')}
                  </h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={saveProduct} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    {t('product_name')}
                  </label>
                  <input
                    name="product_name"
                    type="text"
                    value={form.product_name}
                    onChange={handleProductChange}
                    placeholder="Enter product name"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('category')}
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    >
                      {productCategories.map((category) => (
                        <option key={category} value={category}>{t(category)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('stock_quantity')}
                    </label>
                    <input
                      name="quantity"
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={handleProductChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('cost_price')}
                    </label>
                    <input
                      name="buying_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.buying_price}
                      onChange={handleProductChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('selling_price')}
                    </label>
                    <input
                      name="selling_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.selling_price}
                      onChange={handleProductChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    {t('low_stock_threshold')}
                  </label>
                  <input
                    name="low_stock_threshold"
                    type="number"
                    min="0"
                    value={form.low_stock_threshold}
                    onChange={handleProductChange}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    required
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
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-brand-bluecola text-white hover:bg-brand-trueblue transition-colors"
                  >
                    {selectedProduct ? t('update_profile') || 'Update' : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sale Modal */}
        {saleOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {t('record_sale')}
                  </h2>
                  <button
                    onClick={() => setSaleOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{t('product_name')}</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{selectedProduct.product_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('unit_price')}: {formatCurrency(selectedProduct.selling_price)}
                  </p>
                </div>

                <form onSubmit={sellProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {t('quantity_to_sell')}
                    </label>
                    <input
                      name="quantity_sold"
                      type="number"
                      min="1"
                      max={selectedProduct.quantity}
                      value={saleForm.quantity_sold}
                      onChange={handleSaleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="p-3 bg-brand-picton/10 border border-brand-picton/20 rounded-lg">
                    <p className="text-sm text-brand-bluecola font-medium">
                      Total: {formatCurrency(selectedProduct.selling_price * saleForm.quantity_sold)}
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSaleOpen(false)}
                      className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      {t('record_sale')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
