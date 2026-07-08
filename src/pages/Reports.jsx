import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import Layout from '../components/Layout';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Printer, FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useDataSync } from '../context/DataSyncContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const reportTypes = [
  { label_key: 'daily_report', value: 'daily' },
  { label_key: 'weekly_report', value: 'weekly' },
  { label_key: 'monthly_report', value: 'monthly' },
  { label_key: 'custom_report', value: 'custom' }
];

const localTranslations = {
  en: {
    profit_loss_statement: "Profit&Loss Statement",
    current_period: "current period",
    prior_period: "prior period",
    revenue_header: "Revenue",
    sales_revenue: "Sales Revenue",
    service_revenue: "Service Revenue",
    interest_revenue: "Interest Revenue",
    gain_sales_assets: "Gain of Sales of Assets",
    total_revenue_gains: "Total Revenue & Gains",
    expenses_header: "Expenses",
    advertising: "Advertising",
    delivery_freight: "Delivery/Freight Expense",
    depreciation: "Depreciation",
    insurance: "Insurance",
    interest_expense: "Interest",
    office_supplies: "Office Supplies",
    rent_lease: "Rent/Lease",
    maintenance_repairs: "Maintenance and Repairs",
    travel: "Travel",
    wages: "Wages",
    utilities_telephone: "Utilities/Telephone Expenses",
    other_expense: "Other Expenses",
    total_expenses: "Total Expenses",
    income_before_tax: "Income before tax",
    income_tax_expense: "Income tax expense (18% VAT)",
    net_profit_loss: "Net Profit (Loss)",
    balance_sheet: "Balance Sheet",
    particulars: "Particulars",
    amount_in: "Amount",
    assets: "Assets",
    cash_equivalents: "Cash and cash equivalents",
    investments: "Investments",
    goodwill_intangibles: "Goodwill and Intangibles",
    receivables: "Receivables",
    other_assets: "Other",
    total_assets: "Total Assets",
    liabilities: "Liabilities",
    payables: "Payables",
    long_term_debt: "Long term debt",
    commissions: "Commissions",
    other_liability: "Other",
    total_liabilities: "Total Liabilities",
    stockholders_equity: "Stockholders' Equity",
    equity_shares: "Equity Shares",
    retained_earnings: "Retained earnings",
    total_equity: "Total Stockholders Equity",
    profit_loss_subtitle: "Statement of Profit or Loss",
    balance_sheet_subtitle: "Statement of Financial Position"
  },
  sw: {
    profit_loss_statement: "Ripoti ya Faida na Hasara",
    current_period: "kipindi cha sasa",
    prior_period: "kipindi kilichopita",
    revenue_header: "Mapato",
    sales_revenue: "Mauzo ya Bidhaa (Sales)",
    service_revenue: "Mauzo ya Huduma (Service)",
    interest_revenue: "Mapato ya Riba (Interest)",
    gain_sales_assets: "Faida ya Kuuza Rasilimali",
    total_revenue_gains: "Jumla ya Mapato na Faida",
    expenses_header: "Matumizi",
    advertising: "Gharama za Matangazo",
    delivery_freight: "Usafiri na Usafirishaji (Freight)",
    depreciation: "Uchakaaji wa Thamani",
    insurance: "Gharama za Bima (Insurance)",
    interest_expense: "Riba (Interest Expense)",
    office_supplies: "Vifaa vya Ofisi (Supplies)",
    rent_lease: "Kodi ya Pango (Rent/Lease)",
    maintenance_repairs: "Ukarabati na Matengenezo",
    travel: "Safari na Usafiri (Travel)",
    wages: "Mishahara na Kibarua (Wages)",
    utilities_telephone: "Maji, Umeme na Mawasiliano",
    other_expense: "Matumizi Mengineyo",
    total_expenses: "Jumla ya Matumizi",
    income_before_tax: "Faida kabla ya kodi",
    income_tax_expense: "Kodi ya Mapato (VAT 18%)",
    net_profit_loss: "Faida / Hasara Halisi",
    balance_sheet: "Ripoti ya Hali ya Kifedha (Mizania)",
    particulars: "Mchanganuo (Particulars)",
    amount_in: "Kiasi",
    assets: "Rasilimali (Assets)",
    cash_equivalents: "Fedha taslimu na zilizo benki",
    investments: "Uwekezaji (Investments)",
    goodwill_intangibles: "Sifa za Biashara (Goodwill)",
    receivables: "Fedha za Kudai (Receivables)",
    other_assets: "Rasilimali Nyinginezo",
    total_assets: "Jumla ya Rasilimali",
    liabilities: "Madeni na Dhima (Liabilities)",
    payables: "Madeni ya Kulipa (Payables)",
    long_term_debt: "Mikopo ya Muda Mrefu",
    commissions: "Gharama za Kamisheni",
    other_liability: "Dhima Nyinginezo",
    total_liabilities: "Jumla ya Dhima na Mikopo",
    stockholders_equity: "Mtaji na Akiba (Equity)",
    equity_shares: "Hisa za Mtaji (Equity Shares)",
    retained_earnings: "Akiba ya Faida (Retained Earnings)",
    total_equity: "Jumla ya Mtaji na Akiba",
    profit_loss_subtitle: "Ripoti ya Faida na Hasara",
    balance_sheet_subtitle: "Ripoti ya Hali ya Kifedha (Mizania)"
  }
};

