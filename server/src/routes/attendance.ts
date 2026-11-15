import { Router } from 'express';
import {
  supabase,
  isSupabaseConfigured,
  inMemoryDB,
  executeAttendanceCheckIn,
  executeAttendanceCheckOut,
  calculateAttendanceStats,
  getMemberAttendanceAnalytics,
  normalizeGymId,
  processAttendanceNotification,
} from '../services/supabaseService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';

const router = Router();

router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

/**
 * GET /api/attendance/stats - Live Attendance Dashboard Metrics
 * Returns 6 KPI metrics, peak hours, hourly flow, and currently active gym visits.
 */
router.get('/stats', async (req: AuthRequest, res) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const stats = calculateAttendanceStats(gymId);

  return res.json({
    success: true,
    data: stats,
    stats,
  });
});

/**
 * GET /api/attendance/today - Today's check-ins and active sessions
 */
router.get('/today', async (req: AuthRequest, res) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const normGym = normalizeGymId(gymId);
  const todayStr = new Date().toISOString().split('T')[0];

  const logs = inMemoryDB.attendance.filter(
    (a: any) =>
      (a.gymId === normGym || a.gym_id === normGym) &&
      (a.attendance_date === todayStr ||
        (a.created_at && a.created_at.startsWith(todayStr)) ||
        (a.check_in && a.check_in.startsWith(todayStr)))
  );

  return res.json({
    success: true,
    data: logs,
    attendance: logs,
    total: logs.length,
  });
});

/**
 * GET /api/attendance/active - Currently inside gym
 */
router.get('/active', async (req: AuthRequest, res) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const normGym = normalizeGymId(gymId);

  const activeVisits = inMemoryDB.attendance.filter(
    (a: any) =>
      (a.gymId === normGym || a.gym_id === normGym) &&
      a.status === 'checked_in' &&
      !a.check_out &&
      !a.checkOutTime
  );

  return res.json({
    success: true,
    data: activeVisits,
    activeVisits,
    count: activeVisits.length,
  });
});

/**
 * GET /api/attendance/history - Full Historical Attendance with Multi-Filter, Search, and Pagination
 */
router.get('/history', async (req: AuthRequest, res) => {
  const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
  const normGym = normalizeGymId(gymId);

  const {
    filter = 'all',
    q,
    planId,
    status = 'all',
    sortBy = 'check_in_desc',
    page = '1',
    limit = '50',
    startDate,
    endDate,
  } = req.query as Record<string, string>;

  let logs = inMemoryDB.attendance.filter(
    (a: any) => a.gymId === normGym || a.gym_id === normGym
  );

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. Date Range Filters
  if (filter === 'today') {
    logs = logs.filter((a: any) => (a.attendance_date || a.created_at || '').startsWith(todayStr));
  } else if (filter === 'yesterday') {
    logs = logs.filter((a: any) => (a.attendance_date || a.created_at || '').startsWith(yesterdayStr));
  } else if (filter === '7days') {
    logs = logs.filter((a: any) => (a.attendance_date || a.created_at || '') >= sevenDaysAgoStr);
  } else if (filter === '30days') {
    logs = logs.filter((a: any) => (a.attendance_date || a.created_at || '') >= thirtyDaysAgoStr);
  } else if (filter === 'custom' && startDate) {
    logs = logs.filter((a: any) => {
      const d = a.attendance_date || a.created_at || '';
      if (endDate) return d >= startDate && d <= endDate;
      return d >= startDate;
    });
  }

  // 2. Search Filter (member name, code, phone)
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    logs = logs.filter(
      (a: any) =>
        (a.memberName && a.memberName.toLowerCase().includes(term)) ||
        (a.memberCode && a.memberCode.toLowerCase().includes(term)) ||
        (a.notes && a.notes.toLowerCase().includes(term))
    );
  }

  // 3. Plan Filter
  if (planId && planId !== 'all') {
    logs = logs.filter((a: any) => {
      const member = inMemoryDB.members.find((m: any) => m.id === a.memberId || m.id === a.member_id);
      return member?.membership_plan_id === planId || (member as any)?.currentPlanId === planId;
    });
  }

  // 4. Status Filter
  if (status && status !== 'all') {
    logs = logs.filter((a: any) => a.status === status);
  }

  // 5. Sorting
  logs.sort((a: any, b: any) => {
    if (sortBy === 'check_in_desc') {
      return new Date(b.check_in || b.created_at).getTime() - new Date(a.check_in || a.created_at).getTime();
    }
    if (sortBy === 'check_in_asc') {
      return new Date(a.check_in || a.created_at).getTime() - new Date(b.check_in || b.created_at).getTime();
    }
    if (sortBy === 'duration_desc') {
      return (b.durationMinutes || 0) - (a.durationMinutes || 0);
    }
    if (sortBy === 'name_asc') {
      return (a.memberName || '').localeCompare(b.memberName || '');
    }
    return 0;
  });

  // 6. Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 50;
  const totalCount = logs.length;
  const startIndex = (pageNum - 1) * pageLimit;
  const paginatedLogs = logs.slice(startIndex, startIndex + pageLimit);

  return res.json({
    success: true,
    data: paginatedLogs,
    attendance: paginatedLogs,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: pageLimit,
      totalPages: Math.ceil(totalCount / pageLimit),
    },
    total: totalCount,
    page: pageNum,
    totalPages: Math.ceil(totalCount / pageLimit),
  });
});

