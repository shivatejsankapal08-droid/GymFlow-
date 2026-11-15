import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  QrCode,
  Zap,
  CreditCard,
  Bot,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Star,
  Building2,
  Phone,
  Mail,
  Play,
  Check
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { openAuthModal, login, setActivePage } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const pricingTiers = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? '₹2,499' : '₹1,999',
      period: '/month',
      desc: 'Ideal for boutique gyms, fitness studios and crossfit boxes up to 100 members.',
      features: [
        'Up to 100 Active Members',
        'QR Code Attendance Scanner',
        'Basic WhatsApp Reminders',
        'Razorpay & UPI Payments',
        'Standard Financial Reports',
        '1 Admin & 3 Trainer Accounts',
      ],
      highlight: false,
      cta: 'Start with Starter',
      planKey: 'starter',
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? '₹5,999' : '₹4,799',
      period: '/month',
      desc: 'Everything required to scale a high-growth gym with AI copilot & full n8n automation.',
      features: [
        'Up to 500 Active Members',
        'Unlimited QR Kiosks & Check-ins',
        'AI Business Insights & Churn Predictor',
        'Full n8n WhatsApp Cloud Automations',
        'Razorpay Auto-reconciliation & Invoicing',
        'Trainer Scheduling & Commission Tracker',
        'Custom Gym Branding & Digital Cards',
        'Priority 24/7 Phone & WhatsApp Support',
      ],
      highlight: true,
      badge: 'Most Popular',
      cta: 'Start 14-Day Free Trial',
      planKey: 'pro',
    },
    {
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? '₹12,999' : '₹10,399',
      period: '/month',
      desc: 'For multi-branch gym chains, fitness franchises and luxury wellness athletic clubs.',
      features: [
        'Unlimited Members & Branches',
        'Dedicated PostgreSQL Tenant Database',
        'Custom AI Workout & Nutrition Chatbots',
        'Multi-Branch Super Admin Central Console',
        'Turnstile & Biometric Hardware API Sync',
        'White-label Member & Trainer Mobile Apps',
        'Dedicated Technical Account Manager',
        'Custom SLA 99.95% Uptime Guarantee',
      ],
      highlight: false,
      cta: 'Contact Sales',
      planKey: 'enterprise',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border-b border-emerald-500/20 py-2 px-4 text-center text-xs text-zinc-300">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <strong className="text-white">GymFlow AI v2.4 Live:</strong> Real-time WhatsApp Cloud API
          & n8n Automation Workflows are now active.
        </span>
      </div>

      {/* Main Public Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-black text-zinc-950 text-2xl shadow-lg shadow-emerald-500/30">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">GYMFLOW</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 -mt-0.5">Smart Gym Management. Powered by AI.</p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-emerald-400 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="hover:text-emerald-400 transition-colors">
            Pricing
          </a>
          <a href="#testimonials" className="hover:text-emerald-400 transition-colors">
            Success Stories
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              login('gym_owner');
              setActivePage('dashboard');
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
          >
            <span>Live Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 lg:px-12 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />

        {/* Top pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-8 shadow-sm shadow-emerald-500/10 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AUTONOMOUS GYM OPERATING SYSTEM</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Smart Gym Management. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
            Powered by AI.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Stop chasing expired memberships and doing manual attendance. GymFlow AI automates
          contactless QR check-ins, WhatsApp fee recovery, trainer payouts and daily operations with
          intelligent workflows.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              login('gym_owner');
              setActivePage('dashboard');
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/30 hover:scale-105"
          >
            <span>Launch Interactive Platform</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => openAuthModal('register')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm border border-zinc-700/80 flex items-center justify-center gap-2 transition-all"
          >
            <span>Start 14-Day Free Trial</span>
          </button>
        </div>

        {/* Social Proof Stats */}
        <div className="mt-16 pt-12 border-t border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-3xl font-extrabold text-white">1,240+</h3>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-semibold">Gyms & Studios</p>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-emerald-400">480,000+</h3>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-semibold">Active Members</p>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">₹18.4 Cr</h3>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-semibold">Processed / Mo</p>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-emerald-400">98.6%</h3>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-semibold">On-Time Renewal</p>
          </div>
        </div>

        {/* Live Interactive Hero Mockup Card */}
        <div className="mt-16 p-3 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-2xl relative group">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-zinc-500 ml-2 font-mono">
                app.gymflow.ai/dashboard • IronPulse Fitness Club
              </span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>System Live • 78 Checked In</span>
            </div>
          </div>

          {/* Inner Dashboard Teaser Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-left">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <p className="text-xs text-zinc-400">Monthly Revenue</p>
              <h4 className="text-2xl font-black text-white mt-1">₹4,85,000</h4>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>+16.4% vs last month</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
              <p className="text-xs text-zinc-400">Today Check-Ins (QR)</p>
              <h4 className="text-2xl font-black text-white mt-1">78 Members</h4>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400">
                <QrCode className="w-4 h-4" />
                <span>Peak hours: 06:30 - 09:00 AM</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 bg-emerald-950/20">
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> AI Insight
              </p>
              <p className="text-xs text-zinc-200 mt-1 leading-snug">
                14 members at risk of drop-off. Trigger WhatsApp recovery workflow.
              </p>
              <button
                onClick={() => {
                  login('gym_owner');
                  setActivePage('dashboard');
                }}
                className="mt-3 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Open in Live Dashboard <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-12 bg-zinc-950/50 border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
              Engineered For Modern Fitness Gyms
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
              Everything Your Gym Needs to Run on Autopilot
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-4">
              Replace fragmented spreadsheets, outdated desktop software, and manual register books
              with a single intelligent cloud platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Business Copilot & Churn Predictor</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Our machine learning model analyzes attendance drop-offs, predicts member churn 14
                days before expiration, and suggests tailored retention discounts automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Contactless QR Attendance Station</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Zero hardware cost. Place any tablet or smartphone at the entrance. Members scan
                their dynamic digital pass for verified sub-second entry and exit tracking.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">n8n + WhatsApp Cloud API Automations</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Deliver automated fee renewal reminders, instant payment tax invoices, birthday
                wishes, and daily executive reports directly to members and owners on WhatsApp.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Razorpay & UPI Auto-Settlements</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Accept credit cards, debit cards, and UPI payments with auto-reconciled invoices. Send
                one-click payment links over WhatsApp with instant digital receipts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Trainer Schedules & Payout Roster</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Assign members to trainers, track personal training sessions, schedule shifts, and
                automate commission calculations based on member check-ins.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tenant PostgreSQL Security</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Built on Supabase with strict Row Level Security (RLS). Every gym operates in total
                data isolation. Super Admins manage multiple branches with central billing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
            Invest in Growth. Not Spreadsheets.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3">
            Choose the perfect plan for your gym. Upgrade or cancel anytime.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                billingCycle === 'monthly' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-400'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-white font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10'
                  : 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-zinc-950 text-[11px] font-black uppercase tracking-wider shadow-md">
                  {tier.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-zinc-400 mt-2 min-h-[36px]">{tier.desc}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-white">{tier.price}</span>
                  <span className="text-xs text-zinc-400">{tier.period}</span>
                </div>

                <div className="mt-8 space-y-3">
                  <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Included capabilities:
                  </p>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  login('gym_owner');
                  setActivePage('dashboard');
                }}
                className={`mt-10 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  tier.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 lg:px-12 bg-zinc-950/60 border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Trusted by Premier Gym Owners
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Transforming Fitness Businesses Across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                "Our renewal rates jumped from 68% to 92% in 60 days. The automated WhatsApp reminders
                with Razorpay links collected ₹1.8 Lakh in pending dues without awkward follow-up
                calls."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                  alt="Marcus Vance"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div>
                  <p className="text-xs font-bold text-white">Marcus Vance</p>
                  <p className="text-[10px] text-zinc-400">Owner, IronPulse Fitness Club (Mumbai)</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                "The contactless QR attendance kiosk eliminated morning front-desk queues. Over 600
                athletes check in seamlessly every day, and our trainers love having their schedules on
                mobile."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                  alt="Rhea Sen"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div>
                  <p className="text-xs font-bold text-white">Rhea Sen</p>
                  <p className="text-[10px] text-zinc-400">Head Coach, Titan Forge CrossFit</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
              <div className="flex text-amber-400 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                "The AI business insights flagged a peak capacity bottleneck in our free weights area.
                We shifted 40 members to morning slots with incentive points and boosted satisfaction
                instantly."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
                  alt="Devendra Kapoor"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div>
                  <p className="text-xs font-bold text-white">Devendra Kapoor</p>
                  <p className="text-[10px] text-zinc-400">Director, Zenith Athletic Club</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-zinc-950 border-t border-zinc-800 py-12 px-6 lg:px-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-zinc-950 text-base">
              G
            </div>
            <div>
              <span className="font-bold text-white text-sm">GYMFLOW AI</span>
              <p className="text-[11px] text-zinc-500">Smart Gym Management. Powered by AI.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-zinc-300">
              Features
            </a>
            <a href="#pricing" className="hover:text-zinc-300">
              Pricing
            </a>
            <button onClick={() => openAuthModal('login')} className="hover:text-zinc-300">
              Dashboard Login
            </button>
            <a href="mailto:support@gymflow.ai" className="hover:text-zinc-300">
              support@gymflow.ai
            </a>
          </div>

          <p>© 2026 GymFlow AI Technologies Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
