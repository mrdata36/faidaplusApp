# NYARAKA ZA MFUMO WA FAIDAPLUS (FAIDAPLUS SYSTEM DOCUMENTATION)
*Huu ni waraka kamili wa kiufundi na matumizi ya mfumo wa FaidaPlus ulioandaliwa tayari kwa ajili ya kunakiliwa na kuwekwa kwenye **Microsoft Word** na **Microsoft Excel**.*

---

## YALIYOMO (TABLE OF CONTENTS)
1. **Utangulizi wa Mfumo (Introduction to FaidaPlus)**
2. **Usanifu na Muundo wa Ndani (Technical & Offline-First Architecture)**
3. **Mwongozo wa Matumizi kwa Kila Ukurasa (Step-by-Step User Manual for MS Word)**
   - 3.1 Dashibodi Kuu (System Dashboard)
   - 3.2 Katalogi na Usimamizi wa Bidhaa (Products & Inventory)
   - 3.3 Daftari la Miamala (Transactions & Ledgers)
   - 3.4 Ripoti za Kifedha (Financial Statements: Profit & Loss & Balance Sheet)
   - 3.5 Mfumo wa Arifa (Notification Engine)
   - 3.6 Mipangilio na Lugha Mbili (Settings & Multilingual System)
4. **Muundo wa Lahajakazi za Excel (Excel Templates, Formulas & Ledger Layouts)**
   - 4.1 Lahajakazi ya Bidhaa (Products Sheet Schema)
   - 4.2 Lahajakazi ya Miamala (Transactions Ledger Schema)
   - 4.3 Ripoti ya Faida na Hasara kwa Excel (P&L Statement with Formulas)
5. **Hitimisho na Usalama wa Data (Data Preservation & Integrity)**

---

## 1. UTANGULIZI WA MFUMO (INTRODUCTION TO FAIDAPLUS)
**FaidaPlus** ni mfumo wa kisasa wa usimamizi wa biashara, mauzo, na hesabu za kifedha (Accounting & Inventory Management System) ulioundwa kurahisisha utendaji kazi wa kila siku wa wafanyabiashara wadogo, wa kati na wakubwa. 

### Malengo ya Mfumo:
*   **Kufuatilia Bidhaa (Stock/Inventory Tracking):** Kupunguza upotevu wa bidhaa kwa kufuatilia mzunguko wa stoki na kutoa arifa pale bidhaa zinapokaribia kuisha.
*   **Kurekodi Miamala (Transaction Ledger):** Kurekodi mapato (mauzo) na matumizi yote ya biashara ili kuwa na kumbukumbu sahihi.
*   **Uzalishaji wa Ripoti za Kifedha (Automated Financial Reporting):** Kuzalisha ripoti muhimu za kifedha kama vile **Ripoti ya Faida na Hasara (Profit & Loss)** na **Waraka wa Mizania (Balance Sheet)** bila kuhitaji ujuzi mkubwa wa uhasibu.
*   **Utendaji Kazi Bila Mtandao (Offline-First Capability):** Wafanyabiashara wanaweza kuendelea kutumia mfumo hata kukiwa hakuna mtandao wa intaneti na data zitasawazishwa kiotomatiki pindi mtandao utakapopatikana.

---

## 2. USANIFU NA MUUNDO WA NDANI (TECHNICAL ARCHITECTURE)
Mfumo huu umejengwa kwa kutumia teknolojia za kisasa zinazohakikisha kasi kubwa, muonekano nadhifu, na usalama wa kiwango cha juu:

1.  **Mbele (Frontend):** React (kutumia Vite) na lugha ya TypeScript kuhakikisha usalama wa msimbo.
2.  **Muonekano (Styling):** Tailwind CSS kwa ajili ya muundo unaojirekebisha kulingana na kioo cha kifaa (Responsive UI) na mandhari ya Mwangaza/Giza (Light/Dark themes).
3.  **Usimamizi wa Data wa Ndani (Local State Engine):** Unatumia teknolojia ya hifadhi ya ndani (IndexedDB/LocalStorage) inayowezesha mfumo kufanya kazi ukiwa nje ya mtandao (Offline).
4.  **Usawazishaji wa Data (DataSyncContext):** Mfumo una uwezo wa kugundua uwepo wa intaneti na kusawazisha (Sync) data zote zilizorekodiwa nje ya mtandao kwenda kwenye seva kuu kiotomatiki.
5.  **Uchapishaji Bora (Print Optimization):** Mfumo unajumuisha mitindo maalum ya CSS (`@media print`) inayobadilisha kurasa za ripoti kuwa muundo nadhifu wa karatasi ya kiofisi (Letter/A4 size) wakati wa kuchapa au kuhifadhi kama PDF.

