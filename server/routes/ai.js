const express = require('express');
const router = require('express').Router();
const { GoogleGenAI } = require('@google/genai');
const { Pool } = require('pg');
const db = require('../db/database');

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Promise helpers for clean async database operations
const dbGet = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || {});
    });
  });
};

const dbAll = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Helper: Generate local Rule-Based Insights
function generateRuleBasedInsights(stats, details) {
  const { income, expense, net_profit, low_stock_products, products } = stats;
  const { bestSelling, worstSelling, deadStock, weekly, prevWeekly, monthly, prevMonthly } = details;

  // 1. Business Health Score
  let score = 50;
  if (income > 0) {
    const margin = net_profit / income;
    if (margin > 0.3) score += 20;
    else if (margin > 0.1) score += 10;
    else if (margin < 0) score -= 25;
  }
  if (low_stock_products.length === 0) score += 15;
  else if (low_stock_products.length > 5) score -= 15;
  else score -= 5;

  if (products.length > 5) score += 15;
  score = Math.max(10, Math.min(100, score));

  // 2. Cash Flow and trends
  const cashFlowStatus = net_profit >= 0 
    ? "Mzunguko Chanya wa Fedha (Positive Cash Flow) - Mapato yanazidi matumizi yako."
    : "Mzunguko Hasi wa Fedha (Negative Cash Flow) - Matumizi yanazidi mapato yako, dhibiti gharama.";

  const profitTrend = (monthly.income - monthly.expense) >= (prevMonthly.income - prevMonthly.expense)
    ? "Kupanda kwa Faida (Profit Increasing) ikilinganishwa na kipindi cha nyuma."
    : "Kushuka kwa Faida (Profit Decreasing) ikilinganishwa na mwezi uliopita.";

  const expenseTrend = monthly.expense > prevMonthly.expense
    ? "Matumizi Yanaongezeka (Expenses Increasing) - Angalia upya maeneo ya matumizi."
    : "Matumizi Yanadhibitiwa vizuri (Expenses Stable/Decreasing).";

  // 3. Best & Worst Selling Text
  const bestSellingText = bestSelling && bestSelling.product_name 
    ? `${bestSelling.product_name} (Imeuzwa mara ${bestSelling.total_sold})` 
    : "Bado hakuna mauzo ya kutosha kuanisha bidhaa bora.";

  const worstSellingText = worstSelling && worstSelling.product_name 
    ? `${worstSelling.product_name} (Imeuzwa mara ${worstSelling.total_sold})` 
    : "Bado hakuna mauzo ya kutosha kuanisha bidhaa dhaifu.";

  const deadStockText = deadStock && deadStock.length > 0
    ? deadStock.map(p => p.product_name).join(', ')
    : "Hongera! Hakuna bidhaa iliyolala (No Dead Stock currently).";

  // 4. Period comparisons
  const weeklyProfit = weekly.income - weekly.expense;
  const prevWeeklyProfit = prevWeekly.income - prevWeekly.expense;
  const weeklyProfitTrendText = weeklyProfit >= prevWeeklyProfit ? "Inaridhisha 📈" : "Inashuka 📉";

  const monthlyProfit = monthly.income - monthly.expense;
  const prevMonthlyProfit = prevMonthly.income - prevMonthly.expense;
  const monthlyProfitTrendText = monthlyProfit >= prevMonthlyProfit ? "Inaridhisha 📈" : "Inashuka 📉";

  // 5. Low Stock details
  const lowStockText = low_stock_products.length > 0
    ? low_stock_products.map(p => `${p.product_name} (Imebaki ${p.quantity} ${p.unit || 'pcs'})`).join(', ')
    : "Mali zote ziko katika viwango salama.";

  // 6. Strategic Recommendations
  const recommendations = [];
  if (low_stock_products.length > 0) {
    recommendations.push(`Fanya manunuzi ya haraka ya **${low_stock_products[0].product_name}** ili kuepuka kupoteza wateja.`);
  } else {
    recommendations.push("Endelea kufuatilia viwango vya stoki ili kuhakikisha huduma haisiti.");
  }

  if (net_profit < 0) {
    recommendations.push("Chambua matumizi makubwa ya hivi karibuni na upunguze yasiyo ya lazima ili kurejea kwenye faida.");
  } else if (income > 0 && (expense / income) > 0.5) {
    recommendations.push("Gharama za uendeshaji ni zaidi ya 50% ya mapato. Jaribu kupunguza gharama au kuongeza bei kidogo.");
  } else {
    recommendations.push("Hongera kwa afya nzuri ya kifedha! Fikiria kuwekeza faida kwenye bidhaa zinazofanya vizuri zaidi.");
  }

  if (bestSelling && bestSelling.product_name) {
    recommendations.push(`Ongeza kasi ya masoko na ununuzi kwa bidhaa yako maarufu: **${bestSelling.product_name}**.`);
  } else {
    recommendations.push("Anza kusajili mauzo ili uweze kupata uchambuzi kamili wa bidhaa zinazoongoza.");
  }

  return `### **Ushauri wa Kibiashara (FaidaPlus AI Advisor - Rule-Based Engine)**

#### **1. Afya ya Kifedha na Alama ya Biashara (Business Health & Score)**
*   **Alama ya Afya ya Biashara (Business Health Score):** **${score}/100**
*   **Hali ya Mzunguko wa Fedha (Cash Flow):** ${cashFlowStatus}
*   **Mwelekeo wa Faida (Profit Trend):** ${profitTrend}
*   **Mwelekeo wa Matumizi (Expense Trend):** ${expenseTrend}

---

#### **2. Uchambuzi wa Mauzo na Bidhaa (Sales & Stock Analysis)**
*   **Bidhaa Inayoongoza kwa Mauzo (Best Selling Product):** **${bestSellingText}**
*   **Bidhaa Isiyouza Zaidi (Worst Selling Product):** **${worstSellingText}**
*   **Mrundikano wa Stoki / Bidhaa Zilizolala (Dead Stock):** ${deadStockText}

---

#### **3. Mlinganisho wa Vipindi (Period Comparison)**
*   **Mlinganisho wa Wiki hii dhidi ya Wiki Iliyopita:**
    *   Wiki Hii: Mapato **${weekly.income.toLocaleString()} TZS** | Matumizi **${weekly.expense.toLocaleString()} TZS**
    *   Wiki Iliyopita: Mapato **${prevWeekly.income.toLocaleString()} TZS** | Matumizi **${prevWeekly.expense.toLocaleString()} TZS**
    *   Mwelekeo wa Faida ya Wiki: **${weeklyProfitTrendText}**
*   **Mlinganisho wa Mwezi huu dhidi ya Mwezi Uliopita:**
    *   Mwezi Huu: Mapato **${monthly.income.toLocaleString()} TZS** | Matumizi **${monthly.expense.toLocaleString()} TZS**
    *   Mwezi Uliopita: Mapato **${prevMonthly.income.toLocaleString()} TZS** | Matumizi **${prevMonthly.expense.toLocaleString()} TZS**
    *   Mwelekeo wa Faida ya Mwezi: **${monthlyProfitTrendText}**

---

#### **4. Afya ya Stoki na Ushauri (Inventory Health & Strategy)**
*   **Bidhaa zenye Upungufu (Low Stock Alerts):** ${lowStockText}
*   **Ushauri Maalum wa Kuchukua Hatua (Strategic Recommendations):**
    1. 📝 *${recommendations[0]}*
    2. 💡 *${recommendations[1]}*
    3. 🚀 *${recommendations[2]}*
`;
}

