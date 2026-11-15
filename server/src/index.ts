import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { globalApiLimiter, authLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/auth.js';
import gymRoutes from './routes/gyms.js';
import memberRoutes from './routes/members.js';
import attendanceRoutes from './routes/attendance.js';
import paymentRoutes from './routes/payments.js';
import aiRoutes from './routes/ai.js';
import automationRoutes from './routes/automation.js';
import invitationRoutes from './routes/invitations.js';
import subscriptionRoutes from './routes/subscriptions.js';
import adminRoutes from './routes/admin.js';
import trainerRoutes from './routes/trainers.js';
import planRoutes from './routes/plans.js';
import workoutRoutes from './routes/workouts.js';
import reportsRoutes from './routes/reports.js';

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middlewares & CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === config.clientUrl) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/test, honors configured clientUrl
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Rate Limiters
app.use('/api', globalApiLimiter);
app.use('/api/auth', authLimiter);

// Root Welcome & Navigation
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GymFlow AI API Server</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #090B0A;
      color: #E4E4E7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background-color: #151A17;
      border: 1px solid #1C2420;
      border-radius: 24px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(182, 255, 69, 0.15);
      color: #B6FF45;
      border: 1px solid rgba(182, 255, 69, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #B6FF45;
      border-radius: 50%;
      box-shadow: 0 0 10px #B6FF45;
    }
    h1 {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    p {
      color: #A1A1AA;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      background-color: #B6FF45;
      color: #090B0A;
      font-weight: 900;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 0 25px rgba(182, 255, 69, 0.3);
      margin-bottom: 28px;
    }
    .btn:hover {
      background-color: #a3e635;
      transform: translateY(-2px);
    }
    .endpoints {
      background: #090B0A;
      border: 1px solid #1C2420;
      border-radius: 16px;
      padding: 18px;
      text-align: left;
    }
    .endpoints-title {
      font-size: 11px;
      font-weight: 800;
      color: #71717A;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .endpoints-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 12px;
      font-family: monospace;
    }
    .endpoint-item {
      color: #D4D4D8;
    }
    .endpoint-item span {
      color: #B6FF45;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      Backend Server Online
    </div>
    <h1>GymFlow AI Backend API</h1>
    <p>
      The Express.js &amp; Supabase API server is running on <strong>Port 5000</strong>.<br>
      To access the full interactive user application (Dashboards, Members, Workouts, Diets, and Attendance), launch the frontend interface:
    </p>
    <a href="http://localhost:5173" class="btn">🚀 Open Web Application (Port 5173)</a>

    <div class="endpoints">
      <div class="endpoints-title">Active API Endpoints</div>
      <div class="endpoints-grid">
        <div class="endpoint-item"><span>GET</span> /health</div>
        <div class="endpoint-item"><span>API</span> /api/auth</div>
        <div class="endpoint-item"><span>API</span> /api/members</div>
        <div class="endpoint-item"><span>API</span> /api/attendance</div>
        <div class="endpoint-item"><span>API</span> /api/payments</div>
        <div class="endpoint-item"><span>API</span> /api/trainers</div>
        <div class="endpoint-item"><span>API</span> /api/workouts</div>
        <div class="endpoint-item"><span>API</span> /api/plans</div>
        <div class="endpoint-item"><span>API</span> /api/reports</div>
      </div>
    </div>
  </div>
</body>
</html>
    `);
  }

  return res.json({
    status: 'online',
    app: 'GymFlow AI Backend API',
    tagline: 'Smart Gym Management. Powered by AI.',
    port: 5000,
    frontendUrl: 'http://localhost:5173',
    healthCheck: 'http://localhost:5000/health',
    message: 'To use the graphical GymFlow AI interface, please open http://localhost:5173 in your browser.',
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'GymFlow AI Backend API',
    tagline: 'Smart Gym Management. Powered by AI.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/reports', reportsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Global Safe Error Handler (Never expose stack traces in production)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled API Error]:', err?.message || err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: config.nodeEnv === 'production' ? 'Internal Server Error' : (err?.message || 'Internal Server Error'),
  });
});

// Server Listen
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🏋️‍♂️ GYMFLOW AI BACKEND SERVER ACTIVE`);
  console.log(`🚀 Port: ${config.port} | Mode: ${config.nodeEnv}`);
  console.log(`🌐 Base URL: http://localhost:${config.port}`);
  console.log(`⚡ Health: http://localhost:${config.port}/health`);
  console.log(`=======================================================`);
});

export default app;
