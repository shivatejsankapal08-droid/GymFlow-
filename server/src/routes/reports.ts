import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';
import {
  getReportsOverview,
  getRevenueReport,
  getMembershipReport,
  getAttendanceReport,
  getTrainerPerformanceReport,
  getMemberEngagementReport,
  generateCSVExport,
  generateHTMLReport,
} from '../services/reportsService.js';

const router = Router();

// Authentication and Multi-Tenant Isolation
router.use((req: AuthRequest, res, next) => {
  if (!req.headers.authorization && !req.headers['x-demo-role']) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required for reports' });
  }
  next();
});
router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

// Restrict report access strictly to Gym Owners and Super Admins
router.use((req: AuthRequest, res, next) => {
  const role = req.user?.role;
  if (role !== 'gym_owner' && role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden: Only gym owners and super admins can access business reports' });
  }
  next();
});

// ==============================================================================
// 1. OVERVIEW DASHBOARD REPORT
// ==============================================================================
router.get('/overview', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const { range, startDate, endDate } = req.query;

    const overview = getReportsOverview(
      gymId,
      range ? String(range) : undefined,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );

    res.json({ success: true, ...overview, kpis: overview.metrics, charts: overview.charts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate overview report', details: err.message });
  }
});

// ==============================================================================
// 2. REVENUE & FINANCIAL REPORTS
// ==============================================================================
router.get('/revenue', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const { range, startDate, endDate } = req.query;

    const report = getRevenueReport(
      gymId,
      range ? String(range) : undefined,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );

    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate revenue report', details: err.message });
  }
});

// ==============================================================================
// 3. MEMBERSHIP & RETENTION REPORTS
// ==============================================================================
router.get('/memberships', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const { range, startDate, endDate } = req.query;

    const report = getMembershipReport(
      gymId,
      range ? String(range) : undefined,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );

    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate membership report', details: err.message });
  }
});

// ==============================================================================
// 4. ATTENDANCE & FACILITY UTILIZATION REPORTS
// ==============================================================================
router.get('/attendance', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const { range, startDate, endDate } = req.query;

    const report = getAttendanceReport(
      gymId,
      range ? String(range) : undefined,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );

    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate attendance report', details: err.message });
  }
});

// ==============================================================================
// 5. TRAINER PERFORMANCE REPORTS
// ==============================================================================
router.get('/trainers', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const report = getTrainerPerformanceReport(gymId);

    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate trainer report', details: err.message });
  }
});

// ==============================================================================
// 6. MEMBER ENGAGEMENT & RETENTION LISTS
// ==============================================================================
router.get('/member-engagement', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const report = getMemberEngagementReport(gymId);

    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate member engagement report', details: err.message });
  }
});

// ==============================================================================
// 7. CSV / EXCEL EXPORT ENDPOINT
// ==============================================================================
router.get(['/export', '/export/csv'], (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const type = String(req.query.type || req.query.entity || 'members');
    const { range } = req.query;

    const csvData = generateCSVExport(gymId, type, range ? String(range) : undefined);

    const filename = `gymflow-${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err: any) {
    res.status(500).json({ error: 'Export failed', details: err.message });
  }
});

// ==============================================================================
// 8. PRINTABLE PDF / HTML REPORT VIEW
// ==============================================================================
router.get(['/pdf/:reportType', '/export/pdf'], (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const reportType = String(req.params.reportType || req.query.type || 'executive');
    const { range } = req.query;

    const html = generateHTMLReport(gymId, reportType, range ? String(range) : undefined);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate printable report', details: err.message });
  }
});

export default router;