// Helper: Generate local Rule-Based Marketing Copy
function generateRuleBasedMarketing(stats) {
  const products = stats.products || [];
  const prod1 = products[0]?.product_name || "Bidhaa Zetu Bora";
  const prod2 = products[1]?.product_name || "Mizigo Mipya";
  const prod3 = products[2]?.product_name || "Huduma Zetu";

  return `### **Ujumbe wa Matangazo ya Biashara (FaidaPlus Marketing Advisor)**

Hapa kuna ujumbe 3 wa kuvutia wa WhatsApp au SMS uliotengenezwa maalum kwa ajili ya wateja wako kulingana na bidhaa zako:

---

**1. Matangazo Maalum ya Punguzo la Bei (Promo Offer SMS)**
📢 *FAIDA PLUS SPECIAL OFFER!* 📢
Ndugu mteja yetu bora, tunakuletea ofa kabambe leo! Pata **${prod1}** kwa bei nzuri kabisa na punguzo la kipekee sokoni.
🚀 Usipitwe na ofa hii nzuri! Wahi sasa kabla mzigo haujaisha stoki.
Wasiliana nasi sasa kwa simu/WhatsApp au tufuate dukani kwetu kwa huduma safi! 

---

**2. Matangazo ya Bidhaa Mpya / Ofa ya Siku (Daily Special Campaign)**
✨ *OFU YA LEO - USIPITWE!* ✨
Habari ya leo! Je, unahitaji bidhaa bora zenye viwango vya juu zaidi?
Tuna mzigo mpya kabisa wa **${prod2}** uliowasili leo!
📦 Tunafanya delivery ya uhakika na salama hadi popote ulipo! 
Tupigie sasa hivi kuweka oda yako. Karibu sana ufurahie huduma zetu!

---

**3. Ujumbe wa Kikumbusho wa Haraka (Quick WhatsApp Buzz)**
Hi, matumaini yako salama kabisa! 👋
Tunapenda kukukumbusha kuwa tuna mzigo wa kutosha na safi wa **${prod3}** na bidhaa nyingine nyingi bora.
📍 Tembelea duka letu leo au agiza kupitia WhatsApp na tutakuletea kwa haraka zaidi.
*FaidaPlus - Biashara Yako, Ukuaji Wako na Ushindi Wako!*
`;
}

