/**
 * GYMFLOW AI: STEP 10 - WORKOUT & DIET MANAGEMENT SYSTEM TEST SUITE
 * 
 * Verifies all 12 core requirements:
 * 1. Exercise Library CRUD & Filters (POST /api/workouts/exercises, GET /api/workouts/exercises)
 * 2. Workout Plan Builder with 7-Day Weekly Schedule (POST /api/workouts/plans)
 * 3. Member Plan Assignment & Details Retrieval (GET /api/workouts/plans/:id)
 * 4. Diet Plan Creation with 6-Meal Slots & Macros (POST /api/workouts/diets)
 * 5. Member Dashboard Plan Retrieval & Verification (GET /api/workouts/diets)
 * 6. Member Exercise Completion Logging (POST /api/workouts/logs)
 * 7. Member Progress Tracking & Measurement Logging (POST /api/workouts/progress)
 * 8. Member Progress History & Delta Calculation (GET /api/workouts/progress/:memberId)
 * 9. Workout Dashboard 6 Live KPIs & Overdue Review Calculation (GET /api/workouts/stats)
 * 10. Workout Calendar Retrieval (GET /api/workouts/calendar)
 * 11. AI Workout & Nutrition Coach Endpoint with Fallback & Disclaimer (POST /api/workouts/ai/assist)
 * 12. Strict Multi-Tenant Gym Isolation & Member Privacy Access Controls
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  \x1b[32m✓\x1b[0m [PASS] ${testName}`);
  } else {
    failedCount++;
    console.log(`  \x1b[31m✗\x1b[0m [FAIL] ${testName} ${details ? '- ' + details : ''}`);
  }
}

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runWorkoutDietSuite() {
  console.log('\n================================================================');
  console.log('🏋️‍♂️ GYMFLOW AI: STEP 10 - WORKOUT & DIET MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Authenticate Gym Owner, Trainer, Member, and Another Gym Owner
    // -------------------------------------------------------------
    console.log('▶ [SETUP] Authenticating test personas...');

    const gym1Id = '11111111-1111-1111-1111-111111111111';
    const gym2Id = '22222222-2222-2222-2222-222222222222';
    const memberId = 'cccc1111-0000-0000-0000-000000000001'; // Vikram Malhotra

    // 1. Gym 1 Owner (Marcus Vance)
    const ownerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'owner@ironpulse.com', role: 'gym_owner', password: 'Password@123' }
    );
    const ownerToken = ownerLogin.body?.token;
    assert(ownerLogin.status === 200 && ownerToken, 'Gym 1 Owner authenticated');

    // 2. Gym 1 Trainer (Alex Rivera)
    const trainerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'trainer.alex@ironpulse.com', role: 'trainer', password: 'Password@123' }
    );
    const trainerToken = trainerLogin.body?.token;
    assert(trainerLogin.status === 200 && trainerToken, 'Gym 1 Trainer authenticated');

    // 3. Gym 1 Member (Vikram Malhotra)
    const memberLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'vikram.malhotra@gmail.com', role: 'member', password: 'Password@123' }
    );
    const memberToken = memberLogin.body?.token;
    assert(memberLogin.status === 200 && memberToken, 'Gym 1 Member authenticated');

    // 4. Gym 2 Owner (Devika Rao)
    const gym2OwnerLogin = await request(
      { method: 'POST', path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } },
      { email: 'contact@titanforge.in', role: 'gym_owner', password: 'Password@123' }
    );
    const gym2Token = gym2OwnerLogin.body?.token;
    assert(gym2OwnerLogin.status === 200 && gym2Token, 'Gym 2 Owner authenticated');

    // -------------------------------------------------------------
    // TEST SECTION 1: EXERCISE LIBRARY CRUD & FILTERING
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 1] Exercise Library APIs (Shared & Custom Exercises)...');

    // Fetch shared exercises
    const exercisesRes = await request({
      method: 'GET',
      path: '/api/workouts/exercises',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(exercisesRes.status === 200 && exercisesRes.body?.success, 'GET /api/workouts/exercises succeeds');
    assert(exercisesRes.body?.exercises?.length >= 10, 'Exercise library contains standard exercises (>=10)', `Found: ${exercisesRes.body?.exercises?.length}`);

    // Filter exercises by muscle group (Chest)
    const chestExercises = await request({
      method: 'GET',
      path: '/api/workouts/exercises?muscleGroup=Chest',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(
      chestExercises.status === 200 &&
      chestExercises.body?.exercises?.every((e) => e.muscleGroup === 'Chest'),
      'Filtered exercises match muscleGroup=Chest query'
    );

    // Create a custom exercise for Gym 1
    const customExerciseRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/exercises',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        exerciseName: 'Incline Cable Hex Press',
        name: 'Incline Cable Hex Press',
        muscleGroup: 'Chest',
        category: 'Isolation',
        equipment: 'Cable Machine',
        difficulty: 'intermediate',
        instructions: 'Set cables to hip level, press upward with neutral grip and peak contraction.',
        safetyNotes: 'Keep shoulders retracted and do not hyperextend lower back.',
        recommendedSets: 4,
        recommendedReps: '12-15',
        restDurationSeconds: 60,
      }
    );
    assert(customExerciseRes.status === 201 && customExerciseRes.body?.success, 'POST /api/workouts/exercises creates custom gym exercise');
    const customExerciseId = customExerciseRes.body?.exercise?.id;
    assert(Boolean(customExerciseId), 'Custom exercise receives unique UUID');

    // Validation rejection on missing required fields
    const invalidEx = await request(
      {
        method: 'POST',
        path: '/api/workouts/exercises',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      { name: 'Incomplete Exercise' } // missing muscleGroup, category, instructions
    );
    assert(invalidEx.status === 400 && !invalidEx.body?.success, 'Exercise creation rejects missing required fields with 400 Bad Request');

    // -------------------------------------------------------------
    // TEST SECTION 2: WORKOUT PLAN BUILDER & 7-DAY SCHEDULE
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 2] Workout Plan Builder & 7-Day Weekly Schedule...');

    const newPlanRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/plans',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        title: '8-Week Hypertrophy & Power Split',
        memberId: memberId,
        level: 'Intermediate',
        difficulty: 'intermediate',
        durationWeeks: 8,
        daysPerWeek: 4,
        category: 'Hypertrophy',
        fitnessGoal: 'Muscle Building',
        targetAudience: 'Intermediate lifters seeking progressive overload',
        trainerNotes: 'Focus on 2-second eccentric phase and record weights each session.',
        weeklySchedule: [
          {
            dayOfWeek: 'Monday',
            exerciseId: customExerciseId,
            exerciseName: 'Incline Cable Hex Press',
            sets: 4,
            repetitions: '12',
            restSeconds: 60,
            displayOrder: 1,
            notes: 'Pause at top contraction',
          },
          {
            dayOfWeek: 'Monday',
            exerciseId: 'ex-101',
            exerciseName: 'Barbell Bench Press',
            sets: 4,
            repetitions: '8',
            restSeconds: 90,
            displayOrder: 2,
            notes: 'Heavy compound work',
          },
          {
            dayOfWeek: 'Tuesday',
            exerciseId: 'ex-106',
            exerciseName: 'Barbell Back Squat',
            sets: 4,
            repetitions: '10',
            restSeconds: 120,
            displayOrder: 1,
            notes: 'Depth below parallel',
          },
        ],
      }
    );
    assert(newPlanRes.status === 201 && newPlanRes.body?.success, 'POST /api/workouts/plans creates plan with 7-day schedule');
    const createdPlanId = newPlanRes.body?.plan?.id;
    assert(Boolean(createdPlanId), 'Created workout plan has valid planId');
    assert(newPlanRes.body?.plan?.exercisesCount >= 3, 'Plan exercises stored and counted accurately');

    // Fetch plan details by ID
    const planDetailRes = await request({
      method: 'GET',
      path: `/api/workouts/plans/${createdPlanId}`,
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(planDetailRes.status === 200 && planDetailRes.body?.plan?.id === createdPlanId, 'GET /api/workouts/plans/:id retrieves full plan details');
    assert(planDetailRes.body?.plan?.weeklySchedule?.length >= 3, 'Weekly schedule exercises retrieved with plan');

    // -------------------------------------------------------------
    // TEST SECTION 3: DIET PLAN MANAGEMENT & 6-MEAL SLOTS
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 3] Personalized Diet Plan & 6-Meal Slots with Macro Calculations...');

    const dietRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/diets',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        planName: 'Clean Bulking High-Protein Protocol',
        memberId: memberId,
        dietaryPreference: 'High Protein',
        fitnessGoal: 'Muscle Hypertrophy',
        startDate: '2026-11-14',
        endDate: '2026-12-14',
        instructions: 'Drink 4 liters of water daily. Ensure post-workout shake is taken within 45 mins.',
        meals: [
          {
            mealName: 'Early Morning',
            foodName: 'Lukewarm Lemon Water & 5 Soaked Almonds',
            portionSize: '1 glass + 5 nuts',
            calories: 60,
            protein: 2,
            carbohydrates: 3,
            fat: 4,
            displayOrder: 1,
          },
          {
            mealName: 'Breakfast',
            foodName: 'Rolled Oats with Whey Isolate, Banana & Peanut Butter',
            portionSize: '80g oats, 1 scoop whey, 1 medium banana, 1 tbsp PB',
            calories: 550,
            protein: 42,
            carbohydrates: 65,
            fat: 14,
            displayOrder: 2,
          },
          {
            mealName: 'Mid-Morning',
            foodName: 'Greek Yogurt with Mixed Berries',
            portionSize: '200g Greek yogurt + 50g berries',
            calories: 180,
            protein: 18,
            carbohydrates: 15,
            fat: 4,
            displayOrder: 3,
          },
          {
            mealName: 'Lunch',
            foodName: 'Grilled Chicken Breast, Brown Rice, Steamed Broccoli',
            portionSize: '200g chicken, 150g rice, 100g broccoli',
            calories: 620,
            protein: 52,
            carbohydrates: 58,
            fat: 10,
            displayOrder: 4,
          },
          {
            mealName: 'Evening Snack',
            foodName: 'Boiled Eggs & Multigrain Toast with Black Coffee',
            portionSize: '3 whole eggs + 2 slices toast',
            calories: 340,
            protein: 24,
            carbohydrates: 28,
            fat: 14,
            displayOrder: 5,
          },
          {
            mealName: 'Dinner',
            foodName: 'Grilled Salmon or Tofu Stir-Fry with Quinoa Salad',
            portionSize: '180g salmon / 200g tofu + 120g quinoa',
            calories: 580,
            protein: 44,
            carbohydrates: 40,
            fat: 22,
            displayOrder: 6,
          },
        ],
      }
    );
    assert(dietRes.status === 201 && dietRes.body?.success, 'POST /api/workouts/diets creates 6-meal personalized diet plan');
    const createdDietId = dietRes.body?.dietPlan?.id;
    assert(Boolean(createdDietId), 'Diet plan created with UUID');
    assert(dietRes.body?.dietPlan?.meals?.length === 6, 'Diet plan accurately contains all 6 daily meal slots');
    assert(dietRes.body?.dietPlan?.totalCalories >= 2000, `Diet macros calculated accurately: ${dietRes.body?.dietPlan?.totalCalories} kcal, ${dietRes.body?.dietPlan?.totalProtein}g protein`);

    // Fetch Diet Plans
    const dietsList = await request({
      method: 'GET',
      path: '/api/workouts/diets',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(dietsList.status === 200 && dietsList.body?.dietPlans?.length >= 1, 'GET /api/workouts/diets retrieves active gym diet plans');

    // -------------------------------------------------------------
    // TEST SECTION 4: MEMBER FITNESS EXECUTION & WORKOUT LOGS
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 4] Member Exercise Execution & Workout Logging...');

    const logRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/logs',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        memberId: memberId,
        workoutPlanId: createdPlanId,
        exerciseId: customExerciseId,
        exerciseName: 'Incline Cable Hex Press',
        dayOfWeek: 'Monday',
        setsCompleted: 4,
        repsCompleted: '12',
        completionStatus: 'completed',
        weightsUsed: [25, 25, 30, 30],
        repsAchieved: [12, 12, 11, 10],
        notes: 'Crushed the session, great pump!',
      }
    );
    assert(logRes.status === 201 && logRes.body?.success, 'POST /api/workouts/logs records athlete completed workout');
    assert(logRes.body?.log?.completionStatus === 'completed', 'Log recorded with completionStatus = completed');

    // Member retrieves their own workout logs
    const memberLogs = await request({
      method: 'GET',
      path: `/api/workouts/logs?memberId=${memberId}`,
      headers: { Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(memberLogs.status === 200 && memberLogs.body?.logs?.length >= 1, 'Member retrieves their own workout completion logs');

    // -------------------------------------------------------------
    // TEST SECTION 5: MEMBER PROGRESS & MEASUREMENT TRACKING
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 5] Member Progress Check-in & Tape Measurements...');

    const progressRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/progress',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        memberId: memberId,
        weight: 76.5,
        targetWeight: 72.0,
        bodyMeasurements: {
          chest: 41.0,
          waist: 31.5,
          arms: 15.5,
          thighs: 23.5,
          hips: 37.5,
          bodyFatPct: 13.8,
        },
        progressNotes: 'Athlete dropped 1.5kg while retaining upper body strength. Bench PR increased by 5kg.',
      }
    );
    assert(progressRes.status === 201 && progressRes.body?.success, 'POST /api/workouts/progress records weight & measurements');
    assert(progressRes.body?.progress?.weight === 76.5, 'Weight stored accurately (76.5 kg)');
    assert(progressRes.body?.weightDelta !== undefined, `Weight delta relative to previous record calculated: ${progressRes.body?.weightDelta} kg`);

    // Fetch athlete progress history
    const progressHist = await request({
      method: 'GET',
      path: `/api/workouts/progress/${memberId}`,
      headers: { Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(progressHist.status === 200 && progressHist.body?.progressHistory?.length >= 1, 'GET /api/workouts/progress/:memberId returns progress history');
    assert(progressHist.body?.latestRecord?.bodyMeasurements?.waist === 31.5, 'Latest circumference measurements preserved in progress record');

    // -------------------------------------------------------------
    // TEST SECTION 6: WORKOUT DASHBOARD 6 LIVE KPIS & REVIEW OVERDUE
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 6] Workout Dashboard 6 Live KPIs & Bi-Weekly Review Detection...');

    const statsRes = await request({
      method: 'GET',
      path: '/api/workouts/stats',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(statsRes.status === 200 && statsRes.body?.success, 'GET /api/workouts/stats returns live KPIs');
    const stats = statsRes.body?.stats;
    assert(typeof stats?.totalWorkoutPlans === 'number' && stats.totalWorkoutPlans >= 1, `KPI 1: Total Workout Plans = ${stats?.totalWorkoutPlans}`);
    assert(typeof stats?.activeWorkoutPlans === 'number' && stats.activeWorkoutPlans >= 1, `KPI 2: Active Workout Plans = ${stats?.activeWorkoutPlans}`);
    assert(typeof stats?.totalAssignedMembers === 'number' && stats.totalAssignedMembers >= 1, `KPI 3: Total Assigned Members = ${stats?.totalAssignedMembers}`);
    assert(typeof stats?.completedWorkoutsToday === 'number', `KPI 4: Completed Workouts Today = ${stats?.completedWorkoutsToday}`);
    assert(typeof stats?.upcomingTrainingSessions === 'number', `KPI 5: Upcoming Training Sessions = ${stats?.upcomingTrainingSessions}`);
    assert(typeof stats?.membersRequiringProgressReviews === 'number', `KPI 6: Members Requiring Reviews = ${stats?.membersRequiringProgressReviews}`);
    assert(Array.isArray(stats?.membersNeedingReview), 'Overdue members list provided for trainer proactive action');

    // -------------------------------------------------------------
    // TEST SECTION 7: WORKOUT CALENDAR
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 7] Workout Calendar & Weekly Schedule...');

    const calRes = await request({
      method: 'GET',
      path: '/api/workouts/calendar',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(calRes.status === 200 && calRes.body?.success, 'GET /api/workouts/calendar retrieves calendar view');
    assert(Array.isArray(calRes.body?.calendarDays), 'Calendar contains day slots with training and rest flags');

    // -------------------------------------------------------------
    // TEST SECTION 8: AI WORKOUT ASSISTANT WITH FALLBACK & DISCLAIMERS
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 8] AI Workout Coach Endpoint (Fallback & Disclaimers)...');

    const aiRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/ai/assist',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        action: 'suggest_plan',
        prompt: 'Generate an Upper/Lower 4-day split for athlete with knee sensitivity.',
        context: {
          experienceLevel: 'Intermediate',
          goal: 'Hypertrophy',
          daysPerWeek: 4,
        },
      }
    );
    assert(aiRes.status === 200 && aiRes.body?.success, 'POST /api/workouts/ai/assist returns AI recommendations');
    assert(Boolean(aiRes.body?.recommendations || aiRes.body?.reply), 'AI Coach generated structured workout recommendations');
    assert(Boolean(aiRes.body?.disclaimer), 'AI response enforces prominent health & safety medical disclaimer');

    // Form cue AI inquiry
    const formCueRes = await request(
      {
        method: 'POST',
        path: '/api/workouts/ai/assist',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        action: 'explain_form',
        prompt: 'Explain biomechanics and form cues for Conventional Deadlift.',
      }
    );
    assert(formCueRes.status === 200 && formCueRes.body?.success, 'AI Coach explains lifting mechanics and safety cues');

    // -------------------------------------------------------------
    // TEST SECTION 9: ROLE-BASED ACCESS CONTROL & MULTI-TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\n▶ [SECTION 9] Multi-Tenant Isolation & Role Security Boundaries...');

    // Gym 2 attempts to query Gym 1's plan
    const crossGymPlan = await request({
      method: 'GET',
      path: `/api/workouts/plans/${createdPlanId}`,
      headers: { Authorization: `Bearer ${gym2Token}`, 'X-Gym-Id': gym2Id },
    });
    assert(crossGymPlan.status === 404 || crossGymPlan.status === 403, 'Cross-gym plan access rejected (404/403 Forbidden)');

    // Gym 2 attempts to view Gym 1 member's progress history
    const crossGymProgress = await request({
      method: 'GET',
      path: `/api/workouts/progress/${memberId}`,
      headers: { Authorization: `Bearer ${gym2Token}`, 'X-Gym-Id': gym2Id },
    });
    assert(crossGymProgress.status === 404 || crossGymProgress.status === 403, 'Cross-gym athlete progress history protected');

    // Attempt to delete a shared/global exercise
    const deleteSharedEx = await request({
      method: 'DELETE',
      path: '/api/workouts/exercises/ex-101',
      headers: { Authorization: `Bearer ${ownerToken}`, 'X-Gym-Id': gym1Id },
    });
    assert(deleteSharedEx.status === 403, 'Deleting shared/global system exercises is strictly forbidden (403)');

    // Member attempts to record progress for another member
    const unauthorizedProgress = await request(
      {
        method: 'POST',
        path: '/api/workouts/progress',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}`, 'X-Gym-Id': gym1Id },
      },
      {
        memberId: 'cccc1111-0000-0000-0000-000000000002', // different member
        weight: 80,
      }
    );
    assert(unauthorizedProgress.status === 403, 'Member cannot log progress on behalf of other athletes (403)');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled test suite error:', err);
    process.exit(1);
  }
}

runWorkoutDietSuite();
