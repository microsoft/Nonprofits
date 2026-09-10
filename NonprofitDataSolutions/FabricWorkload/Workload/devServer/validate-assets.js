const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

/**
 * Validates asset files in the app/assets directory
 * This script validates:
 * - Notebook files (.ipynb) for valid JSON structure
 * - Package manifests (package.json) for required fields
 * - JSON files for valid JSON syntax
 */

const ajv = new Ajv({ allErrors: true });

class AssetValidator {
	constructor() {
		this.errors = [];
		this.warnings = [];
		this.validated = 0;
		// Categorized warnings grouped by package.json file
		this.warningsByPackage = new Map();
	}

	/**
	 * Validate a Jupyter Notebook file
	 */
	validateNotebook(filePath) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const notebook = JSON.parse(content);

			// Check required notebook structure
			if (!notebook.cells || !Array.isArray(notebook.cells)) {
				this.errors.push(`${filePath}: Missing or invalid 'cells' array`);
				return false;
			}

			if (!notebook.metadata) {
				this.warnings.push(`${filePath}: Missing 'metadata' object`);
			}

			if (!notebook.nbformat) {
				this.errors.push(`${filePath}: Missing 'nbformat' version`);
				return false;
			}

			// Validate each cell
			notebook.cells.forEach((cell, index) => {
				if (!cell.cell_type) {
					this.errors.push(`${filePath}: Cell ${index} missing 'cell_type'`);
				}
				if (!cell.source) {
					this.errors.push(`${filePath}: Cell ${index} missing 'source'`);
				}
			});