// Endpoint: AI Insights
router.get('/insights', async (req, res) => {
  const userId = req.userId;
  const stats = {};
  
  try {
    // Gather all basic stats
    const totals = await dbGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM transactions WHERE user_id = ?
    `, [userId]);

    stats.income = totals.total_income;
    stats.expense = totals.total_expense;
    stats.net_profit = totals.total_income - totals.total_expense;

    const products = await dbAll(
      `SELECT product_name, quantity, low_stock_threshold, unit FROM products WHERE user_id = ?`,
      [userId]
    );
    stats.products = products || [];
    stats.low_stock_products = (products || []).filter(p => p.quantity <= p.low_stock_threshold);

    const txns = await dbAll(
      `SELECT type, category, amount, description, date FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 10`,
      [userId]
    );
    stats.recent_txns = txns || [];

    // Fetch advanced analytics details for Rule-Based & fallback engines
    const bestSelling = await dbGet(`
      SELECT p.product_name, SUM(s.quantity_sold) as total_sold 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      WHERE s.user_id = ? 
      GROUP BY s.product_id 
      ORDER BY total_sold DESC 
      LIMIT 1
    `, [userId]);

    const worstSelling = await dbGet(`
      SELECT p.product_name, SUM(s.quantity_sold) as total_sold 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      WHERE s.user_id = ? 
      GROUP BY s.product_id 
      ORDER BY total_sold ASC 
      LIMIT 1
    `, [userId]);

    const deadStock = await dbAll(`
      SELECT product_name FROM products 
      WHERE user_id = ? AND id NOT IN (SELECT DISTINCT product_id FROM sales WHERE user_id = ?)
      LIMIT 3
    `, [userId, userId]);

    const weekly = await dbGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions 
      WHERE user_id = ? AND date >= date('now', '-7 days')
    `, [userId]);

    const prevWeekly = await dbGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions 
      WHERE user_id = ? AND date >= date('now', '-14 days') AND date < date('now', '-7 days')
    `, [userId]);

    const monthly = await dbGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions 
      WHERE user_id = ? AND date >= date('now', '-30 days')
    `, [userId]);

    const prevMonthly = await dbGet(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions 
      WHERE user_id = ? AND date >= date('now', '-60 days') AND date < date('now', '-30 days')
    `, [userId]);

    const details = { bestSelling, worstSelling, deadStock, weekly, prevWeekly, monthly, prevMonthly };

    // Check Gemini API Key and setup prompt
    if (!process.env.GEMINI_API_KEY) {
      // Fallback directly to high-quality Rule-Based engine if no API Key is defined
      const insightText = req.query.type === 'marketing'
        ? generateRuleBasedMarketing(stats)
        : generateRuleBasedInsights(stats, details);
      return res.json({ insight: insightText });
    }

    let prompt = '';
    if (req.query.type === 'marketing') {
      prompt = `
        You are the expert creative marketing copywriter and sales strategist for "FaidaPlus", helping small and medium businesses in East Africa.
        Write 3 highly engaging, professional, and catchy promotional advertisement messages (SMS/WhatsApp style) to boost sales for this business.
        
        BUSINESS CONTEXT:
        - Low Inventory / High priority products: ${stats.low_stock_products.map(p => p.product_name).join(', ') || 'All items'}
        - Total Income registered: ${stats.income} TZS
        
        Guidelines for messages:
        - Provide the messages in Swahili mixed with clean English terms where standard (e.g., Offers, Discount, Delivery).
        - Make them highly appealing, friendly, respectful, and native to East African retail settings.
        - Include clear call-to-actions and emojis.
      `;
    } else {
      prompt = `
        You are the expert financial advisor and AI business analyst for "FaidaPlus", an offline-first management system for East African small businesses.
        Analyze the following financial and inventory data for the user's business and provide a comprehensive, highly valuable, and actionable advisor response.
        Provide the response in Swahili (with a professional, encouraging, and clear tone) combined with English terms where appropriate (accounting terms like Cashflow, Working Capital, Inventory Turnover).
        
        BUSINESS DATA SUMMARY:
        - Total Income: ${stats.income} TZS
        - Total Expenses: ${stats.expense} TZS
        - Net Profit: ${stats.net_profit} TZS
        - Inventory Status: Total of ${stats.products.length} products registered.
        - Low Stock Alerts: ${stats.low_stock_products.map(p => `${p.product_name} (${p.quantity} ${p.unit || 'pcs'} left, threshold is ${p.low_stock_threshold})`).join(', ') || 'No low stock products currently.'}
        - Recent Transactions: ${stats.recent_txns.map(t => `[${t.date}] ${t.type.toUpperCase()}: ${t.category} - ${t.amount} TZS (${t.description})`).join('; ')}
        
        Structure your response beautifully with markdown headings and bullet points:
        1. **Afya ya Kifedha ya Biashara (Business Health Assessment)**
        2. **Usimamizi wa Stoki na Akiba (Inventory Strategic Recommendations)**
        3. **Mikakati Maalum ya Kukuza Faida (Custom Growth & Expense Control Actions)**
      `;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      
      res.json({ insight: response.text });
    } catch (apiErr) {
      // Automatic fallback on Gemini failure (503, 429, Network error etc.) without showing raw errors to users
      console.warn('Gemini API Error, falling back to Rule-Based Intelligence engine:', apiErr.message);
      const fallbackText = req.query.type === 'marketing'
        ? generateRuleBasedMarketing(stats)
        : generateRuleBasedInsights(stats, details);
      res.json({ insight: fallbackText });
    }
  } catch (dbErr) {
    console.error('Database query error in insights endpoint:', dbErr);
    res.status(500).json({ error: 'Database query error occurred' });
  }
});

// Endpoint: SQLite to PostgreSQL Sync
router.post('/sync-postgres', async (req, res) => {
  const userId = req.userId;
  const { connectionString } = req.body;
  
  if (!connectionString) {
    return res.status(400).json({ error: 'PostgreSQL Connection String is required' });
  }
  
  let pool;
  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false } // commonly required for cloud PG databases like Supabase/Neon
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
  } catch (err) {
    console.error('Postgres connection test failed:', err);
    return res.status(400).json({ error: 'Inashindwa kuunganisha na PostgreSQL. Angalia kama Connection String ni sahihi na inaruhusu miunganisho ya nje. Sababu: ' + err.message });
  }
  
  try {
    // 1. Create tables if they do not exist in PostgreSQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pg_users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        business_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        currency TEXT DEFAULT 'TZS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pg_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, key)
      );
      
      CREATE TABLE IF NOT EXISTS pg_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT,
        buying_price DOUBLE PRECISION NOT NULL,
        selling_price DOUBLE PRECISION NOT NULL,
        quantity DOUBLE PRECISION DEFAULT 0,
        low_stock_threshold DOUBLE PRECISION DEFAULT 5,
        unit TEXT DEFAULT 'pcs',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pg_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        amount DOUBLE PRECISION NOT NULL,
        description TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Fetch data from SQLite for this user
    const sqliteFetch = (query, params = []) => new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    const users = await sqliteFetch('SELECT * FROM users WHERE id = ?', [userId]);
    const settings = await sqliteFetch('SELECT * FROM settings WHERE user_id = ?', [userId]);
    const products = await sqliteFetch('SELECT * FROM products WHERE user_id = ?', [userId]);
    const transactions = await sqliteFetch('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      await pool.end();
      return res.status(404).json({ error: 'Mtumiaji hapatikani katika SQLite.' });
    }
    
    const user = users[0];
    
    // 3. Upsert user in Postgres
    const userRes = await pool.query(`
      INSERT INTO pg_users (id, full_name, business_name, email, password, currency, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE 
      SET full_name = EXCLUDED.full_name, business_name = EXCLUDED.business_name, currency = EXCLUDED.currency
      RETURNING id
    `, [user.id, user.full_name, user.business_name, user.email, user.password, user.currency || 'TZS', user.created_at]);
    
    const pgUserId = userRes.rows[0].id;
    
    // 4. Sync Settings
    let settingsCount = 0;
    for (const s of settings) {
      await pool.query(`
        INSERT INTO pg_settings (user_id, key, value, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [pgUserId, s.key, s.value, s.created_at, s.updated_at]);
      settingsCount++;
    }
    
    // 5. Sync Products
    let productsCount = 0;
    await pool.query('DELETE FROM pg_products WHERE user_id = $1', [pgUserId]);
    for (const p of products) {
      await pool.query(`
        INSERT INTO pg_products (id, user_id, product_name, category, buying_price, selling_price, quantity, low_stock_threshold, unit, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [p.id, pgUserId, p.product_name, p.category, p.buying_price, p.selling_price, p.quantity, p.low_stock_threshold, p.unit || 'pcs', p.created_at]);
      productsCount++;
    }
    
    // 6. Sync Transactions
    let transactionsCount = 0;
    await pool.query('DELETE FROM pg_transactions WHERE user_id = $1', [pgUserId]);
    for (const t of transactions) {
      await pool.query(`
        INSERT INTO pg_transactions (id, user_id, type, category, amount, description, date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [t.id, pgUserId, t.type, t.category, t.amount, t.description, t.date, t.created_at]);
      transactionsCount++;
    }
    
    await pool.end();
    
    // Save settings record that PostgreSQL sync is successful
    db.run(
      'INSERT OR REPLACE INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime("now"))',
      [userId, 'postgres_sync_status', `Success (${new Date().toLocaleString()})`]
    );
    
    res.json({
      success: true,
      message: 'Ulandanishaji umekamilika kikamilifu!',
      details: {
        user: user.email,
        settings_synced: settingsCount,
        products_synced: productsCount,
        transactions_synced: transactionsCount
      }
    });
    
  } catch (err) {
    console.error('Postgres Sync error:', err);
    if (pool) {
      try {
        await pool.end();
      } catch (endErr) {
        console.error('Failed to end pg pool:', endErr);
      }
    }
    res.status(500).json({ error: 'Ulandanishaji umefeli: ' + err.message });
  }
});

// GET /api/ai/saved-insights
router.get('/saved-insights', async (req, res) => {
  const userId = req.userId;
  try {
    const rows = await dbAll('SELECT * FROM saved_insights WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch saved insights' });
  }
});

// POST /api/ai/saved-insights
router.post('/saved-insights', async (req, res) => {
  const userId = req.userId;
  const { title, insight_text, type } = req.body;
  if (!title || !insight_text) {
    return res.status(400).json({ error: 'Title and insight text are required' });
  }
  try {
    db.run(
      'INSERT INTO saved_insights (user_id, title, insight_text, type) VALUES (?, ?, ?, ?)',
      [userId, title, insight_text, type || 'general'],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to save insight' });
        }
        res.json({ id: this.lastID, user_id: userId, title, insight_text, type });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save insight' });
  }
});

// DELETE /api/ai/saved-insights/:id
router.delete('/saved-insights/:id', async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    db.run('DELETE FROM saved_insights WHERE id = ? AND user_id = ?', [id, userId], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete saved insight' });
      }
      res.json({ success: true, message: 'Saved insight deleted successfully' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete saved insight' });
  }
});

module.exports = router;
