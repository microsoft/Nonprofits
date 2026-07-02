import {
	DeploymentLocation,
	DeploymentType,
	ItemPartInterceptorDefinition,
	ItemPartInterceptorType,
	Package,
	StringReplacementInterceptorDefinitionConfig,
} from '../PackageInstallerItemModel';

export type ConfiguredPackages = {
	[key: string]: Package;
};

// Helper function to convert interceptor config and create interceptor instance
export function convertInterceptor(definition: any): ItemPartInterceptorDefinition<any> | undefined {
	if (!definition) return undefined;

	// Validate interceptor structure
	if (!definition.type) {
		throw new Error('Interceptor type is required');
	}

	// Convert string interceptor type to enum and validate configuration
	let interceptorType: ItemPartInterceptorType;
	let config: any;

	if (typeof definition.type === 'string') {
		switch (definition.type) {
			case 'StringReplacement':
				interceptorType = ItemPartInterceptorType.StringReplacement;

				// Validate StringReplacementInterceptorDefinitionConfig structure
				if (!definition.config.replacements || typeof definition.config.replacements !== 'object') {
					throw new Error(
						'StringReplacement interceptor requires a "replacements" object with key-value pairs',
					);
				}

				// Validate that replacements is not an array and has string values
				if (Array.isArray(definition.config.replacements)) {
					throw new Error('StringReplacement interceptor "replacements" must be an object, not an array');
				}

				// Validate that all replacement values are strings
				for (const [key, value] of Object.entries(definition.config.replacements)) {
					if (typeof value !== 'string') {
						throw new Error(
							`StringReplacement interceptor replacement value for key "${key}" must be a string, got ${typeof value}`,
						);
					}
				}

				// Create proper StringReplacementInterceptorDefinitionConfig
				config = {
					replacements: definition.config.replacements,
					maxPasses: definition.config.maxPasses,
				} as StringReplacementInterceptorDefinitionConfig;
				break;

			default:
				throw new Error(`Unsupported interceptor type: ${definition.type}`);
		}
	} else {
		throw new Error('Interceptor type must be specified as a string');
	}

	// Create the interceptor definition
	const interceptorDefinition: ItemPartInterceptorDefinition<any> = {
		type: interceptorType,
		config: config,
	};

	// Use InterceptorFactory to create the actual interceptor instance
	return interceptorDefinition;
}

// Resolve the build-time version placeholder that is left unsubstituted for the
// frontend bundle (only the manifest nuspec is replaced during packaging).
export function resolvePackageVersion(version: string | undefined): string | undefined {
	if (!version || version.includes('{{VERSION}}')) {
		return process.env.WORKLOAD_VERSION || version;
	}
	return version;
}