/**
 * POST /api/attendance/scan-qr - Dedicated QR Code Lookup & Resolution
 */
router.post('/scan-qr', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym tenant context is required.' });
  }

  const { qrData, qrToken, memberCode } = req.body;
  const tokenOrCode = qrData || qrToken || memberCode;
  if (!tokenOrCode) {
    return res.status(400).json({ error: 'qrData, qrToken or memberCode is required to resolve QR.' });
  }

  const normGym = normalizeGymId(gymId);
  const member: any = inMemoryDB.members.find((m: any) => {
    if (m.qrToken === tokenOrCode || m.qr_token === tokenOrCode) return true;
    if (m.memberCode === tokenOrCode || m.member_code === tokenOrCode) return true;
    if (m.id === tokenOrCode) return true;
    return false;
  });

  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found for this QR' });
  }

  const memberGym = normalizeGymId(member.gymId || member.gym_id);
  if (memberGym !== normGym) {
    return res.status(403).json({ success: false, error: 'Cross-gym QR scan denied.' });
  }

  return res.status(200).json({
    success: true,
    valid: true,
    member: {
      id: member.id,
      fullName: member.fullName || member.full_name,
      memberCode: member.memberCode || member.member_code,
      status: member.status,
      planName: member.currentPlanName,
    },
  });
});

/**
 * POST /api/attendance/scan - Bi-directional Smart QR Scan
 * Automatically toggles between check-in and check-out based on athlete's active floor state.
 */
router.post('/scan', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym tenant context is required.' });
  }

  const { qrToken, memberCode, action: explicitAction, notes } = req.body;
  if (!qrToken && !memberCode) {
    return res.status(400).json({ error: 'qrToken or memberCode is required to perform optical scan.' });
  }

  const staffName = req.user?.fullName || 'Turnstile Optical Kiosk';
  const staffId = req.user?.id;

  // 1. Locate member
  const normGym = normalizeGymId(gymId);
  const member: any = inMemoryDB.members.find((m: any) => {
    if (qrToken && (m.qrToken === qrToken || m.qr_token === qrToken || m.alias_token === qrToken)) return true;
    if (memberCode && (m.memberCode === memberCode || m.member_code === memberCode)) return true;
    return false;
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      code: 'MEMBER_NOT_FOUND',
      error: 'Unrecognized QR Pass: No athlete found with this identification code.',
    });
  }

  // 2. Multi-tenant Cross-Gym Check
  const memberGym = member.gymId || member.gym_id;
  if (memberGym !== normGym && req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      code: 'CROSS_GYM_DENIED',
      error: 'Cross-gym access denied: This digital pass belongs to an athlete registered at another gym facility.',
      member: {
        id: member.id,
        fullName: member.full_name || member.fullName,
        memberCode: member.member_code || member.memberCode,
      },
    });
  }

  // 3. Check for existing active check-in
  const activeLog = inMemoryDB.attendance.find(
    (a: any) =>
      (a.gymId === normGym || a.gym_id === normGym) &&
      (a.memberId === member.id || a.member_id === member.id) &&
      a.status === 'checked_in' &&
      !a.check_out &&
      !a.checkOutTime
  );

  // If explicit check-in requested and already inside -> duplicate check-in rejection
  if (explicitAction === 'check_in' && activeLog) {
    return res.status(400).json({
      success: false,
      code: 'ALREADY_CHECKED_IN',
      error: 'Duplicate Check-in Blocked: Member is already checked in. Must check out before checking in again.',
      activeLog,
      member,
    });
  }

  // If explicit check-out requested and not inside -> rejection
  if (explicitAction === 'check_out' && !activeLog) {
    return res.status(400).json({
      success: false,
      code: 'NO_ACTIVE_CHECKIN',
      error: 'Check-out Blocked: Athlete does not have an active check-in session.',
      member,
    });
  }

  // 4. Perform check-out if currently inside (or if explicit check-out)
  if (activeLog && (!explicitAction || explicitAction === 'check_out')) {
    const checkOutResult = await executeAttendanceCheckOut({
      gymId,
      attendanceId: activeLog.id,
      staffId,
      staffName,
      notes,
    });
    if (checkOutResult.success) {
      processAttendanceNotification(gymId, {
        memberId: member.id,
        type: 'check_out',
        durationMinutes: (checkOutResult as any)?.log?.duration_minutes || (checkOutResult as any)?.data?.duration_minutes,
      }).catch((e) => console.warn('Attendance notification error:', e));
    }
    return res.json(checkOutResult);
  }

  // 5. Otherwise perform check-in
  const checkInResult = await executeAttendanceCheckIn({
    gymId,
    memberId: member.id,
    method: 'qr_scanner',
    staffId,
    staffName,
    notes,
  });

  if (!checkInResult.success) {
    const statusCode =
      checkInResult.code === 'CROSS_GYM_DENIED' ||
      checkInResult.code === 'MEMBERSHIP_EXPIRED' ||
      checkInResult.code === 'MEMBERSHIP_SUSPENDED'
        ? 403
        : 400;
    return res.status(statusCode).json(checkInResult);
  }

  processAttendanceNotification(gymId, {
    memberId: member.id,
    type: 'check_in',
  }).catch((e) => console.warn('Attendance notification error:', e));

  return res.status(200).json(checkInResult);
});

