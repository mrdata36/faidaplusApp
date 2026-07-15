import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import {
  User,
  Building2,
  Bell,
  Palette,
  Shield,
  Globe,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Save,
  Key,
  Mail,
  MapPin,
  Phone,
  Camera,
  Database,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    email_reminders: true,
    push_notifications: true,
    weekly_reports: false,
    payment_alerts: true,
    inventory_alerts: true
  });
  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    date_format: 'DD/MM/YYYY'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [connectionString, setConnectionString] = useState(() => {
    return localStorage.getItem('postgres_conn_str') || '';
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState('');

  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  const handlePostgresSync = async (e) => {
    e.preventDefault();
    setSyncLoading(true);
    setSyncError('');
    setSyncResult(null);
    try {
      localStorage.setItem('postgres_conn_str', connectionString);
      const response = await axios.post('/api/ai/sync-postgres', { connectionString });
      setSyncResult(response.data);
    } catch (err) {
      setSyncError(err.response?.data?.error || 'Ulandanishaji umeshindwa. Tafadhali thibitisha anwani yako ya PostgreSQL.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const response = await axios.get('/api/ai/insights');
      setInsights(response.data.insight);
    } catch (err) {
      setInsightsError(err.response?.data?.error || 'Inashindwa kuzalisha ushauri kwa sasa.');
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/settings/profile');
      setProfile(response.data.profile);
      if (response.data.notifications) setNotifications(response.data.notifications);
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
        if (response.data.preferences.language) {
          setLanguage(response.data.preferences.language);
        }
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
    if (name === 'language') {
      setLanguage(value);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await axios.put('/api/settings/profile', profile);
      setMessage(t('update_success') || 'Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('passwords_dont_match') || 'New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await axios.put('/api/settings/password', passwordForm);
      setMessage(t('update_success') || 'Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update password');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await axios.put('/api/settings/notifications', notifications);
      setMessage(t('update_success') || 'Notification preferences updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update notifications');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await axios.put('/api/settings/preferences', preferences);
      setMessage(t('update_success') || 'Preferences updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: t('profile_label'), icon: User },
    { id: 'business', label: t('business_label'), icon: Building2 },
    { id: 'notifications', label: t('notifications_label'), icon: Bell },
    { id: 'theme', label: t('theme_label'), icon: Palette },
    { id: 'security', label: t('security_label'), icon: Shield },
    { id: 'preferences', label: t('preferences_label'), icon: SettingsIcon },
    { id: 'cloud_sync', label: t('cloud_sync_label') || 'Cloud Sync', icon: Database },
    { id: 'ai_insights', label: t('ai_insights_label') || 'AI Advisor', icon: Sparkles }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-brand-bluecola rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {profile.name || 'Your Name'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{profile.email}</p>
                <button className="mt-2 flex items-center gap-2 text-brand-bluecola hover:text-brand-battery transition cursor-pointer text-sm">
                  <Camera className="w-4 h-4" />
                  {t('change_avatar') || 'Change Avatar'}
                </button>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('full_name')}
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={profile.name}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('email_address')}
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('phone_number')}
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('business_address')}
                  </label>
                  <input
                    name="location"
                    type="text"
                    value={profile.location}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-2 rounded-lg hover:bg-brand-battery transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? t('loading') : t('update_profile')}
              </button>
            </form>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-picton rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {profile.business_name || 'Your Business'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{t('business_profile')}</p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('business_name')}
                </label>
                <input
                  name="business_name"
                  type="text"
                  value={profile.business_name}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('business_address')}
                  </label>
                  <input
                    name="location"
                    type="text"
                    value={profile.location}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('phone_number')}
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-2 rounded-lg hover:bg-brand-battery transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? t('loading') : t('update_profile')}
              </button>
            </form>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-brand-bluecola" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {t('notifications_label')}
              </h3>
            </div>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                  <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Receive notifications for {key.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name={key}
                      checked={value}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-bluecola/25 dark:peer-focus:ring-brand-bluecola/25 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-bluecola"></div>
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={saveNotifications}
              disabled={saving}
              className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-2 rounded-lg hover:bg-brand-battery transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-brand-bluecola" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {t('theme_label')}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Theme Mode
                </h4>
                <div className="grid gap-3">
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                      theme === 'light'
                        ? 'border-brand-bluecola bg-brand-bluecola/10 text-brand-bluecola'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-sm font-medium">Light Mode</span>
                  </button>
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                      theme === 'dark'
                        ? 'border-brand-bluecola bg-brand-bluecola/10 text-brand-bluecola'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-sm font-medium">Dark Mode</span>
                  </button>
                  <button
                    onClick={() => {
                      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      setThemeMode(systemTheme);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-sm font-medium">System Preference</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-brand-bluecola" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {t('security_credentials')}
              </h3>
            </div>

            <div className="space-y-6">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
                  {t('change_password')}
                </h4>
                <form onSubmit={changePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('current_password')}
                    </label>
                    <input
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('new_password')}
                    </label>
                    <input
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('confirm_new_password')}
                    </label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-2 rounded-lg hover:bg-brand-battery transition disabled:opacity-50 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    {saving ? t('loading') : t('update_password')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-6 h-6 text-brand-bluecola" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {t('preferences_label')}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
                  {t('language')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('language')}
                    </label>
                    <select
                      name="language"
                      value={preferences.language}
                      onChange={handlePreferenceChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    >
                      <option value="en">{t('english')}</option>
                      <option value="sw">{t('swahili')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('currency')}
                    </label>
                    <select
                      name="currency"
                      value={preferences.currency}
                      onChange={handlePreferenceChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent"
                    >
                      <option value="TZS">Tanzanian Shilling (TZS)</option>
                      <option value="KES">Kenyan Shilling (KES)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-2 rounded-lg hover:bg-brand-battery transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? t('loading') : t('save')}
              </button>
            </div>
          </div>
        );

      case 'cloud_sync':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Database className="w-8 h-8 text-brand-bluecola" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  SQLite to PostgreSQL Cloud Database Sync
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('cloud_sync_desc') || 'Hamisha na ulandanishe data za SQLite kwenda PostgreSQL ghafla.'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Swahili:</strong> Hamisha na ulandanishe data zako zote za SQLite (Miamala, Bidhaa, na Wasifu) kwenda kwenye hifadhidata yako ya wingu ya PostgreSQL (kama vile Supabase, Neon, au Cloud SQL) kwa usalama na uimara zaidi.
                <br className="mb-2"/>
                <strong>English:</strong> Export and synchronize all your local SQLite data (Transactions, Products, and Profile) to a cloud PostgreSQL database for increased security, durability, and external access.
              </p>

              <form onSubmit={handlePostgresSync} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    PostgreSQL Connection String (URI)
                  </label>
                  <input
                    type="text"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder="postgresql://user:password@host:port/dbname?sslmode=require"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-bluecola focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={syncLoading}
                  className="flex items-center gap-2 bg-brand-bluecola text-white px-6 py-3 rounded-lg hover:bg-brand-battery transition disabled:opacity-50 cursor-pointer font-semibold"
                >
                  <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  {syncLoading ? 'Tunalanisha / Syncing...' : 'Anza Ulandanishaji / Start Sync Now'}
                </button>
              </form>

              {syncError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-800 dark:text-red-200">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="font-semibold text-sm">Ulandanishaji Umeshindwa (Sync Failed)</h4>
                    <p className="text-xs mt-1 leading-relaxed">{syncError}</p>
                  </div>
                </div>
              )}

              {syncResult && syncResult.success && (
                <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl space-y-4 text-green-800 dark:text-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 className="font-semibold text-base">{syncResult.message || 'Ulandanishaji Umekamilika!'}</h4>
                      <p className="text-sm mt-1">Data zote za biashara zimesawazishwa na PostgreSQL kwa ufanisi wa hali ya juu.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-green-200/50 dark:border-green-800/50">
                    <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">User Synced</p>
                      <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">1</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Settings</p>
                      <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{syncResult.details?.settings_synced || 0}</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Products</p>
                      <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{syncResult.details?.products_synced || 0}</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Transactions</p>
                      <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{syncResult.details?.transactions_synced || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'ai_insights':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-brand-bluecola animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  AI Business Advisor & Growth Hub
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Ushauri wa Kifedha na Kiutendaji unaoendeshwa na Gemini AI.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>FaidaPlus AI Advisor</strong> huchambua miamala yako, viwango vya stoki ghalani na takwimu za kila siku ili kukupa mapendekezo ya kifedha, mbinu za kuongeza faida, na kubaini mapungufu mapema.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleGenerateInsights}
                  disabled={insightsLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer font-semibold shadow-md"
                >
                  <Sparkles className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`} />
                  {insightsLoading ? 'Tunaandaa Ushauri / Preparing Insights...' : 'Zalisha Uchambuzi wa AI / Generate AI Insights'}
                </button>
              </div>

              {insightsError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm">
                  {insightsError}
                </div>
              )}

              {insightsLoading && (
                <div className="p-8 border border-slate-100 dark:border-slate-700/80 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 space-y-4 animate-pulse">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 pt-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                </div>
              )}

              {insights && !insightsLoading && (
                <div className="p-6 border border-brand-picton/20 rounded-2xl bg-brand-picton/5 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2 mb-4 text-brand-bluecola font-semibold text-lg border-b border-brand-picton/10 pb-2">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>Ripoti na Ushauri wa FaidaPlus AI</span>
                  </div>
                  <div className="whitespace-pre-line text-sm leading-relaxed space-y-4">
                    {insights}
                  </div>
                </div>
              )}

              {/* Creative Toolkit Campaign Copy Generator */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">💡 Creative Tool: Swahili Marketing Campaign Generator</span>
                  <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full font-semibold">Creative Feature</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generate professional Swahili and English advertising messages tailored to your business profile to send to customers via SMS or WhatsApp to trigger sales!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setInsightsLoading(true);
                      setInsightsError('');
                      try {
                        const response = await axios.get('/api/ai/insights?type=marketing');
                        setInsights(response.data.insight);
                      } catch (err) {
                        setInsightsError('Inashindwa kutengeneza ujumbe wa promosheni.');
                      } finally {
                        setInsightsLoading(false);
                      }
                    }}
                    disabled={insightsLoading}
                    type="button"
                    className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Tengeneza Ujumbe wa Promosheni / Generate Promo Messages</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">
              {t('settings_hub')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {t('settings_desc')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-bluecola"></div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
            {/* Sidebar Navigation */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none snap-x shrink-0">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition cursor-pointer shrink-0 snap-start whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-brand-bluecola text-white shadow-lg'
                        : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200/60 dark:border-slate-700/60 lg:border-none'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content */}
            <div className="min-h-[500px]">
              {renderSection()}
            </div>
          </div>
        )}

        {/* Global Messages */}
        {(message || error) && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg max-w-sm z-50 ${
            error
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
          }`}>
            {message || error}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
