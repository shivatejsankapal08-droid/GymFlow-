const { spawn } = require('child_process');
const path = require('path');

process.on('uncaughtException', (err) => {
  console.error('[Launcher Uncaught Exception]:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[Launcher Unhandled Rejection]:', err);
});

console.log('=======================================================');
console.log('🚀 GYMFLOW AI: FULL STACK APPLICATION LAUNCHER');
console.log('🏋️‍♂️ Backend:  http://localhost:5000 (Express & Supabase API)');
console.log('⚡ Frontend: http://localhost:5173 (React + TypeScript + Vite)');
console.log('=======================================================');

// 1. Launch Backend Server on port 5000
const server = spawn('node', ['server/dist/index.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: { ...process.env, PORT: '5000', NODE_ENV: 'development' },
});

server.on('error', (err) => {
  console.error('[Backend Server Error]:', err);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Backend Server Exited] code ${code}`);
  }
});

// 2. Launch Frontend Vite Dev Server on port 5173
const client = spawn('npm', ['run', 'dev', '--prefix', 'client'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

client.on('error', (err) => {
  console.error('[Frontend Client Error]:', err);
});

client.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Frontend Client Exited] code ${code}`);
  }
});

function cleanup() {
  console.log('\nShutting down GymFlow AI servers...');
  try {
    server.kill();
  } catch (e) {}
  try {
    client.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Prevent standard input closure from exiting
if (process.stdin && process.stdin.isTTY) {
  process.stdin.resume();
}

// Keep event loop active indefinitely
setInterval(() => {}, 60000);