/**
 * POST /api/attendance/check-in - Explicit Check-in Endpoint
 */
router.post('/check-in', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym context is required.' });
  }

  const { memberId, qrToken, memberCode, method = 'qr_scanner', notes } = req.body;
  const staffName = req.user?.fullName || req.user?.email || 'Staff Desk';
  const staffId = req.user?.id;

  const result = await executeAttendanceCheckIn({
    gymId,
    memberId,
    qrToken,
    memberCode,
    method,
    staffId,
    staffName,
    notes,
  });

  if (!result.success) {
    const statusCode =
      result.code === 'CROSS_GYM_DENIED' || result.code === 'MEMBERSHIP_EXPIRED' || result.code === 'MEMBERSHIP_SUSPENDED'
        ? 403
        : 400;
    return res.status(statusCode).json(result);
  }

  return res.status(200).json(result);
});

/**
 * POST /api/attendance/check-out - Explicit Check-out Endpoint
 */
router.post('/check-out', async (req: AuthRequest, res): Promise<any> => {
  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym context is required.' });
  }

  const { memberId, qrToken, memberCode, attendanceId, notes } = req.body;
  const staffName = req.user?.fullName || req.user?.email || 'Staff Desk';
  const staffId = req.user?.id;

  const result = await executeAttendanceCheckOut({
    gymId,
    memberId,
    qrToken,
    memberCode,
    attendanceId,
    staffId,
    staffName,
    notes,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

/**
 * POST /api/attendance/manual - Manual Attendance Record by Staff
 * Enforces staff role authorization (trainers, gym owners, super admins).
 */
router.post('/manual', async (req: AuthRequest, res): Promise<any> => {
  if (req.user?.role === 'member') {
    return res.status(403).json({ error: 'Permission Denied: Members cannot self-record manual attendance.' });
  }

  const gymId = req.gymId;
  if (!gymId) {
    return res.status(400).json({ error: 'Gym context is required.' });
  }

  const { memberId, action, notes } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required for manual attendance.' });
  }
  if (!['check_in', 'check_out'].includes(action)) {
    return res.status(400).json({ error: "action must be either 'check_in' or 'check_out'." });
  }

  const staffName = `${req.user?.fullName || 'Staff Member'} (${(req.user?.role || 'staff').replace('_', ' ').toUpperCase()})`;
  const staffId = req.user?.id;

  if (action === 'check_in') {
    const result = await executeAttendanceCheckIn({
      gymId,
      memberId,
      method: 'manual',
      staffId,
      staffName,
      notes,
    });

    if (!result.success) {
      const statusCode =
        result.code === 'CROSS_GYM_DENIED' || result.code === 'MEMBERSHIP_EXPIRED' || result.code === 'MEMBERSHIP_SUSPENDED'
          ? 403
          : 400;
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } else {
    const result = await executeAttendanceCheckOut({
      gymId,
      memberId,
      staffId,
      staffName,
      notes,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  }
});

/**
 * GET /api/attendance/member/:id - Member-specific Attendance Profile & Analytics
 */
router.get('/member/:id', async (req: AuthRequest, res): Promise<any> => {
  const gymId: string = (req.gymId as string) || '11111111-1111-1111-1111-111111111111';
  const memberId: string = String(req.params.id);

  const analytics = getMemberAttendanceAnalytics(gymId, memberId);

  return res.json({
    success: true,
    data: analytics,
    analytics,
  });
});

export default router;
