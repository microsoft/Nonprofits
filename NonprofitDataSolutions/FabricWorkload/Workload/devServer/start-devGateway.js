/**
 * DevGateway starter script
 * Starts the DevGateway PowerShell script and keeps it running until the server shuts down
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Path to the StartDevGateway.ps1 script
const scriptPath = path.resolve(
	__dirname,
	'../../scripts/Run/StartDevGateway.ps1',
);

// Determine the command to run the PowerShell script based on the OS
const isWindows = os.platform() === 'win32';
const command = isWindows ? 'powershell.exe' : 'pwsh';
const args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath];

console.log(`Starting DevGateway using ${scriptPath}`);

// Spawn the PowerShell process
const devGatewayProcess = spawn(command, args, {
	stdio: 'inherit', // Inherit stdio streams
	shell: true,
});

// Handle process events
devGatewayProcess.on('error', (error) => {
	console.error(`Failed to start DevGateway: ${error.message}`);
});

devGatewayProcess.on('close', (code) => {
	if (code !== 0) {
		console.error(`DevGateway process exited with code ${code}`);
	} else {
		console.log('DevGateway process completed successfully');
	}
});

// Clean up on process exit
process.on('exit', () => {
	console.log('Server shutting down, cleaning up DevGateway process...');
	if (!devGatewayProcess.killed) {
		devGatewayProcess.kill();
	}
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
	console.log('Received SIGINT, shutting down...');
	if (!devGatewayProcess.killed) {
		devGatewayProcess.kill();
	}
	process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
	console.log('Received SIGTERM, shutting down...');
	if (!devGatewayProcess.killed) {
		devGatewayProcess.kill();
	}
	process.exit(0);
});

console.log('DevGateway process started. Press Ctrl+C to stop.');
