# Khaata - Personal Finance Dashboard

Your smart finance tracker for expenses, bills, EMIs, and UPI payments — with AI-powered insights.

##  Features

- **AI Receipt Scanner** - Scan UPI/bank screenshots to auto-extract transactions
- **Smart Categorization** - Automatic merchant recognition for 50+ Indian apps
- **AI Financial Advisor** - Get personalized spending insights and budget tips
- **Beautiful Dashboard** - Visual spending trends and category breakdowns
- **Budget Tracking** - Set budgets and track spending by category
- **Bill Reminders** - Never miss a payment with upcoming bills tracker
- **Export Reports** - Download CSV or PDF reports anytime
- **Works Everywhere** - Install as an app on any device (PWA)
- **Secure & Private** - Your data is encrypted and stored securely

## Getting Started

### 1. Create Your Account

Visit your deployed Khaata instance and click **"Sign up"**

- Enter your email and password (minimum 6 characters)
- Click "Sign up"
- You're in!

### 2. Configure AI Features

To use receipt scanning and AI advisor:

**Option A: Google Gemini (Free)**
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. In Khaata, go to **Settings** → **AI Provider**
3. Select **Google Gemini**
4. Paste your API key
5. Click **Save AI settings**

**Option B: Custom OpenAI-Compatible API**
1. In Khaata, go to **Settings** → **AI Provider**
2. Select **Custom OpenAI API**
3. Enter:
   - **API Base URL**: `https://api.openai.com/v1` (or your endpoint)
   - **API Key**: Your API key
   - **Model ID**: `gpt-4o-mini` or your preferred model
4. Click **Save AI settings**

### 3. Add Your First Transaction

**Manually:**
- Click the **+ Add** button
- Select type (Expense, Bill, EMI, or Income)
- Enter amount and details
- Choose category
- Click **Save**

**Scan a Receipt:**
- Click the **Scan** button
- Upload a UPI payment screenshot or bank transaction
- AI extracts transaction details automatically
- Review and click **Add**

**Supported Apps:**
- UPI: PhonePe, Google Pay, Paytm, BHIM, Amazon Pay, CRED, MobiKwik
- Banks: HDFC, SBI YONO, ICICI iMobile, Axis, Kotak 811
- E-commerce: Swiggy, Zomato, Blinkit, Zepto, BigBasket, Amazon, Flipkart
- And 40+ more Indian payment apps!

### 4. Quick Tips

- **Dashboard:** View spending trends, category breakdown, and monthly summary
- **AI Advisor:** Click the sparkle icon to ask questions like "How can I reduce my spending?"
- **Budgets:** Set monthly budgets in the Budgets page
- **Bills:** Track upcoming bills and EMIs in the Bills page
- **Export:** Download your data as CSV or PDF from the top menu
- **Search:** Filter transactions by type, category, or date range

##  Install as App

Khaata works as a Progressive Web App (PWA):

**On Desktop:**
- Chrome/Edge: Click the install icon in the address bar
- Or look for "Install Khaata" in your browser menu

**On Mobile:**
- iOS Safari: Tap Share → Add to Home Screen
- Android Chrome: Tap menu → Install app

##  Security & Privacy

- **Encrypted Storage:** All data stored securely in Cloudflare D1
- **Session-Based Auth:** Secure HTTP-only cookies with 30-day expiry
- **Password Hashing:** SHA-256 encryption for passwords
- **No Tracking:** We don't track your activity or sell your data
- **Encrypted API Keys:** AI API keys encrypted in database with AES-256-GCM

##  Use Cases

- **Personal Finance:** Track daily expenses and monthly budgets
- **Bill Management:** Never miss rent, EMI, or subscription payments
- **Expense Reports:** Generate reports for tax filing or reimbursements
- **Budget Planning:** Analyze spending patterns and set realistic budgets
- **Family Finances:** Share access with family members (if enabled)

##  AI Features

### Receipt Scanner
- Extracts merchant, amount, date, and payment method
- Recognizes single transactions and transaction history lists
- Supports UPI, bank apps, e-commerce, and printed receipts
- Auto-categorizes based on merchant

### Financial Advisor
- Personalized spending insights based on your data
- Budget recommendations by category
- Savings suggestions and spending alerts
- Conversational interface - ask anything!

##  Export Your Data

1. Click the menu icon in the top bar
2. Select **Export**
3. Choose format:
   - **CSV** - For Excel/Google Sheets
   - **PDF** - For printing or sharing
4. Download your report

##  Need Help?

**AI Features Not Working?**
- Make sure you've configured your AI provider in Settings
- Check that your API key is valid
- Gemini offers a generous free tier

**Can't Login?**
- Check your email and password
- Sessions expire after 30 days - sign in again

**Receipt Scanner Issues?**
- Use clear, well-lit screenshots
- Ensure text is readable
- Try cropping to show only the transaction

---

##  For Developers

Want to run your own instance? See **[SETUP.md](SETUP.md)** for complete setup instructions.

### Quick Start

```bash
npm install
npm run build
npm run dev
```

Open http://localhost:5173

See [SETUP.md](SETUP.md) for detailed instructions, database setup, and troubleshooting.

### Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Database:** Cloudflare D1 (SQLite at the edge)
- **API:** Cloudflare Pages Functions
- **Charts:** Recharts
- **AI:** Google Gemini / OpenAI-compatible APIs
- **Build:** Vite
- **Encryption:** AES-256-GCM for API keys

### Deploy to Cloudflare Pages

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment instructions.

**Quick steps:**
1. Push code to GitHub
2. Connect to Cloudflare Pages
3. Build command: `npm run build`
4. Build output: `dist`
5. **Important:** Configure D1 binding in Settings → Functions
   - Variable name: `DB`
   - D1 database: Select your database

Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)

### Cost

Cloudflare Free Tier includes:
- 5GB D1 storage
- 5M reads/day
- 100K writes/day
- 100K Pages Functions requests/day
- Unlimited bandwidth

Perfect for personal use!

---

**Built with ❤️ for Indian fintech users**

[Report an Issue](https://github.com/yourusername/khaata/issues) • [Request a Feature](https://github.com/yourusername/khaata/issues/new)