---

## 3. MWONGOZO WA MATUMIZI YA MFUMO (FOR MICROSOFT WORD)
*(Sehemu hii inaweza kunakiliwa moja kwa moja kwenda kwenye Mwongozo wa Mtumiaji wa Microsoft Word)*

### 3.1 Dashibodi Kuu (System Dashboard)
Dashibodi ndiyo kitovu cha habari zote za biashara yako. Inatoa picha ya haraka kuhusu afya ya kifedha ya biashara.
*   **Viashiria Muhimu vya Utendaji (KPI Cards):**
    *   **Mauzo Jumla (Total Sales):** Thamani kamili ya fedha zilizopatikana kutokana na mauzo katika kipindi kilichochaguliwa.
    *   **Gharama Jumla (Total Expenses):** Thamani ya matumizi yote yaliyofanyika kwenye biashara.
    *   **Faida Safi (Net Profit):** Mauzo ukiondoa gharama. Thamani hii inabadilika kuwa ya kijani (ikiwa kuna faida) au nyekundu (ikiwa kuna hasara).
*   **Chati za Maendeleo (Visual Charts):** Chat inayonyesha mwenendo wa mauzo dhidi ya matumizi kwa siku au miezi ili kusaidia kufanya maamuzi ya kibiashara.

### 3.2 Katalogi na Usimamizi wa Bidhaa (Products & Inventory)
Hapa ndipo mtumiaji anaposajili na kusimamia bidhaa zote za duka au biashara yake.
*   **Sifa za Ukurasa:**
    1.  **Kuongeza Bidhaa Mpya:** Bonyeza kitufe cha "Ongeza Bidhaa" (Add Product). Jaza Jina la bidhaa, Jamii/Kundi (Category), Bei ya Kununulia (Cost Price), Bei ya Kuuzia (Selling Price), na Kiasi cha kuanzia (Initial Stock).
    2.  **Kiwango cha Tahadhari (Reorder Level):** Mtumiaji anaweza kuweka kiwango cha chini cha stoki (e.g., bidhaa zikibaki 5) ambapo mfumo utatoa arifa ya "Low Stock".
    3.  **Uhariri na Kufuta:** Uwezo wa kubadilisha bei au idadi ya stoki wakati wowote.

### 3.3 Daftari la Miamala (Transactions & Ledgers)
Sehemu hii inafanya kazi kama daftari kuu la hesabu (General Ledger). Kila shughuli ya kifedha inapaswa kurekodiwa hapa.
*   **Aina za Miamala:**
    *   **Mapato (Inflow/Income):** Miamala inayotokana na mauzo ya bidhaa au huduma.
    *   **Matumizi (Outflow/Expenses):** Miamala kama vile kulipia pango, umeme, mishahara au ununuzi wa bidhaa mpya.
*   **Vichungi (Filters):** Mtumiaji anaweza kuchuja miamala kulingana na Tarehe, Aina (Mapato/Matumizi), au Njia ya Malipo (Cash, Bank Transfer, Mobile Money).

### 3.4 Ripoti za Kifedha (Financial Statements)
Ukurasa huu unazalisha ripoti rasmi zinazoweza kuwasilishwa kwa benki, mamlaka za kodi, au wanahisa.
*   **Ripoti ya Faida na Hasara (Profit & Loss Statement):**
    *   Inaonyesha Mapato yote ya uendeshaji (Gross Revenues).
    *   Inaonyesha Gharama za Mauzo (Cost of Goods Sold - COGS).
    *   Inaonyesha Faida Ghafi (Gross Profit).
    *   Inaonyesha Gharama za Uendeshaji (Operating Expenses).
    *   Inaonyesha Faida Safi (Net Profit) baada ya kodi/gharama zote.
