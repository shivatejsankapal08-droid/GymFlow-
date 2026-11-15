import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { tenantIsolationMiddleware } from '../middleware/tenancy.js';
import {
  generateAIChat,
  generateAIWorkoutPlan,
  generateAIDietPlan,
  generateAIBusinessInsights,
  isOpenAIConfigured,
} from '../services/aiService.js';
import {
  getAIConversations,
  getAIConversationById,
  createAIConversation,
  deleteAIConversation,
  addAIMessage,
  getAIGeneratedPlans,
  approveAIGeneratedPlan,
  rejectAIGeneratedPlan,
  getAIUsageStats,
  checkAIQuota,
} from '../services/supabaseService.js';

const router = Router();

// Apply Auth and Multi-Tenant Isolation
router.use((req: AuthRequest, res, next) => {
  if (!req.headers.authorization && !req.headers['x-demo-role']) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
  }
  if (req.headers.authorization && !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Invalid authorization format' });
  }
  next();
});
router.use(authMiddleware);
router.use(tenantIsolationMiddleware);

// ==============================================================================
// 1. AI CHAT INTERFACE & CONVERSATION MESSAGING
// ==============================================================================

/**
 * POST /api/ai/chat
 * Multi-role chat endpoint (Member, Trainer, Gym Owner)
 */
router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const prompt = (req.body.prompt || req.body.message || '').trim();
    const { conversationId } = req.body;
    const role = (req.user?.role as any) || 'member';
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000004';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required and must be non-empty string' });
    }

    // 1. Check AI quota before processing
    const quota = checkAIQuota(gymId);
    if (!quota.allowed) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message: `Daily AI request limit reached for your subscription tier (${quota.used}/${quota.limit}). Upgrade your plan to unlock more requests.`,
        quota,
      });
    }

    // 2. Resolve or create conversation
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const titleSnippet = prompt.length > 35 ? prompt.substring(0, 32) + '...' : prompt;
      const conv = createAIConversation(gymId, userId, titleSnippet);
      activeConversationId = conv.id;
    }

    // 3. Store user message in conversation
    addAIMessage(activeConversationId, 'user', prompt.trim());

    // 4. Generate role-tailored AI response
    const aiResult = await generateAIChat({
      gymId,
      userId,
      role,
      prompt: prompt.trim(),
      conversationId: activeConversationId,
    });

    if ((aiResult as any).error === 'QUOTA_EXCEEDED') {
      return res.status(429).json(aiResult);
    }

    // 5. Store assistant message in conversation
    const assistantMsg = addAIMessage(activeConversationId, 'assistant', (aiResult as any).reply);

    res.json({
      success: true,
      conversationId: activeConversationId,
      message: assistantMsg,
      reply: (aiResult as any).reply,
      source: (aiResult as any).source,
      model: (aiResult as any).model,
      tokenUsage: (aiResult as any).tokenUsage,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/chat:', err);
    res.status(500).json({ error: 'Internal server error while processing AI chat request', details: err.message });
  }
});

/**
 * GET /api/ai/conversations
 * List user's conversations within gym
 */
router.get('/conversations', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000004';
    const role = req.user?.role;

    const conversations = getAIConversations(gymId, userId, role);
    res.json({ success: true, conversations });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversations', details: err.message });
  }
});

/**
 * GET /api/ai/conversations/:id
 * Retrieve a single conversation and its full message history
 */
router.get('/conversations/:id', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000004';
    const role = req.user?.role;
    const conversationId = String(req.params.id);

    const conv = getAIConversationById(gymId, userId, conversationId, role);

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found or does not belong to your gym' });
    }

    if ((conv as any).error === 'UNAUTHORIZED_CONVERSATION_ACCESS') {
      return res.status(403).json({ error: 'Unauthorized: You cannot access conversations belonging to other users' });
    }

    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve conversation', details: err.message });
  }
});

/**
 * DELETE /api/ai/conversations/:id
 * Clear/delete a conversation and its messages
 */
router.delete('/conversations/:id', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000004';
    const role = req.user?.role;
    const conversationId = String(req.params.id);

    const deleted = deleteAIConversation(gymId, userId, conversationId, role);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation', details: err.message });
  }
});

// ==============================================================================
// 2. AI WORKOUT PLAN GENERATOR (TRAINER / OWNER ONLY)
// ==============================================================================

/**
 * POST /api/ai/workout-plan
 * Generates structured workout routine draft (requires trainer approval)
 */
router.post('/workout-plan', async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'trainer' && role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only trainers and gym owners can generate workout plans' });
    }

    const {
      memberId,
      fitnessGoal = 'Hypertrophy',
      experienceLevel = 'Intermediate',
      availableDays = 4,
      equipmentAvailability = 'Full Gym',
      durationMinutes = 60,
      trainerNotes,
    } = req.body;

    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || 'bbbb1111-0000-0000-0000-000000000001';

    const result = await generateAIWorkoutPlan({
      gymId,
      userId,
      memberId,
      fitnessGoal,
      experienceLevel,
      availableDays: Number(availableDays),
      equipmentAvailability,
      durationMinutes: Number(durationMinutes),
      trainerNotes,
    });

    if ((result as any).error === 'QUOTA_EXCEEDED') {
      return res.status(429).json(result);
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/workout-plan:', err);
    res.status(500).json({ error: 'Failed to generate workout plan', details: err.message });
  }
});

