process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
import('./server/dist/index.js').then(() => {
  console.log('Server imported successfully');
}).catch((err) => {
  console.error('SERVER IMPORT ERROR:', err);
});

// Keep process alive indefinitely
setInterval(() => {}, 60000);
