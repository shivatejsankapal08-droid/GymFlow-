// ==============================================================================
// GYMFLOW AI - Automated Database Schema & Multi-Tenancy Test Suite
// Validates 13-Table DDL, ENUMs, Indexes, Triggers, RLS, and Seed References
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'database', 'schema.sql');
const seedPath = path.join(__dirname, 'database', 'seed.sql');

const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
const seedSql = fs.readFileSync(seedPath, 'utf-8');

const requiredTables = [
  'profiles',
  'gyms',
  'gym_memberships',
  'gym_invitations',
  'membership_plans',
  'trainers',
  'members',
  'payments',
  'attendance',
  'workout_plans',
  'notifications',
  'subscriptions',
  'audit_logs',
];

const requiredEnums = [
  'user_role',
  'gym_status',
  'membership_status',
  'member_status',
  'payment_status',
  'payment_method',
  'notification_type',
  'billing_cycle',
  'subscription_status',
];

const requiredProcedures = [
  'register_gym_with_owner',
  'record_member_payment_transaction',
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🧪 GYMFLOW AI: 13-TABLE DATABASE SCHEMA TEST SUITE');
console.log('======================================================\n');

// 1. Verify All 13 Tables in schema.sql
console.log('--- 1. TABLE DEFINITIONS (DDL) ---');
requiredTables.forEach((table) => {
  const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, 'i');
  assert(tableRegex.test(schemaSql), `Table 'public.${table}' is declared in schema.sql`);
});

// 2. Verify All 9 Custom ENUMs
console.log('\n--- 2. POSTGRESQL ENUMS ---');
requiredEnums.forEach((enumName) => {
  const enumRegex = new RegExp(`CREATE TYPE ${enumName} AS ENUM`, 'i');
  assert(enumRegex.test(schemaSql), `Enum '${enumName}' is defined in schema.sql`);
});

// 3. Verify Triggers for updated_at
console.log('\n--- 3. UPDATED_AT TRIGGERS ---');
const tablesWithUpdatedAt = [
  'profiles',
  'gyms',
  'gym_memberships',
  'membership_plans',
  'trainers',
  'members',
  'payments',
  'workout_plans',
  'subscriptions',
];

tablesWithUpdatedAt.forEach((table) => {
  const triggerRegex = new RegExp(`CREATE TRIGGER trigger_${table}_updated_at`, 'i');
  assert(triggerRegex.test(schemaSql), `Trigger 'trigger_${table}_updated_at' attached to '${table}'`);
});

// 4. Verify Performance & Isolation Indexes
console.log('\n--- 4. HIGH-FREQUENCY SEARCH & ISOLATION INDEXES ---');
const keyIndexes = [
  'idx_profiles_role',
  'idx_profiles_gym_id',
  'idx_gyms_owner_id',
  'idx_gyms_status',
  'idx_gym_memberships_gym_id',
  'idx_gym_invitations_gym_id',
  'idx_membership_plans_gym_id',
  'idx_trainers_gym_id',
  'idx_members_gym_id',
  'idx_members_status',
  'idx_members_expiry_date',
  'idx_payments_gym_id',
  'idx_payments_status',
  'idx_attendance_gym_id',
  'idx_attendance_date',
  'idx_workout_plans_gym_id',
  'idx_notifications_gym_id',
  'idx_subscriptions_gym_id',
  'idx_audit_logs_gym_id',
];

keyIndexes.forEach((idx) => {
  const indexRegex = new RegExp(`CREATE INDEX IF NOT EXISTS ${idx}\\b`, 'i');
  assert(indexRegex.test(schemaSql), `Index '${idx}' is defined`);
});

// 5. Verify Multi-Step Transactions & Stored Procedures
console.log('\n--- 5. STORED PROCEDURES & MULTI-STEP TRANSACTIONS ---');
requiredProcedures.forEach((proc) => {
  const procRegex = new RegExp(`CREATE OR REPLACE FUNCTION public\\.${proc}\\b`, 'i');
  assert(procRegex.test(schemaSql), `Stored procedure 'public.${proc}' is defined`);
});

// 6. Verify Row Level Security (RLS) on all 13 Tables
console.log('\n--- 6. ROW LEVEL SECURITY (RLS) POLICIES ---');
requiredTables.forEach((table) => {
  const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i');
  assert(rlsRegex.test(schemaSql), `Row Level Security enabled on 'public.${table}'`);
});

assert(
  /CREATE OR REPLACE FUNCTION public\.current_user_gym_id\(\)/.test(schemaSql),
  'Helper function current_user_gym_id() defined for tenant isolation'
);
assert(
  /CREATE OR REPLACE FUNCTION public\.current_user_role\(\)/.test(schemaSql),
  'Helper function current_user_role() defined for RBAC'
);

// 7. Verify Multi-Tenant Seed Data
console.log('\n--- 7. MULTI-TENANT SEED DATA COVERAGE ---');
requiredTables.forEach((table) => {
  const seedRegex = new RegExp(`INSERT INTO public\\.${table}\\b`, 'i');
  assert(seedRegex.test(seedSql), `Seed script inserts demo rows into 'public.${table}'`);
});

// Check multi-tenant gyms exist in seed
assert(seedSql.includes('IronPulse Fitness Club'), 'IronPulse Fitness Club seeded as tenant 1');
assert(seedSql.includes('Titan Forge CrossFit'), 'Titan Forge CrossFit seeded as tenant 2');
assert(seedSql.includes('Zenith Athletic Club'), 'Zenith Athletic Club seeded as tenant 3');

// Check Super Admin and Gym Owner profiles seeded
assert(seedSql.includes('admin@gymflow.ai'), 'Super Admin user profile seeded');
assert(seedSql.includes('owner@ironpulse.com'), 'Gym Owner user profile seeded');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL DATABASE ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!\n');
}
