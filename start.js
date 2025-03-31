const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');

// Start the backend server
function startBackend() {
    console.log('\x1b[36m%s\x1b[0m', 'Starting backend server...');
    const backend = spawn('node', ['server/index.js'], {
        stdio: 'inherit'
    });

    backend.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', 'Failed to start backend server:', err);
    });

    return backend;
}

// Start the frontend server
function startFrontend() {
    console.log('\x1b[36m%s\x1b[0m', 'Starting frontend server...');
    const server = http.createServer((request, response) => {
        return handler(request, response, {
            public: 'client',
            rewrites: [
                { source: '/tournaments', destination: '/tournaments.html' },
                { source: '/teams', destination: '/teams.html' },
                { source: '/matches', destination: '/matches.html' }
            ]
        });
    });

    server.listen(3000, () => {
        console.log('\x1b[32m%s\x1b[0m', 'Frontend server running at http://localhost:3000');
    });

    return server;
}

// Handle process termination
function handleShutdown(backend, frontend) {
    process.on('SIGTERM', () => {
        console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down servers...');
        backend.kill();
        frontend.close(() => {
            console.log('\x1b[32m%s\x1b[0m', 'Servers shut down successfully');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down servers...');
        backend.kill();
        frontend.close(() => {
            console.log('\x1b[32m%s\x1b[0m', 'Servers shut down successfully');
            process.exit(0);
        });
    });
}

// Main function to start the application
function startApp() {
    console.log('\x1b[35m%s\x1b[0m', '=== Cricket Tournament Manager ===\n');
    
    const backend = startBackend();
    const frontend = startFrontend();
    
    handleShutdown(backend, frontend);
}

// Start the application
startApp();