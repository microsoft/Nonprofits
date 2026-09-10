const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const os = require('os');
const path = require('path');

const execAsync = util.promisify(exec);

// Update path to point to scripts from project root
const buildManifestPackageScript = path.resolve(__dirname, '../../scripts/Build/BuildManifestPackage.ps1');

/**
 * Builds the manifest package using the PowerShell script
 * @returns {Promise<void>}
 */
async function buildManifestPackage() {
	try {
		// Determine environment from workload name (Org. prefix = DEV, Microsoft. prefix = PPE/PROD)
		const workloadName = process.env.WORKLOAD_NAME || 'Org.NonprofitData';
		const environment = workloadName.startsWith('Org.') ? 'DEV' : 'PROD';

		console.log(`🔧 Building manifest package for environment: ${environment}`);
		console.log(`🔧 Workload name: ${workloadName}`);

		var buildManifestPackageCmd = '';
		const operatingSystem = os.platform();
		if (operatingSystem === 'win32') {
			buildManifestPackageCmd = `powershell.exe -ExecutionPolicy Bypass -File "${buildManifestPackageScript}" -Environment ${environment}`;
		} else {
			buildManifestPackageCmd = `pwsh -File "${buildManifestPackageScript}" -Environment ${environment}`;
		}

		// Run the PowerShell script to build the package manifest
		const { stdout, stderr } = await execAsync(buildManifestPackageCmd);
		if (stderr) {
			console.error(`⚠️ BuildManifestPackage error: ${stderr}`);
		} else {
			console.log(`✅ BuildManifestPackage completed successfully for ${environment}.`);
			console.log(`📦BuildManifestPackage: ${stdout}`);
		}
	} catch (error) {
		console.error(`❌ Error building the Package Manifest: ${error.message}`);
	}
}

// Export the function for use in other modules
module.exports = {
	buildManifestPackage,
};

// Optional: Execute when run directly
if (require.main === module) {
	buildManifestPackage();
}