			return true;
		} catch (error) {
			if (error instanceof SyntaxError) {
				this.errors.push(`${filePath}: Invalid JSON - ${error.message}`);
			} else {
				this.errors.push(`${filePath}: ${error.message}`);
			}
			return false;
		}
	}

	/**
	 * Add a warning grouped by package file
	 */
	addWarning(packagePath, category, itemName, message, contentFilePath = null) {
		if (!this.warningsByPackage.has(packagePath)) {
			this.warningsByPackage.set(packagePath, {
				unusedReplacements: [],
				undefinedMetadataVariables: [],
				unusedNotebookReferences: [],
				undefinedNotebookReferences: [],
				missingFiles: [],
				missingPayloadFiles: [],
				unmappedDefinitionFiles: [],
				other: [],
			});
		}

		const packageWarnings = this.warningsByPackage.get(packagePath);
		packageWarnings[category].push({ itemName, message, contentFilePath });
		this.warnings.push(''); // Keep total count
	}

	/**
	 * Validate a package.json file
	 */
	validatePackageManifest(filePath) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const pkg = JSON.parse(content);

			// Check for required fields in package manifest
			const requiredFields = ['id', 'displayName', 'items'];
			const missingFields = requiredFields.filter((field) => !pkg[field]);

			if (missingFields.length > 0) {
				this.errors.push(`${filePath}: Missing required fields: ${missingFields.join(', ')}`);
				return false;
			}

			// Validate items array
			if (!Array.isArray(pkg.items)) {
				this.errors.push(`${filePath}: 'items' must be an array`);
				return false;
			}

			// Validate definition parts and files
			this.validateDefinitionParts(filePath, pkg);

			// Validate interceptor replacement keys are used in payload files
			this.validateInterceptorReplacements(filePath, pkg);

			return true;
		} catch (error) {
			if (error instanceof SyntaxError) {
				this.errors.push(`${filePath}: Invalid JSON - ${error.message}`);
			} else {
				this.errors.push(`${filePath}: ${error.message}`);
			}
			return false;
		}
	}

	/**
	 * Validate definition parts: check payload files exist and all definition files are mapped
	 */
	validateDefinitionParts(packagePath, pkg) {
		if (!pkg.items || !Array.isArray(pkg.items)) return;

		pkg.items.forEach((item) => {
			// Skip items without definitions (like Lakehouses without definitions)
			if (!item.definition) return;

			const parts = item.definition?.parts;
			if (!parts || !Array.isArray(parts)) return;

			// Check 1: Validate that all payload files exist
			const mappedPayloadPaths = new Set();
			parts.forEach((part) => {
				if (part.payloadType === 'AssetLink' && part.payload) {
					const payloadPath = part.payload.replace(/^\/assets\//, '');
					const fullPayloadPath = path.resolve(__dirname, '../app/assets', payloadPath);

					// Track mapped paths for later check
					mappedPayloadPaths.add(path.normalize(fullPayloadPath));

					if (!fs.existsSync(fullPayloadPath)) {
						this.addWarning(
							packagePath,
							'missingPayloadFiles',
							item.displayName,
							`Payload file not found: ${part.payload}`,
							part.payload,
						);
					}
				}
			});

			// Check 2: Validate that all files in the definition folder are mapped in parts
			// Expected folder pattern: /assets/items/PackageInstallerItem/{packageId}/definitions/{type}s/{displayName}.{type}/
			if (item.type && item.displayName) {
				const packageId = pkg.id;
				const itemType = item.type;
				const displayName = item.displayName;

				// Build expected definition folder path
				const definitionFolder = path.resolve(
					__dirname,
					'../app/assets/items/PackageInstallerItem',
					packageId,
					'definitions',
					`${itemType}s`,
					`${displayName}.${itemType}`,
				);

				// Check if definition folder exists
				if (fs.existsSync(definitionFolder)) {
					// Recursively find all files in the definition folder
					const allDefinitionFiles = this.getAllFilesRecursively(definitionFolder);

					// Check which files are not mapped in parts
					const unmappedFiles = allDefinitionFiles.filter((filePath) => {
						const normalizedPath = path.normalize(filePath);
						return !mappedPayloadPaths.has(normalizedPath);
					});

					if (unmappedFiles.length > 0) {
						// Convert to relative paths for cleaner display
						const relativeUnmappedFiles = unmappedFiles.map((filePath) => {
							return path
								.relative(path.resolve(__dirname, '../app/assets'), filePath)
								.replace(/\\/g, '/');
						});

						this.addWarning(
							packagePath,
							'unmappedDefinitionFiles',
							item.displayName,
							`Definition files not mapped in parts: ${relativeUnmappedFiles.join(', ')}`,
							definitionFolder,
						);
					}
				}
			}
		});
	}

	/**
	 * Recursively get all files in a directory
	 */
	getAllFilesRecursively(dir) {
		const files = [];

		const items = fs.readdirSync(dir);
		items.forEach((item) => {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				files.push(...this.getAllFilesRecursively(fullPath));
			} else if (stat.isFile()) {
				files.push(fullPath);
			}
		});

		return files;
	}

	/**
	 * Validate that interceptor replacement keys are actually used in the target files
	 */
	validateInterceptorReplacements(packagePath, pkg) {
		if (!pkg.items || !Array.isArray(pkg.items)) return;

		const resolveAssetPayloadPath = (payload) => {
			// payload format: "/assets/items/PackageInstallerItem/Fundraising/..."
			const payloadPath = payload.replace(/^\/assets\//, '');
			return path.resolve(__dirname, '../app/assets', payloadPath);
		};

		const readAssetLinkParts = (parts) => {
			const files = [];
			const contents = [];

			parts.forEach((part) => {
				if (!part.payload || part.payloadType !== 'AssetLink') return;

				const fullPayloadPath = resolveAssetPayloadPath(part.payload);
				files.push(fullPayloadPath);

				if (fs.existsSync(fullPayloadPath)) {
					contents.push(fs.readFileSync(fullPayloadPath, 'utf8'));
				}
			});

			return { files, content: contents.join('\n') };
		};

		// First pass: collect all definition payload files in this package.
		// Interceptors apply to every definition part at deployment time, so validation
		// must also inspect every part, not just the first payload.
		const allPayloadContents = new Map(); // Map<itemName, content>
		pkg.items.forEach((item) => {
			const parts = item.definition?.parts;
			if (!parts || !Array.isArray(parts) || parts.length === 0) return;

				try {
					const { content } = readAssetLinkParts(parts);
					if (!content) return;
					allPayloadContents.set(item.displayName, content);
				} catch (error) {
					// Error will be caught in second pass
				}
		});

		// Second pass: validate each item
		pkg.items.forEach((item, itemIndex) => {
			// Check if item has interceptor with replacements
			const interceptor = item.definition?.interceptor;
			if (!interceptor || interceptor.type !== 'StringReplacement') return;

			const replacements = interceptor.config?.replacements;
			if (!replacements || typeof replacements !== 'object') return;

			// Get all payload file paths and content
			const parts = item.definition?.parts;
			if (!parts || !Array.isArray(parts) || parts.length === 0) return;

			const { files: fullPayloadPaths, content: payloadContent } = readAssetLinkParts(parts);
			if (fullPayloadPaths.length === 0) return;

			// Check if file exists
			const missingPayloadPath = fullPayloadPaths.find((payloadPath) => !fs.existsSync(payloadPath));
			if (missingPayloadPath) {
				this.addWarning(
					packagePath,
					'missingFiles',
					item.displayName,
					`Payload file not found: ${missingPayloadPath}`,
				);
				return;
			}

			// Check 1: Unused replacement keys (defined but not used in content)
			const replacementKeys = Object.keys(replacements);
			const unusedKeys = [];

			replacementKeys.forEach((key) => {
				// Check if the key appears in the current payload content
				if (payloadContent.includes(key)) {
					return; // Key is used in current file
				}

				// Key not found in current file - check if it's used in ANY other file in the package
				let foundInOtherFile = false;
				for (const [otherItemName, otherContent] of allPayloadContents.entries()) {
					if (otherItemName !== item.displayName && otherContent.includes(key)) {
						foundInOtherFile = true;
						break;
					}
				}

				// Only report as unused if not found in any file
				if (!foundInOtherFile) {
					unusedKeys.push(key);
				}
			});

			// Report unused keys as warnings
			if (unusedKeys.length > 0) {
				this.addWarning(
					packagePath,
					'unusedReplacements',
					item.displayName,
					`Replacement keys not found in payload: ${unusedKeys.join(', ')}`,
					fullPayloadPaths.join(', '),
				);
			} // Check 2: Undefined variables in metadata (used in metadata but not defined in replacements)
			// Only check $.metadata path in notebook JSON, not cell content
			const foundVariables = new Set();
			let match;

			// Check if this is a notebook file by parsing JSON
			let isNotebook = false;
			let notebookData = null;
			try {
				notebookData = JSON.parse(payloadContent);
				isNotebook = notebookData.cells && Array.isArray(notebookData.cells);
			} catch (e) {
				// Not JSON or not a notebook, treat as plain content
			}

			if (isNotebook && notebookData) {
				// For notebooks: only search $.metadata path for variables
				const metadata = notebookData.metadata || {};
				const metadataStr = JSON.stringify(metadata);

				// Metadata pattern: simple assignment like ": "{VARIABLE}"
				const metadataPattern = /:\s*["']([{<]\w+[}>])["']/g;
				while ((match = metadataPattern.exec(metadataStr)) !== null) {
					foundVariables.add(match[1]);
				}
			} else {
				// For non-notebook files (JSON, DataPipeline): simple pattern
				const assignmentPattern = /[=:]\s*["']([{<]\w+[}>])["']/g;
				while ((match = assignmentPattern.exec(payloadContent)) !== null) {
					foundVariables.add(match[1]);
				}
			} // Filter out system variables that might be replaced at runtime
			// System variables use double braces: {{WORKSPACE_ID}}
			const systemVariables = [
				'{{WORKSPACE_ID}}',
				'{{WORKSPACE_NAME}}',
				'{{ITEM_ID}}',
				'{{PREFIX}}',
				'{{SUFFIX}}',
			];

			const undefinedVariables = Array.from(foundVariables).filter((variable) => {
				// Check if it's defined in replacements
				const isDefined = replacementKeys.includes(variable);
				// Check if it's a system variable (double braces) - must match exactly
				const isSystemVariable = systemVariables.includes(variable);
				// Check if it's a reference to another item (pattern: {{ItemSourceId}})
				const isItemReference = variable.startsWith('{{') && variable.endsWith('}}');

				return !isDefined && !isSystemVariable && !isItemReference;
			});

			if (undefinedVariables.length > 0) {
				this.addWarning(
					packagePath,
					'undefinedMetadataVariables',
					item.displayName,
					`Variables in metadata not defined in replacements: ${undefinedVariables.join(', ')}`,
					fullPayloadPath,
				);
			}

			// Check 3: %run command validation for notebooks
			// Check notebook references in angle brackets: <NotebookName>
			if (isNotebook && notebookData) {
				// Get all notebook reference keys from replacements (angle bracket format)
				const notebookRefKeys = replacementKeys.filter((key) => key.startsWith('<') && key.endsWith('>'));

				// Extract all %run commands from cells
				const runCommands = new Set();
				const cells = notebookData.cells || [];
				for (const cell of cells) {
					if (cell.source && cell.cell_type === 'code') {
						const cellContent = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
						// Match %run <NotebookName> pattern
						const runPattern = /%run\s+(<\w+>)/g;
						let runMatch;
						while ((runMatch = runPattern.exec(cellContent)) !== null) {
							runCommands.add(runMatch[1]);
						}
					}
				}

				// Check 3a: Notebook reference keys not used in %run commands
				const unusedNotebookRefs = notebookRefKeys.filter((key) => !runCommands.has(key));
				if (unusedNotebookRefs.length > 0) {
					this.addWarning(
						packagePath,
						'unusedNotebookReferences',
						item.displayName,
						`Notebook references not used in %run commands: ${unusedNotebookRefs.join(', ')}`,
						fullPayloadPath,
					);
				}

				// Check 3b: %run commands without corresponding replacement keys
				const undefinedNotebookRefs = Array.from(runCommands).filter((cmd) => !notebookRefKeys.includes(cmd));
				if (undefinedNotebookRefs.length > 0) {
					this.addWarning(
						packagePath,
						'undefinedNotebookReferences',
						item.displayName,
						`%run commands not defined in replacements: ${undefinedNotebookRefs.join(', ')}`,
						fullPayloadPath,
					);
				}
			}
		});
	} /**
	 * Validate any JSON file for syntax
	 */
	validateJson(filePath) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			JSON.parse(content);
			return true;
		} catch (error) {
			if (error instanceof SyntaxError) {
				this.errors.push(`${filePath}: Invalid JSON - ${error.message}`);
			} else {
				this.errors.push(`${filePath}: ${error.message}`);
			}
			return false;
		}
	}

	/**
	 * Recursively walk through directory and validate files
	 */
	walkDirectory(dir) {
		const files = fs.readdirSync(dir);

		files.forEach((file) => {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				this.walkDirectory(filePath);
			} else if (stat.isFile()) {
				const relativePath = path.relative(process.cwd(), filePath);

				// Validate based on file type
				if (file.endsWith('.ipynb')) {
					this.validated++;
					this.validateNotebook(filePath);
					process.stdout.write('.');
				} else if (file === 'package.json' && filePath.includes('PackageInstallerItem')) {
					this.validated++;
					this.validatePackageManifest(filePath);
					process.stdout.write('.');
				} else if (file.endsWith('.json') && !filePath.includes('node_modules')) {
					this.validated++;
					this.validateJson(filePath);
					process.stdout.write('.');
				}
			}
		});
	}

	/**
	 * Run validation and report results
	 */
	validate(assetsPath) {
		console.log('🔍 Validating assets...\n');

		if (!fs.existsSync(assetsPath)) {
			console.error(`❌ Assets directory not found: ${assetsPath}`);
			process.exit(1);
		}

		this.walkDirectory(assetsPath);

		console.log('\n');

		// Report results
		if (this.errors.length === 0 && this.warnings.length === 0) {
			console.log(`✅ All ${this.validated} assets validated successfully!`);
			return true;
		}

		// Report categorized warnings grouped by package
		if (this.warnings.length > 0) {
			console.log(`\n⚠️  Warnings (${this.warnings.length}):\n`);

			// Iterate through each package that has warnings
			for (const [packagePath, categories] of this.warningsByPackage.entries()) {
				const totalWarningsForPackage =
					categories.unusedReplacements.length +
					categories.undefinedMetadataVariables.length +
					categories.unusedNotebookReferences.length +
					categories.undefinedNotebookReferences.length +
					categories.missingFiles.length +
					categories.missingPayloadFiles.length +
					categories.unmappedDefinitionFiles.length +
					categories.other.length;
				if (totalWarningsForPackage === 0) continue;

				console.log(`  📦 ${packagePath}`);
				console.log(`     (${totalWarningsForPackage} warning${totalWarningsForPackage > 1 ? 's' : ''})\n`);

				// Unused Replacements
				if (categories.unusedReplacements.length > 0) {
					console.log(`     📋 Unused Replacement Keys (${categories.unusedReplacements.length}):`);
					categories.unusedReplacements.forEach(({ itemName, message, contentFilePath }) => {
						// Extract just the keys from "Replacement keys not found in payload: {KEY1}, {KEY2}"
						const keys = message
							.replace('Replacement keys not found in payload: ', '')
							.split(', ')
							.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
						const displayPath = contentFilePath || packagePath;
						console.log(`        • ${itemName} [${displayPath}]`);
						keys.forEach((key) => console.log(`            - ${key}`));
						console.log('');
					});
				} // Undefined Metadata Variables
				if (categories.undefinedMetadataVariables.length > 0) {
					console.log(
						`     ❓ Undefined Metadata Variables (${categories.undefinedMetadataVariables.length}):`,
					);
					categories.undefinedMetadataVariables.forEach(({ itemName, message, contentFilePath }) => {
						// Extract just the variables from "Variables in metadata not defined in replacements: {VAR1}, {VAR2}"
						const variables = message
							.replace('Variables in metadata not defined in replacements: ', '')
							.split(', ')
							.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
						const displayPath = contentFilePath || packagePath;
						console.log(`        • ${itemName} [${displayPath}]`);
						variables.forEach((variable) => console.log(`            - ${variable}`));
						console.log('');
					});
				}

				// Unused Notebook References
				if (categories.unusedNotebookReferences.length > 0) {
					console.log(`     📓 Unused Notebook References (${categories.unusedNotebookReferences.length}):`);
					categories.unusedNotebookReferences.forEach(({ itemName, message, contentFilePath }) => {
						// Extract just the references from "Notebook references not used in %run commands: <REF1>, <REF2>"
						const refs = message
							.replace('Notebook references not used in %run commands: ', '')
							.split(', ')
							.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
						const displayPath = contentFilePath || packagePath;
						console.log(`        • ${itemName} [${displayPath}]`);
						refs.forEach((ref) => console.log(`            - ${ref}`));
						console.log('');
					});
				}

				// Undefined Notebook References
				if (categories.undefinedNotebookReferences.length > 0) {
					console.log(
						`     🔗 Undefined Notebook References (${categories.undefinedNotebookReferences.length}):`,
					);
					categories.undefinedNotebookReferences.forEach(({ itemName, message, contentFilePath }) => {
						// Extract just the references from "%run commands not defined in replacements: <REF1>, <REF2>"
						const refs = message
							.replace('%run commands not defined in replacements: ', '')
							.split(', ')
							.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
						const displayPath = contentFilePath || packagePath;
						console.log(`        • ${itemName} [${displayPath}]`);
						refs.forEach((ref) => console.log(`            - ${ref}`));
						console.log('');
					});
				}

				// Missing Files
				if (categories.missingFiles.length > 0) {
					console.log(`     📁 Missing Files (${categories.missingFiles.length}):`);
					categories.missingFiles.forEach(({ itemName, message }) => {
						// Extract just the path from "Payload file not found: /path/to/file"
						const filePath = message.replace('Payload file not found: ', '');
						console.log(`        • ${itemName} [${packagePath}]`);
						console.log(`            - ${filePath}`);
						console.log('');
					});
				}

				// Missing Payload Files
				if (categories.missingPayloadFiles.length > 0) {
					console.log(`     📂 Missing Payload Files (${categories.missingPayloadFiles.length}):`);
					categories.missingPayloadFiles.forEach(({ itemName, message }) => {
						const filePath = message.replace('Payload file not found: ', '');
						console.log(`        • ${itemName} [${packagePath}]`);
						console.log(`            - ${filePath}`);
						console.log('');
					});
				}

				// Unmapped Definition Files
				if (categories.unmappedDefinitionFiles.length > 0) {
					console.log(`     📄 Unmapped Definition Files (${categories.unmappedDefinitionFiles.length}):`);
					categories.unmappedDefinitionFiles.forEach(({ itemName, message, contentFilePath }) => {
						// Extract files from message
						const filesStr = message.replace('Definition files not mapped in parts: ', '');
						const files = filesStr
							.split(', ')
							.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
						const displayPath = contentFilePath || packagePath;
						console.log(`        • ${itemName} [${displayPath}]`);
						files.forEach((file) => console.log(`            - ${file}`));
						console.log('');
					});
				}

				// Other Warnings
				if (categories.other.length > 0) {
					console.log(`     ⚠️  Other Warnings (${categories.other.length}):`);
					categories.other.forEach(({ itemName, message }) => {
						console.log(`        • ${itemName}`);
						console.log(`          ${message}`);
					});
					console.log('');
				}
			}
		}

		if (this.errors.length > 0) {
			console.log(`\n❌ Errors (${this.errors.length}):`);
			this.errors.forEach((error) => console.log(`   ${error}`));
			console.log(`\n❌ Validation failed with ${this.errors.length} error(s)\n`);
			return false;
		}

		console.log(`✅ Validation completed with ${this.warnings.length} warning(s)\n`);
		return true;
	}
}

// Main execution
if (require.main === module) {
	const assetsPath = path.resolve(__dirname, '../app/assets');
	const validator = new AssetValidator();

	const success = validator.validate(assetsPath);
	process.exit(success ? 0 : 1);
}

module.exports = AssetValidator;