const getPriorPeriodDates = (type, currentStart, currentEnd) => {
  const start = new Date(currentStart);
  const end = new Date(currentEnd);
  
  let priorStart = '';
  let priorEnd = '';
  
  if (type === 'daily') {
    const prior = new Date(start);
    prior.setDate(start.getDate() - 1);
    priorStart = prior.toISOString().slice(0, 10);
    priorEnd = priorStart;
  } else if (type === 'weekly') {
    const pStart = new Date(start);
    pStart.setDate(start.getDate() - 7);
    const pEnd = new Date(end);
    pEnd.setDate(end.getDate() - 7);
    priorStart = pStart.toISOString().slice(0, 10);
    priorEnd = pEnd.toISOString().slice(0, 10);
  } else if (type === 'monthly') {
    const pStart = new Date(start);
    pStart.setMonth(start.getMonth() - 1);
    priorStart = pStart.toISOString().slice(0, 10);
    const pEnd = new Date(pStart.getFullYear(), pStart.getMonth() + 1, 0);
    priorEnd = pEnd.toISOString().slice(0, 10);
  } else if (type === 'custom') {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const pStart = new Date(start);
    pStart.setDate(start.getDate() - diffDays);
    const pEnd = new Date(end);
    pEnd.setDate(end.getDate() - diffDays);
    priorStart = pStart.toISOString().slice(0, 10);
    priorEnd = pEnd.toISOString().slice(0, 10);
  }
  
  return { priorStart, priorEnd };
};