// Helper function to convert config JSON to Package interface
export function convertConfigToPackage(pack: any): Package {
	// Ensure deploymentConfig is defined;
	const deploymentConfig = {
		...pack.deploymentConfig,
	};
	// Normalize prefix configuration: allow string, null, or undefined; coerce other types to undefined
	if (deploymentConfig.prefixItemNames !== undefined && deploymentConfig.prefixItemNames !== null) {
		if (typeof deploymentConfig.prefixItemNames !== 'string') {
			logger.warn(
				`Invalid prefixItemNames value for package ${pack.id}; expected string|null but received ${typeof deploymentConfig.prefixItemNames}. Ignoring.`,
			);
			delete deploymentConfig.prefixItemNames;
		} else {
			deploymentConfig.prefixItemNames = deploymentConfig.prefixItemNames.trim();
			if (deploymentConfig.prefixItemNames.length === 0) {
				deploymentConfig.prefixItemNames = null;
			}
		}
	}

	// Convert string deployment type to enum
	if (typeof deploymentConfig.type === 'string') {
		switch (deploymentConfig.type) {
			case 'UX':
				deploymentConfig.deploymentType = DeploymentType.UX;
				break;
			default:
				throw new Error(`Unsupported deployment type: ${deploymentConfig.type}`);
		}
	} else {
		deploymentConfig.deploymentType = DeploymentType.UX; // Default to UX if not specified
	}

	// Convert string location type to enum
	if (typeof deploymentConfig.location === 'string') {
		switch (deploymentConfig.location) {
			case 'Default':
				deploymentConfig.location = DeploymentLocation.Default;
				break;
			case 'NewWorkspace':
				deploymentConfig.location = DeploymentLocation.NewWorkspace;
				break;
			default:
				deploymentConfig.location = DeploymentLocation.Default; // Default to Default if not specified
		}
	} else {
		deploymentConfig.location = DeploymentLocation.Default;
	}

	if (deploymentConfig.suffixItemNames === undefined) {
		switch (deploymentConfig.location) {
			case DeploymentLocation.Default:
				deploymentConfig.suffixItemNames = true; //need to make sure we suffix for item name conflicts
				break;
			case DeploymentLocation.NewWorkspace:
				deploymentConfig.suffixItemNames = false;
				break;
		}
	}

	// Process items and their interceptors
	const processedItems =
		pack.items?.map((item: any) => {
			try {
				const processedItem = { ...item };

				// Process definition interceptor if present
				if (processedItem.definition?.interceptor) {
					processedItem.definition.interceptor = convertInterceptor(processedItem.definition.interceptor);
				}

				// Process data interceptor if present
				if (processedItem.data?.interceptor) {
					processedItem.data.interceptor = convertInterceptor(processedItem.data.interceptor);
				}

				return processedItem;
			} catch (error) {
				logger.error(`Process interceptors failed ${item.displayName}:`, error);
				throw error;
			}
		}) || [];

	return {
		id: pack.id,
		deploymentConfig: deploymentConfig,
		displayName: pack.displayName,
		description: pack.description,
		version: resolvePackageVersion(pack.version),
		icon: pack.icon,
		items: processedItems,
	};
}

// Package Registry Class for dynamic package management
export class PackageRegistry {
	private packages: ConfiguredPackages = {};
	private initialized = false;

	// Load packages from asset config files
	async loadFromAssets(): Promise<void> {
		if (this.initialized) return;

		try {
			// Import config files from assets - adjust paths as needed
			const configModules: (() => Promise<any>)[] = [
				// Add your config file imports here
				() => import('../../../assets/items/PackageInstallerItem/Fundraising/package.json'),
			];

			// Load all config files
			const configs = await Promise.all(
				configModules.map(async (importFn: () => Promise<any>) => {
					try {
						const module = await importFn();
						return module.default || module;
					} catch (error) {
						logger.error('Load config failed:', error);
						return null;
					}
				}),
			);

			// Convert and register packages
			configs
				.filter((config) => config !== null)
				.forEach((config) => {
					try {
						const packageObj = convertConfigToPackage(config);
						this.packages[packageObj.id] = packageObj;
					} catch (error) {
						logger.error(`Convert config failed: ${error}`);
					}
				});

			this.initialized = true;
			logger.debug(`Loaded ${Object.keys(this.packages).length} packages`);
		} catch (error) {
			logger.error('Load packages failed:', error);
			this.initialized = true; // Mark as initialized even on failure to prevent retries
		}
	}

	// Add a package dynamically
	addPackage(packageConfig: Package | any): void {
		try {
			const packageObj =
				typeof packageConfig.id === 'string'
					? (packageConfig as Package)
					: convertConfigToPackage(packageConfig);

			this.packages[packageObj.id] = packageObj;
			logger.debug(`Added package: ${packageObj.id}`);
		} catch (error) {
			logger.error('Add package failed:', error);
			throw error;
		}
	}
	// Remove a package
	removePackage(id: string): boolean {
		if (this.packages[id]) {
			delete this.packages[id];
			logger.debug(`Removed package: ${id}`);
			return true;
		}
		return false;
	}

	// Get all packages
	getAllPackages(): ConfiguredPackages {
		return { ...this.packages };
	}

	// Get packages as array
	getPackagesArray(): Package[] {
		return Object.values(this.packages);
	}

	// Get specific package
	getPackage(id: string): Package | undefined {
		return this.packages[id];
	}

	// Check if package exists
	hasPackage(id: string): boolean {
		return id in this.packages;
	}

	// Clear all packages
	clear(): void {
		this.packages = {};
		this.initialized = false;
	}
}