// ==============================================================================
// 3. AI DIET PLAN ASSISTANT (TRAINER / OWNER / MEMBER)
// ==============================================================================

/**
 * POST /api/ai/diet-plan
 * Generates meal plan drafts with mandatory clinical safety disclaimers
 */
router.post('/diet-plan', async (req: AuthRequest, res) => {
  try {
    const {
      memberId,
      fitnessGoal = 'Muscle Gain',
      dietaryPreference = 'High-Protein Non-Veg',
      foodPreferences,
      mealSchedule = 5,
      allergies,
      targetCalories,
    } = req.body;

    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || 'bbbb1111-0000-0000-0000-000000000001';

    const result = await generateAIDietPlan({
      gymId,
      userId,
      memberId,
      fitnessGoal,
      dietaryPreference,
      foodPreferences,
      mealSchedule: Number(mealSchedule),
      allergies,
      targetCalories: targetCalories ? Number(targetCalories) : undefined,
    });

    if ((result as any).error === 'QUOTA_EXCEEDED') {
      return res.status(429).json(result);
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/diet-plan:', err);
    res.status(500).json({ error: 'Failed to generate diet plan', details: err.message });
  }
});

// ==============================================================================
// 4. AI BUSINESS INSIGHTS (OWNER / SUPER ADMIN ONLY)
// ==============================================================================

/**
 * POST /api/ai/business-insights
 * Aggregates real DB metrics and synthesizes strategic recommendations
 */
router.post('/business-insights', async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only gym owners and super admins can access business insights' });
    }

    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000002';

    const result = await generateAIBusinessInsights(gymId, userId);

    if ((result as any).error === 'QUOTA_EXCEEDED') {
      return res.status(429).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/business-insights:', err);
    res.status(500).json({ error: 'Failed to generate business insights', details: err.message });
  }
});

// ==============================================================================
// 5. GENERATED PLAN REVIEW & APPROVAL WORKFLOW
// ==============================================================================

/**
 * GET /api/ai/plans
 * List generated plans (drafts, approved, etc.)
 */
router.get('/plans', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const { memberId, planType, approvalStatus } = req.query;

    const plans = getAIGeneratedPlans(gymId, {
      memberId: memberId ? String(memberId) : undefined,
      planType: planType ? String(planType) : undefined,
      approvalStatus: approvalStatus ? String(approvalStatus) : undefined,
    });

    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve plans', details: err.message });
  }
});

/**
 * POST /api/ai/plans/:id/approve
 * Trainer or Owner approves a generated plan draft
 */
router.post('/plans/:id/approve', (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'trainer' && role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only trainers and owners can approve AI generated plans' });
    }

    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || 'bbbb1111-0000-0000-0000-000000000001';
    const planId = String(req.params.id);
    const { notes } = req.body;

    const approvedPlan = approveAIGeneratedPlan(gymId, planId, userId, notes);
    if (!approvedPlan) {
      return res.status(404).json({ error: 'Plan not found or does not belong to your gym' });
    }

    res.json({
      success: true,
      message: 'Plan successfully approved and verified for member assignment.',
      plan: approvedPlan,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve plan', details: err.message });
  }
});

/**
 * POST /api/ai/plans/:id/reject
 * Trainer or Owner rejects a generated plan draft
 */
router.post('/plans/:id/reject', (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'trainer' && role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only trainers and owners can reject AI generated plans' });
    }

    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const userId = req.user?.id || 'bbbb1111-0000-0000-0000-000000000001';
    const planId = String(req.params.id);
    const { notes } = req.body;

    const rejectedPlan = rejectAIGeneratedPlan(gymId, planId, userId, notes);
    if (!rejectedPlan) {
      return res.status(404).json({ error: 'Plan not found or does not belong to your gym' });
    }

    res.json({
      success: true,
      message: 'Plan marked as rejected.',
      plan: rejectedPlan,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject plan', details: err.message });
  }
});

// ==============================================================================
// 6. AI USAGE DASHBOARD & SUBSCRIPTION QUOTA
// ==============================================================================

/**
 * GET /api/ai/usage
 * Telemetry counters and daily quota status
 */
router.get('/usage', (req: AuthRequest, res) => {
  try {
    const gymId = req.gymId || '11111111-1111-1111-1111-111111111111';
    const role = req.user?.role;

    // Only owners and admins can see gym-wide AI usage
    if (role !== 'gym_owner' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only gym owners and admins can view AI usage telemetry' });
    }

    const stats = getAIUsageStats(gymId);
    res.json({
      success: true,
      isOpenAIConfigured,
      engineMode: isOpenAIConfigured ? 'openai_live' : 'sandbox_engine',
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve AI usage statistics', details: err.message });
  }
});

export default router;