const Reports = () => {
  const [type, setType] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [priorReport, setPriorReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pl');
  const { syncKey } = useDataSync();
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const canSubmit = useMemo(() => type !== 'custom' || (startDate && endDate), [type, startDate, endDate]);

  const tCustom = (key) => {
    const dict = localTranslations[language] || localTranslations.en;
    return dict[key] || key;
  };

  const getReportPeriodLabel = () => {
    if (!report) return '';
    const start = new Date(report.start);
    const end = new Date(report.end);
    const locale = language === 'sw' ? 'sw-TZ' : 'en-US';
    
    const prefix = type === 'daily' 
      ? (language === 'sw' ? 'Tarehe' : 'Date')
      : type === 'monthly'
      ? (language === 'sw' ? 'Mwezi' : 'Month')
      : (language === 'sw' ? 'Kipindi' : 'Period');

    if (type === 'daily') {
      return `${prefix}: ${start.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (type === 'monthly') {
      return `${prefix}: ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    } else {
      return `${prefix}: ${start.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  };

  const printReport = () => {
    window.print();
  };

  const exportToExcel = async () => {
    if (!report) return;

    const workbook = new ExcelJS.Workbook();
    
    // Internal mapping helper functions
    const getCategoryTotal = (rep, list) => {
      if (!rep || !rep.categories) return 0;
      return rep.categories
        .filter(c => list.some(item => c.category?.toLowerCase() === item.toLowerCase()))
        .reduce((sum, c) => sum + c.total, 0);
    };

    const mapRevenue = (rep) => {
      if (!rep) return { sales: 0, service: 0, interest: 0, gain: 0 };
      const sales = getCategoryTotal(rep, ['sales', 'mauzo', 'sales revenue', 'mauzo ya bidhaa']);
      const service = getCategoryTotal(rep, ['service', 'huduma', 'service revenue', 'mauzo ya huduma']);
      const interest = getCategoryTotal(rep, ['interest', 'interest revenue', 'riba', 'mapato ya riba']);
      const gain = Math.max(0, rep.totalRevenue - sales - service - interest);
      return { sales, service, interest, gain };
    };

    const mapExpenses = (rep) => {
      if (!rep) return {
        advertising: 0, delivery: 0, depreciation: 0, insurance: 0,
        interest: 0, office: 0, rent: 0, maintenance: 0, travel: 0,
        wages: 0, utilities: 0, other: 0
      };
      const advertising = getCategoryTotal(rep, ['advertising', 'marketing', 'matangazo']);
      const delivery = getCategoryTotal(rep, ['delivery', 'freight', 'transport', 'usafiri', 'usafirishaji', 'delivery/freight', 'delivery/freight expense', 'stock purchase', 'gharama za stoki']);
      const depreciation = getCategoryTotal(rep, ['depreciation', 'uchakavu', 'shuka thamani']);
      const insurance = getCategoryTotal(rep, ['insurance', 'bima']);
      const interest = getCategoryTotal(rep, ['interest expense', 'interest', 'riba ya mkopo']);
      const office = getCategoryTotal(rep, ['office supplies', 'supplies', 'vifaa vya ofisi']);
      const rent = getCategoryTotal(rep, ['rent', 'lease', 'kodi', 'pango', 'rent/lease']);
      const maintenance = getCategoryTotal(rep, ['maintenance', 'repairs', 'matengenezo', 'maintenance/repairs']);
      const travel = getCategoryTotal(rep, ['travel', 'safari']);
      const wages = getCategoryTotal(rep, ['wages', 'salaries', 'mishahara', 'posho', 'wages/salaries']);
      const utilities = getCategoryTotal(rep, ['utilities', 'telephone', 'water', 'electricity', 'internet', 'maji', 'umeme', 'simu', 'utilities/telephone', 'utilities/telephone expenses']);
      
      const mappedSum = advertising + delivery + depreciation + insurance + interest + office + rent + maintenance + travel + wages + utilities;
      const other = Math.max(0, rep.totalExpense - mappedSum);
      
      return { advertising, delivery, depreciation, insurance, interest, office, rent, maintenance, travel, wages, utilities, other };
    };

    // Helper to style section headers
    const styleSectionHeader = (row) => {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FF1E293B' }
        };
      });
    };

    // Helper to style general data rows
    const styleDataRow = (row, isBold = false, indent = false) => {
      row.eachCell((cell, colNumber) => {
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: isBold
        };
        if (colNumber === 1) {
          cell.alignment = { horizontal: 'left', indent: indent ? 1 : 0 };
        } else {
          cell.alignment = { horizontal: 'right' };
          // Format as currency or standard numbers
          cell.numFmt = '#,##0';
        }
      });
    };

    // Helper to style report title block
    const addTitleBlock = (sheet) => {
      const bNameRow = sheet.addRow([user?.business_name?.toUpperCase() || 'FAIDAPLUS CLIENT']);
      bNameRow.getCell(1).font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1C3F24' } };
      
      if (user?.business_address) {
        const addrRow = sheet.addRow([user.business_address]);
        addrRow.getCell(1).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF555555' } };
      }
      if (user?.phone_number) {
        const phoneRow = sheet.addRow([user.phone_number]);
        phoneRow.getCell(1).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF555555' } };
      }
      
      const periodRow = sheet.addRow([getReportPeriodLabel()]);
      periodRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF333333' } };
      
      sheet.addRow([]); // empty spacing row
    };

    // --- SHEET 1: PROFIT & LOSS ---
    const sheetPL = workbook.addWorksheet(tCustom('profit_loss_subtitle'));
    sheetPL.views = [{ showGridLines: true }];
    sheetPL.columns = [
      { width: 35 },
      { width: 22 },
      { width: 22 }
    ];

    addTitleBlock(sheetPL);

    // Main header
    const currentYear = new Date(report.start).getFullYear();
    const priorYear = priorReport ? new Date(priorReport.start).getFullYear() : currentYear - 1;

    const plHeader = sheetPL.addRow([
      tCustom('profit_loss_statement'),
      `${currentYear} (${tCustom('current_period')})`,
      `${priorYear} (${tCustom('prior_period')})`
    ]);
    plHeader.height = 28;
    plHeader.eachCell((cell, colNum) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1C3F24' }
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 ? 'left' : 'right'
      };
    });

    const curRev = mapRevenue(report);
    const priRev = mapRevenue(priorReport);
    const curExp = mapExpenses(report);
    const priExp = mapExpenses(priorReport);

    const currentBeforeTax = report.totalRevenue - report.totalExpense;
    const priorBeforeTax = priorReport ? (priorReport.totalRevenue - priorReport.totalExpense) : 0;
    const currentTax = currentBeforeTax > 0 ? currentBeforeTax * 0.18 : 0;
    const priorTax = priorBeforeTax > 0 ? priorBeforeTax * 0.18 : 0;
    const currentNetProfit = currentBeforeTax - currentTax;
    const priorNetProfit = priorBeforeTax - priorTax;

    // Revenue Section
    const revHeaderRow = sheetPL.addRow([tCustom('revenue_header'), '', '']);
    styleSectionHeader(revHeaderRow);

    const revRows = [
      [tCustom('sales_revenue'), curRev.sales, priRev.sales],
      [tCustom('service_revenue'), curRev.service, priRev.service],
      [tCustom('interest_revenue'), curRev.interest, priRev.interest],
      [tCustom('gain_sales_assets'), curRev.gain, priRev.gain]
    ];
    revRows.forEach(r => {
      const added = sheetPL.addRow(r);
      styleDataRow(added, false, true);
    });

    // Total Revenue & Gains
    const totalRevRow = sheetPL.addRow([tCustom('total_revenue_gains'), report.totalRevenue, priorReport ? priorReport.totalRevenue : 0]);
    styleDataRow(totalRevRow, true);
    totalRevRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    });

    // Expenses Section
    const expHeaderRow = sheetPL.addRow([tCustom('expenses_header'), '', '']);
    styleSectionHeader(expHeaderRow);

    const expRows = [
      [tCustom('advertising'), curExp.advertising, priExp.advertising],
      [tCustom('delivery_freight'), curExp.delivery, priExp.delivery],
      [tCustom('depreciation'), curExp.depreciation, priExp.depreciation],
      [tCustom('insurance'), curExp.insurance, priExp.insurance],
      [tCustom('interest_expense'), curExp.interest, priExp.interest],
      [tCustom('office_supplies'), curExp.office, priExp.office],
      [tCustom('rent_lease'), curExp.rent, priExp.rent],
      [tCustom('maintenance_repairs'), curExp.maintenance, priExp.maintenance],
      [tCustom('travel'), curExp.travel, priExp.travel],
      [tCustom('wages'), curExp.wages, priExp.wages],
      [tCustom('utilities_telephone'), curExp.utilities, priExp.utilities],
      [tCustom('other_expense'), curExp.other, priExp.other]
    ];
    expRows.forEach(r => {
      const added = sheetPL.addRow(r);
      styleDataRow(added, false, true);
    });

    // Total Expenses
    const totalExpRow = sheetPL.addRow([tCustom('total_expenses'), report.totalExpense, priorReport ? priorReport.totalExpense : 0]);
    styleDataRow(totalExpRow, true);
    totalExpRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    });

    // Income Before Tax
    const incBeforeTaxRow = sheetPL.addRow([tCustom('income_before_tax'), currentBeforeTax, priorBeforeTax]);
    styleDataRow(incBeforeTaxRow, true);

    // Income Tax Expense
    const taxRow = sheetPL.addRow([tCustom('income_tax_expense'), currentTax, priorTax]);
    styleDataRow(taxRow, false, true);
    taxRow.eachCell((cell) => {
      cell.border = { bottom: { style: 'thin' } };
    });

    // Net Profit (Loss) with double underline
    const netProfitRow = sheetPL.addRow([tCustom('net_profit_loss'), currentNetProfit, priorNetProfit]);
    styleDataRow(netProfitRow, true);
    netProfitRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF4F7F5' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1C3F24' } },
        bottom: { style: 'double', color: { argb: 'FF1C3F24' } }
      };
    });


    // --- SHEET 2: BALANCE SHEET ---
    const sheetBS = workbook.addWorksheet(tCustom('balance_sheet_subtitle'));
    sheetBS.views = [{ showGridLines: true }];
    sheetBS.columns = [
      { width: 35 },
      { width: 25 }
    ];

    addTitleBlock(sheetBS);

    const bsHeader = sheetBS.addRow([
      tCustom('particulars'),
      `${tCustom('amount_in')} (${user?.currency || 'TZS'})`
    ]);
    bsHeader.height = 28;
    bsHeader.eachCell((cell, colNum) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00B050' } // Bright green for Mizania
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 ? 'left' : 'right'
      };
    });

    const currentCash = report.cashBalance || 0;
    const currentInventory = report.inventoryValue || 0;
    const totalAssets = currentCash + currentInventory;

    // Assets Section
    const assHeader = sheetBS.addRow([tCustom('assets'), '']);
    styleSectionHeader(assHeader);

    const assetRows = [
      [tCustom('cash_equivalents'), currentCash],
      [tCustom('inventory_assets'), currentInventory],
      [tCustom('goodwill_intangibles'), 0],
      [tCustom('receivables'), 0],
      [tCustom('other_assets'), 0]
    ];
    assetRows.forEach(r => {
      const added = sheetBS.addRow(r);
      styleDataRow(added, false, true);
    });

    // Total Assets
    const totalAssetsRow = sheetBS.addRow([tCustom('total_assets'), totalAssets]);
    styleDataRow(totalAssetsRow, true);
    totalAssetsRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    });

    // Liabilities Section
    const liabHeader = sheetBS.addRow([tCustom('liabilities'), '']);
    styleSectionHeader(liabHeader);

    const liabRows = [
      [tCustom('payables'), 0],
      [tCustom('long_term_debt'), 0],
      [tCustom('commissions'), 0],
      [tCustom('other_liability'), 0]
    ];
    liabRows.forEach(r => {
      const added = sheetBS.addRow(r);
      styleDataRow(added, false, true);
    });

    // Total Liabilities
    const totalLiabRow = sheetBS.addRow([tCustom('total_liabilities'), 0]);
    styleDataRow(totalLiabRow, true);
    totalLiabRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    });

    // Equity Section
    const eqHeader = sheetBS.addRow([tCustom('stockholders_equity'), '']);
    styleSectionHeader(eqHeader);

    const eqRows = [
      [tCustom('equity_shares'), currentInventory],
      [tCustom('retained_earnings'), currentCash]
    ];
    eqRows.forEach(r => {
      const added = sheetBS.addRow(r);
      styleDataRow(added, false, true);
    });

    // Total Equity with double underline
    const totalEquityRow = sheetBS.addRow([tCustom('total_equity'), totalAssets]);
    styleDataRow(totalEquityRow, true);
    totalEquityRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'double' }
      };
    });


    // --- WRITE WORKBOOK ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FaidaPlus_Ripoti_${type}_${startDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      const currentData = response.data;
      setReport(currentData);

      const { priorStart, priorEnd } = getPriorPeriodDates(type, currentData.start, currentData.end);
      
      try {
        const priorParams = { type, startDate: priorStart, endDate: priorEnd };
        const priorResponse = await axios.get('/api/reports', { params: priorParams, signal });
        setPriorReport(priorResponse.data);
      } catch (err) {
        console.warn('Could not fetch prior period report:', err);
        setPriorReport(null);
      }
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

  const renderProfitLoss = (isPrintMode = false) => {
    // Helper to sum categories dynamically
    const getCategoryTotal = (rep, list) => {
      if (!rep || !rep.categories) return 0;
      return rep.categories
        .filter(c => list.some(item => c.category?.toLowerCase() === item.toLowerCase()))
        .reduce((sum, c) => sum + c.total, 0);
    };

    // Mapping revenue accounts exactly as requested
    const mapRevenue = (rep) => {
      if (!rep) return { sales: 0, service: 0, interest: 0, gain: 0 };
      const sales = getCategoryTotal(rep, ['sales', 'mauzo', 'sales revenue', 'mauzo ya bidhaa']);
      const service = getCategoryTotal(rep, ['service', 'huduma', 'service revenue', 'mauzo ya huduma']);
      const interest = getCategoryTotal(rep, ['interest', 'interest revenue', 'riba', 'mapato ya riba']);
      const gain = Math.max(0, rep.totalRevenue - sales - service - interest);
      return { sales, service, interest, gain };
    };

    // Mapping expense accounts exactly as requested
    const mapExpenses = (rep) => {
      if (!rep) return {
        advertising: 0, delivery: 0, depreciation: 0, insurance: 0,
        interest: 0, office: 0, rent: 0, maintenance: 0, travel: 0,
        wages: 0, utilities: 0, other: 0
      };
      const advertising = getCategoryTotal(rep, ['advertising', 'marketing', 'matangazo']);
      const delivery = getCategoryTotal(rep, ['delivery', 'freight', 'transport', 'usafiri', 'usafirishaji', 'delivery/freight', 'delivery/freight expense', 'stock purchase', 'gharama za stoki']);
      const depreciation = getCategoryTotal(rep, ['depreciation', 'uchakavu', 'shuka thamani']);
      const insurance = getCategoryTotal(rep, ['insurance', 'bima']);
      const interest = getCategoryTotal(rep, ['interest expense', 'interest', 'riba ya mkopo']);
      const office = getCategoryTotal(rep, ['office supplies', 'supplies', 'vifaa vya ofisi']);
      const rent = getCategoryTotal(rep, ['rent', 'lease', 'kodi', 'pango', 'rent/lease']);
      const maintenance = getCategoryTotal(rep, ['maintenance', 'repairs', 'matengenezo', 'maintenance/repairs']);
      const travel = getCategoryTotal(rep, ['travel', 'safari']);
      const wages = getCategoryTotal(rep, ['wages', 'salaries', 'mishahara', 'posho', 'wages/salaries']);
      const utilities = getCategoryTotal(rep, ['utilities', 'telephone', 'water', 'electricity', 'internet', 'maji', 'umeme', 'simu', 'utilities/telephone', 'utilities/telephone expenses']);
      
      const mappedSum = advertising + delivery + depreciation + insurance + interest + office + rent + maintenance + travel + wages + utilities;
      const other = Math.max(0, rep.totalExpense - mappedSum);
      
      return { advertising, delivery, depreciation, insurance, interest, office, rent, maintenance, travel, wages, utilities, other };
    };

    const curRev = mapRevenue(report);
    const priRev = mapRevenue(priorReport);

    const curExp = mapExpenses(report);
    const priExp = mapExpenses(priorReport);

    const currentBeforeTax = report.totalRevenue - report.totalExpense;
    const priorBeforeTax = priorReport ? (priorReport.totalRevenue - priorReport.totalExpense) : 0;

    const currentTax = currentBeforeTax > 0 ? currentBeforeTax * 0.18 : 0;
    const priorTax = priorBeforeTax > 0 ? priorBeforeTax * 0.18 : 0;

    const currentNetProfit = currentBeforeTax - currentTax;
    const priorNetProfit = priorBeforeTax - priorTax;

    const currentYear = new Date(report.start).getFullYear();
    const priorYear = priorReport ? new Date(priorReport.start).getFullYear() : currentYear - 1;

    const formatVal = (val) => {
      if (val === 0) return '-';
      return formatCurrency(val);
    };

    return (
      <div className={`report-paper-theme bg-white text-slate-950 font-sans p-6 md:p-10 border border-slate-200 shadow-sm max-w-[800px] mx-auto rounded-xl ${isPrintMode ? 'print-page shadow-none border-none p-0' : 'dark:border-slate-700'}`}>
        {/* Brand Header */}
        <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1c3f24] uppercase">{user?.business_name || 'FaidaPlus Client'}</h2>
            {user?.business_address && <p className="text-slate-600 text-xs mt-1">{user.business_address}</p>}
            {user?.phone_number && <p className="text-slate-600 text-xs">{user.phone_number}</p>}
            <p className="text-slate-700 text-xs font-semibold mt-2">{getReportPeriodLabel()}</p>
          </div>
          <div className="text-right print:hidden">
            <span className="font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">{tCustom('profit_loss_subtitle')}</span>
          </div>
        </div>

        {/* Main green header */}
        <div className="bg-[#1c3f24] text-white p-3.5 rounded-t-lg flex justify-between items-center font-bold text-xs uppercase tracking-wider">
          <span>{tCustom('profit_loss_statement')}</span>
          <div className="flex gap-12 md:gap-20">
            <span className="w-24 text-right">{currentYear}<br/><span className="text-[9px] opacity-85 font-normal lowercase">{tCustom('current_period')}</span></span>
            <span className="w-24 text-right">{priorYear}<br/><span className="text-[9px] opacity-85 font-normal lowercase">{tCustom('prior_period')}</span></span>
          </div>
        </div>

        <div className="border border-t-0 border-slate-200 divide-y divide-slate-100 rounded-b-lg overflow-hidden bg-white text-xs">
          {/* Revenue Section */}
          <div className="bg-slate-50/50 p-2.5 font-bold text-slate-800 uppercase tracking-wider text-[10px] flex justify-between">
            <span>{tCustom('revenue_header')}</span>
            <span></span>
          </div>
          
          {/* Sales Revenue */}
          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('sales_revenue')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curRev.sales)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priRev.sales) : '-'}</span>
            </div>
          </div>

          {/* Service Revenue */}
          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('service_revenue')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curRev.service)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priRev.service) : '-'}</span>
            </div>
          </div>

          {/* Interest Revenue */}
          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('interest_revenue')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curRev.interest)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priRev.interest) : '-'}</span>
            </div>
          </div>

          {/* Gain of Sales of Assets */}
          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('gain_sales_assets')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curRev.gain)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priRev.gain) : '-'}</span>
            </div>
          </div>

          {/* Total Revenue & Gains */}
          <div className="p-2.5 flex justify-between items-center pl-6 font-bold bg-[#fcfdfd] border-t border-slate-300">
            <span className="text-slate-900 uppercase tracking-tight">{tCustom('total_revenue_gains')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900">
              <span className="w-24 text-right border-t border-slate-400 pt-0.5">{formatVal(report.totalRevenue)}</span>
              <span className="w-24 text-right border-t border-slate-300 pt-0.5">{priorReport ? formatVal(priorReport.totalRevenue) : '-'}</span>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-slate-50/50 p-2.5 font-bold text-slate-800 uppercase tracking-wider text-[10px] flex justify-between">
            <span>{tCustom('expenses_header')}</span>
            <span></span>
          </div>

          {/* Predefined Expenses exactly as in Image */}
          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('advertising')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.advertising)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.advertising) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('delivery_freight')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.delivery)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.delivery) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('depreciation')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.depreciation)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.depreciation) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('insurance')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.insurance)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.insurance) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('interest_expense')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.interest)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.interest) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('office_supplies')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.office)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.office) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('rent_lease')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.rent)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.rent) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('maintenance_repairs')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.maintenance)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.maintenance) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('travel')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.travel)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.travel) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('wages')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.wages)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.wages) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('utilities_telephone')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.utilities)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.utilities) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6">
            <span className="text-slate-700">{tCustom('other_expense')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900 font-semibold">
              <span className="w-24 text-right">{formatVal(curExp.other)}</span>
              <span className="w-24 text-right text-slate-500 font-normal">{priorReport ? formatVal(priExp.other) : '-'}</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-2.5 flex justify-between items-center pl-6 font-bold bg-[#fcfdfd] border-t border-slate-300">
            <span className="text-slate-900 uppercase tracking-tight">{tCustom('total_expenses')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900">
              <span className="w-24 text-right border-t border-slate-400 pt-0.5">{formatVal(report.totalExpense)}</span>
              <span className="w-24 text-right border-t border-slate-300 pt-0.5">{priorReport ? formatVal(priorReport.totalExpense) : '-'}</span>
            </div>
          </div>

          {/* Profitability Totals */}
          <div className="p-3 flex justify-between items-center font-bold bg-[#fafbfc] border-t-2 border-slate-400">
            <span className="text-slate-900">{tCustom('income_before_tax')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-900">
              <span className="w-24 text-right">{formatVal(currentBeforeTax)}</span>
              <span className="w-24 text-right">{priorReport ? formatVal(priorBeforeTax) : '-'}</span>
            </div>
          </div>

          <div className="p-2.5 flex justify-between items-center pl-6 text-slate-700">
            <span>{tCustom('income_tax_expense')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-slate-800">
              <span className="w-24 text-right">{formatVal(currentTax)}</span>
              <span className="w-24 text-right">{priorReport ? formatVal(priorTax) : '-'}</span>
            </div>
          </div>

          {/* Net Profit double border underline exact like the Image */}
          <div className="p-3.5 flex justify-between items-center font-bold bg-[#f4f7f5] text-[#1c3f24] border-t-2 border-b-4 border-double border-[#1c3f24] rounded-b-lg">
            <span className="uppercase text-[10px] tracking-wider">{tCustom('net_profit_loss')}</span>
            <div className="flex gap-12 md:gap-20 font-mono text-sm">
              <span className="w-24 text-right">{formatVal(currentNetProfit)}</span>
              <span className="w-24 text-right">{priorReport ? formatVal(priorNetProfit) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Wise-like Brand Footer Banner */}
        <div className="mt-8 bg-[#f2f9f4] border border-[#d4ebd8] p-4 rounded-xl flex justify-between items-center text-xs text-[#1c3f24]">
          <div>
            <p className="font-bold">Urahisi na Uwazi wa Hesabu za Biashara yako</p>
            <p className="text-slate-600 text-[10px] mt-0.5">Ripoti hii imetengenezwa salama na FaidaPlus - Simamia Faida Kibiashara.</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-sm tracking-tight text-[#1c3f24] uppercase">Faida<span className="text-[#00b050]">Plus</span></span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = (isPrintMode = false) => {
    const currentCash = report.cashBalance || 0;
    const currentInventory = report.inventoryValue || 0;
    const totalAssets = currentCash + currentInventory;

    const formatVal = (val) => {
      if (val === 0) return '-';
      return formatCurrency(val);
    };

    return (
      <div className={`report-paper-theme bg-white text-slate-950 font-sans p-6 md:p-10 border border-slate-200 shadow-sm max-w-[800px] mx-auto rounded-xl ${isPrintMode ? 'print-page shadow-none border-none p-0' : 'dark:border-slate-700'}`}>
        {/* Brand Header */}
        <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#00b050] uppercase">{user?.business_name || 'FaidaPlus Client'}</h2>
            {user?.business_address && <p className="text-slate-600 text-xs mt-1">{user.business_address}</p>}
            {user?.phone_number && <p className="text-slate-600 text-xs">{user.phone_number}</p>}
            <p className="text-slate-700 text-xs font-semibold mt-2">{getReportPeriodLabel()}</p>
          </div>
          <div className="text-right print:hidden">
            <span className="font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">{tCustom('balance_sheet_subtitle')}</span>
          </div>
        </div>

        {/* Thick outline classic balance sheet style with central border */}
        <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-white text-xs divide-y divide-slate-900">
          
          {/* Header row */}
          <div className="bg-[#00b050] text-white font-bold text-xs uppercase tracking-wider grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px]">
            <div className="p-3 pl-4 text-left">{tCustom('particulars')}</div>
            <div className="bg-white w-[1px]"></div>
            <div className="p-3 pr-4 text-right">{tCustom('amount_in')} ({user?.currency || 'TZS'})</div>
          </div>

          {/* ASSETS */}
          <div className="p-2.5 bg-slate-50 font-bold text-slate-900 uppercase text-[10px] pl-4">
            {tCustom('assets')}
          </div>
          
          {/* Cash and cash equivalents */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch">
            <div className="p-2.5 pl-6 text-slate-700">{tCustom('cash_equivalents')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900 font-semibold">{formatVal(currentCash)}</div>
          </div>

          {/* Inventory (Stock) */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch">
            <div className="p-2.5 pl-6 text-slate-700">{tCustom('inventory_assets')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900 font-semibold">{formatVal(currentInventory)}</div>
          </div>

          {/* Goodwill and Intangibles */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('goodwill_intangibles')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Receivables */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('receivables')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Other Assets */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('other_assets')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Total Assets with accounting underlines */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] font-bold bg-slate-50 items-stretch border-t border-slate-900">
            <div className="p-2.5 pl-4 text-slate-900 uppercase">{tCustom('total_assets')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900 border-t border-slate-900">{formatVal(totalAssets)}</div>
          </div>

          {/* LIABILITIES */}
          <div className="p-2.5 bg-slate-50 font-bold text-slate-900 uppercase text-[10px] pl-4">
            {tCustom('liabilities')}
          </div>

          {/* Payables */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('payables')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Long term debt */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('long_term_debt')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Commissions */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('commissions')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Other Liabilities */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch text-slate-400">
            <div className="p-2.5 pl-6">{tCustom('other_liability')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono">-</div>
          </div>

          {/* Total Liabilities */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] font-bold bg-slate-50 items-stretch border-t border-slate-900">
            <div className="p-2.5 pl-4 text-slate-900 uppercase">{tCustom('total_liabilities')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900 border-t border-slate-900">{formatVal(0)}</div>
          </div>

          {/* STOCKHOLDERS EQUITY */}
          <div className="p-2.5 bg-slate-50 font-bold text-slate-900 uppercase text-[10px] pl-4">
            {tCustom('stockholders_equity')}
          </div>

          {/* Equity Shares */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch">
            <div className="p-2.5 pl-6 text-slate-700">{tCustom('equity_shares')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900">{formatVal(currentInventory)}</div>
          </div>

          {/* Retained Earnings */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] items-stretch">
            <div className="p-2.5 pl-6 text-slate-700">{tCustom('retained_earnings')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900">{formatVal(currentCash)}</div>
          </div>

          {/* Total Stockholders Equity with classic accounting double underline */}
          <div className="grid grid-cols-[1fr_1px_160px] md:grid-cols-[1fr_1px_220px] font-bold bg-slate-50 border-t border-slate-900 items-stretch border-b-4 border-double border-slate-950 rounded-b-lg">
            <div className="p-2.5 pl-4 text-slate-900 uppercase">{tCustom('total_equity')}</div>
            <div className="bg-slate-900 w-[1px]"></div>
            <div className="p-2.5 pr-4 text-right font-mono text-slate-900 border-t border-slate-900">{formatVal(totalAssets)}</div>
          </div>
        </div>

        {/* Brand Footer Banner */}
        <div className="mt-8 bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-800">Uthabiti wa Kifedha wa Biashara Yako</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Mizania hii imetengenezwa salama na FaidaPlus - Simamia Faida Kibiashara.</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-sm tracking-tight text-slate-800 uppercase">Faida<span className="text-[#00b050]">Plus</span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Style block for print layout and custom page break */}
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .main-content {
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-page {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
          }
        `}</style>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-battery rounded-xl flex items-center justify-center print:hidden">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 print:text-2xl print:mb-1">
                {t('financial_reports')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 print:hidden">
                {t('reports_desc')}
              </p>
              <p className="hidden print:block text-sm text-slate-500 font-mono">
                {t('statement_type')}: {t(type + '_report')} | {t('date')}: {startDate} {type === 'custom' ? `- ${endDate}` : ''}
              </p>
            </div>
          </div>

          {report && !loading && (
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={printReport}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                {t('print_report')}
              </button>
              <button
                type="button"
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t('export_excel')}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm print:hidden">
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
          <div className="space-y-6">
            {/* Tab toggles */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-2 print:hidden overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('pl')}
                className={`px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'pl'
                    ? 'border-[#1c3f24] text-[#1c3f24] dark:text-emerald-400 dark:border-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tCustom('profit_loss_subtitle')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bs')}
                className={`px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'bs'
                    ? 'border-[#00b050] text-[#00b050] dark:text-emerald-400 dark:border-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tCustom('balance_sheet_subtitle')}
              </button>
            </div>

            {/* Screen active tab view */}
            <div className="print:hidden">
              {activeTab === 'pl' ? renderProfitLoss(false) : renderBalanceSheet(false)}
            </div>
            
            {/* Printable multi-page package view */}
            <div className="hidden print:block space-y-12 report-paper-theme bg-white p-4">
              {renderProfitLoss(true)}
              <div className="page-break"></div>
              {renderBalanceSheet(true)}
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
