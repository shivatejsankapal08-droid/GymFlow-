const { spawn } = require('child_process');

const suites = [
  'test_auth_suite.js',
  'test_database_schema_suite.js',
  'test_multi_gym_saas_suite.js',
  'test_member_management_suite.js',
  'test_attendance_suite.js',
  'test_payment_suite.js',
  'test_trainer_suite.js',
  'test_workout_diet_suite.js',
  'test_whatsapp_automation_suite.js',
  'test_ai_assistant_suite.js',
  'test_advanced_reports_suite.js',
  'test_super_admin_suite.js',
  'test_production_verification_suite.js'
];

async function runAll() {
  console.log('====================================================');
  console.log('🏁 RUNNING ALL 13 COMPREHENSIVE PLATFORM TEST SUITES');
  console.log('====================================================');

  let passedSuites = 0;

  for (const suite of suites) {
    await new Promise((resolve) => {
      const p = spawn('node', [suite], { stdio: 'inherit', shell: true });
      p.on('exit', (code) => {
        if (code === 0) passedSuites++;
        resolve();
      });
    });
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedSuites} / ${suites.length} SUITES PASSED`);
  console.log('====================================================\n');
}

runAll();