*   **Waraka wa Mizania (Balance Sheet):**
    *   **Rasilimali (Assets):** Thamani ya fedha zilizopo mikononi/benki, thamani ya stoki ya bidhaa, na vifaa vya biashara.
    *   **Deni (Liabilities):** Madeni yote ambayo biashara inadaiwa na wauzaji au benki.
    *   **Mtaji na Akiba (Equity):** Mtaji ulioingizwa na mmiliki pamoja na faida iliyobaki (Retained Earnings).
    *   *Kanusho la Mizania:* Rasilimali lazima ziwe sawa na Deni jumlisha Mtaji (`Assets = Liabilities + Equity`).

### 3.5 Mfumo wa Arifa (Notification Engine)
Mfumo unafuatilia mwenendo wa biashara kila wakati na kutoa taarifa za haraka:
*   Arifa za bidhaa zinazokaribia kuisha (Low Stock Alerts).
*   Arifa za miamala mikubwa inayorekodiwa au mabadiliko ya usawazishaji wa data (Sync Alerts).

### 3.6 Mipangilio na Lugha Mbili (Settings & Multilingual System)
Ili kuongeza ufanisi, mfumo unaruhusu kubadilisha lugha kwa kubonyeza kitufe kimoja tu:
*   **Lugha Zinazoshikiliwa:** Kiswahili na Kiingereza (English).
*   **Mipangilio ya Profaili:** Kubadilisha jina la biashara, nembo (logo), anwani ya duka, na sarafu inayotumika (e.g., TZS, KES, USD).

---

## 4. MUUNDO WA LAHAJAKAZI ZA EXCEL (FOR MICROSOFT EXCEL)
*(Sehemu hii inatoa muundo sahihi wa kutengeneza majedwali kwenye MS Excel kwa ajili ya usajili wa data au uchambuzi wa nje)*

### 4.1 Lahajakazi ya Bidhaa (Products Sheet Layout)
Weka vichwa vya nguzo vifuatavyo kwenye **Mstari wa 1 (Row 1)** kwenye karatasi yako ya Excel:

| Column | Header Name (Kiswahili) | Header Name (English) | Data Type | Maelezo (Description) |
| :--- | :--- | :--- | :--- | :--- |
| **A** | Kitambulisho | Product ID | Text/Number | Nambari maalum ya kipekee ya kila bidhaa |
| **B** | Jina la Bidhaa | Product Name | Text | Jina rasmi la bidhaa (e.g., Sukari 1kg) |
| **C** | Jamii | Category | Text | Kundi la bidhaa (e.g., Chakula, Vinywaji) |
| **D** | Bei ya Kununulia | Cost Price | Decimal | Thamani uliyolipia kununua bidhaa hiyo |
| **E** | Bei ya Kuuzia | Selling Price | Decimal | Thamani utakayomuzia mteja |
| **F** | Idadi iliyopo | Stock Quantity | Integer | Idadi ya bidhaa zilizopo stoki kwa sasa |
| **G** | Kiwango cha Tahadhari | Reorder Level | Integer | Kiasi cha chini ambacho kikifikiwa inatakiwa kuagiza |
| **H** | Thamani ya Stoki | Inventory Value | Formula | `=(Idadi iliyopo * Bei ya Kununulia)` au `=F2*D2` |

### 4.2 Lahajakazi ya Miamala (Transactions Ledger Layout)
Tengeneza jedwali hili kwenye Excel ili kufuatilia miamala ya kila siku:

| Column | Header Name (Kiswahili) | Header Name (English) | Data Type | Maelezo / Validations |
| :--- | :--- | :--- | :--- | :--- |
| **A** | Tarehe | Date | Date (YYYY-MM-DD) | Tarehe ambayo muamala ulifanyika |
| **B** | Kitambulisho cha Muamala | Transaction ID | Text | Namba ya kumbukumbu ya risiti au mfumo |
| **C** | Aina ya Muamala | Type | List (Mapato / Matumizi) | Chagua kama ni fedha inayoingia au inayotoka |
| **D** | Maelezo | Description | Text | Maelezo mafupi kuhusu muamala huo |
| **E** | Kiasi | Amount | Decimal | Thamani ya fedha ya muamala |
| **F** | Njia ya Malipo | Payment Method | List (Cash / Bank / Mobile) | Jinsi fedha ilivyolipwa au kupokelewa |
| **G** | Mfanyakazi | Recorded By | Text | Jina la mtu aliyerekodi muamala huo |

