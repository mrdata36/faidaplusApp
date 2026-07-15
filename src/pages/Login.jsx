import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success(t('login_success') || 'Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 relative">
      {/* Absolute top-right language switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="en" className="bg-white dark:bg-slate-800">English</option>
          <option value="sw" className="bg-white dark:bg-slate-800">Kiswahili</option>
        </select>
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-bluecola via-brand-trueblue to-brand-absolutezero items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <div className="flex items-center justify-center mb-8">
            <img src="/icons/icon-192.png" alt="FaidaPlus logo" className="w-16 h-16 mr-4 rounded-2xl shadow-lg shadow-blue-600/10" />
            <h1 className="text-5xl font-display font-bold">FaidaPlus</h1>
          </div>
          <p className="text-xl opacity-90 mb-6 font-medium">
            Simamia Biashara Yako Kwa Urahisi
          </p>
          <p className="text-lg opacity-75">
            Manage Your Business Easily
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-800">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <img src="/icons/icon-192.png" alt="FaidaPlus logo" className="w-12 h-12 mr-3 rounded-xl shadow-md shadow-blue-600/10" />
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">FaidaPlus</h1>
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('sign_in')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('sign_in_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                {t('email_address')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-slate-300 dark:border-slate-600 text-brand-bluecola focus:ring-brand-bluecola bg-white dark:bg-slate-700"
                />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                  {t('remember_me') || 'Remember me'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-bluecola hover:bg-brand-battery text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {loading ? t('loading') || 'Signing in...' : t('sign_in')}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-slate-600 dark:text-slate-400">
              {t('dont_have_account')}{' '}
              <Link
                to="/register"
                className="text-brand-bluecola hover:text-brand-trueblue font-semibold transition-colors"
              >
                {t('register_now')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