---

### 4.3 Ripoti ya Faida na Hasara kwa Excel (P&L Template with Formulas)
Unaweza kutumia kiolezo hiki kwenye Excel kwa kunakili fomula hizi ili kupata hesabu sahihi:

| Row (Mstari) | A (Kipengele / Item) | B (Thamani / Value) | C (Fomula ya Excel / Excel Formula) |
| :---: | :--- | :---: | :--- |
| **1** | **RIPOTI YA FAIDA NA HASARA (PROFIT & LOSS)** | | *Kichwa cha Ripoti* |
| **2** | **Kipindi:** Janyuari - Desemba 2026 | | |
| **3** | | | |
| **4** | **1. MAPATO (REVENUES)** | | |
| **5** | Mauzo Jumla (Gross Sales) | Thamani | *(Ingiza jumla ya mauzo yote ya mwaka)* |
| **6** | Mapato Mengineyo (Other Income) | Thamani | *(Kama yapo)* |
| **7** | **Jumla ya Mapato (Total Revenue)** | **Formula** | `=SUM(B5:B6)` |
| **8** | | | |
| **9** | **2. GHARAMA ZA MAUZO (COST OF GOODS SOLD - COGS)** | | |
| **10** | Stoki ya Kuanzia (Opening Stock Value) | Thamani | *(Thamani ya stoki mwanzoni mwa kipindi)* |
| **11** | Ununuzi wa Bidhaa (Purchases) | Thamani | *(Gharama zilizotumika kununua stoki mpya)* |
| **12** | Stoki ya Kufungia (Closing Stock Value) | Thamani | *(Thamani ya stoki iliyobaki mwishoni)* |
| **13** | **Jumla ya COGS (Total COGS)** | **Formula** | `=(B10+B11)-B12` |
| **14** | | | |
| **15** | **FAIDA GHAFI (GROSS PROFIT)** | **Formula** | `=B7-B13` |
| **16** | | | |
| **17** | **3. GHARAMA ZA UENDESHAJI (OPERATING EXPENSES)** | | |
| **18** | Pango la Ofisi (Rent) | Thamani | *(Gharama ya pango)* |
| **19** | Mishahara ya Wafanyakazi (Salaries) | Thamani | *(Gharama za mishahara)* |
| **20** | Umeme na Maji (Utilities) | Thamani | *(Gharama za huduma)* |
| **21** | Gharama za Usafirishaji (Transport) | Thamani | *(Gharama za usafiri)* |
| **22** | **Jumla ya Gharama (Total Expenses)** | **Formula** | `=SUM(B18:B21)` |
| **23** | | | |
| **24** | **FAIDA SAFI (NET PROFIT)** | **Formula** | `=B15-B22` |

*(Kumbuka: Unaponakili kwenye Excel, hakikisha herufi za safu kama `B5`, `B6` n.k. zinalingana na safu ulikoweka data yako).*

---

## 5. HITIMISHO NA USALAMA WA DATA (DATA INTEGRITY)
Mfumo wa **FaidaPlus** umeundwa kumpa mfanyabiashara amani ya akili. Kwa kutumia hifadhi ya ndani yenye usawazishaji wa wingu:
1.  Data zako haziwezi kupotea hata intaneti ikikata katikati ya mauzo.
2.  Mteja ana uwezo wa kupakua miamala yote na bidhaa katika muundo nadhifu au kuchapa moja kwa moja kutoka kwenye kivinjari (browser) bila kuhitaji programu za ziada.
3.  Kwa kutumia miongozo ya Excel iliyotajwa hapo juu, mtumiaji anaweza kufanya uchambuzi wa kina zaidi wa data zake kwa kutumia zana kama vile Pivot Tables na VLOOKUP.

---
*Nyaraka hizi ni miliki ya mfumo wa FaidaPlus. Unaweza kuzinakili (copy) na kuzihariri kulingana na mahitaji yako maalum ya kibiashara.*
