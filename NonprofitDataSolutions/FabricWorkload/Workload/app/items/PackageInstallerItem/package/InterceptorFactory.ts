import {
	ItemPartInterceptorDefinition,
	ItemPartInterceptorDefinitionConfig,
	StringReplacementInterceptorDefinitionConfig,
} from '../PackageInstallerItemModel';
import { DeploymentContext } from '../deployment/DeploymentContext';

export abstract class Interceptor<T extends ItemPartInterceptorDefinitionConfig> {
	protected definition: ItemPartInterceptorDefinition<T>;
	protected depContext: DeploymentContext;

	constructor(definition: ItemPartInterceptorDefinition<T>, depContext: DeploymentContext) {
		if (!definition) {
			throw new Error('Interceptor definition is required');
		}
		this.definition = definition;
		this.depContext = depContext;
	}

	/**
	 * Intercepts the content of a package item part.
	 * @param content The original content of the item part encoded in base64.
	 * @returns The modified content of the item part.
	 */

	async interceptBase64(content: string): Promise<string> {
		if (!content) {
			throw new Error('Content to intercept cannot be empty');
		}
		// Decode the base64 content
		const decodedContent = atob(content);
		// Perform the interception logic
		const modifiedContent = await this.interceptText(decodedContent);
		// Return the modified content encoded in base64
		return btoa(modifiedContent);
	}

	async interceptText(content: string): Promise<string> {
		if (!content) {
			throw new Error('Content to intercept cannot be empty');
		}
		// copy all global variables
		const variables: Record<string, string> = { ...this.depContext.variableMap };
		// Perform the interception logic
		const modifiedContent = await this.interceptContentInt(content, variables);
		return modifiedContent;
	}

	protected abstract interceptContentInt(content: string, systemVariables: Record<string, string>): Promise<string>;
}

export class StringReplaceInterceptor extends Interceptor<StringReplacementInterceptorDefinitionConfig> {
	constructor(
		definition: ItemPartInterceptorDefinition<StringReplacementInterceptorDefinitionConfig>,
		depContext: DeploymentContext,
	) {
		super(definition, depContext);
	}

	async interceptContentInt(content: string, systemVariables: Record<string, string>): Promise<string> {
		let modifiedContent = content;

		// Support multi-pass processing so newly introduced placeholders (e.g. {{SUFFIX}})
		// can be expanded. Default is 1 pass to preserve previous behaviour.
		const maxPasses = Math.max(1, this.definition.config.maxPasses ?? 1);
		const suffix = systemVariables['{{SUFFIX}}'];
		const prefix = systemVariables['{{PREFIX}}'];

		const suffixingEnabled = this.depContext.pack?.deploymentConfig?.suffixItemNames === true && !!suffix; // explicit gate
		const prefixingEnabled = !!this.depContext.pack?.deploymentConfig?.prefixItemNames && !!prefix;

		// We allow a package-level list of placeholder KEYS (e.g. "{SILVER_LAKEHOUSE_NAME}") to receive decorations automatically.
		// Retrieve from deployment config via depContext.pack.deploymentConfig?.prefixedOrSuffixedReplacements when either decoration is enabled.
		const packageDecorationKeys =
			suffixingEnabled || prefixingEnabled
				? this.depContext.pack?.deploymentConfig?.prefixedOrSuffixedReplacements || []
				: [];

		for (let pass = 0; pass < maxPasses; pass++) {
			const before = modifiedContent;

			// 1. Expand any system variable placeholders present in the content (e.g. {{WORKSPACE_ID}})
			for (const [varName, varValue] of Object.entries(systemVariables)) {
				if (varValue === undefined || varValue === null) continue;
				const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				modifiedContent = modifiedContent.replace(new RegExp(escaped, 'g'), varValue);
			}

			// 2. Perform configured replacements; replacement values themselves can reference variables
			const replacements = this.definition.config.replacements;
			if (replacements) {
				for (const [search, replacementTemplate] of Object.entries(replacements)) {
					let actualReplacement = systemVariables[replacementTemplate] || replacementTemplate;
					// If this placeholder key is in prefixedOrSuffixedReplacements AND prefix exists, prepend prefix (only if not already present)
					if (
						prefixingEnabled &&
						prefix &&
						packageDecorationKeys.includes(search) &&
						!actualReplacement.startsWith(prefix)
					) {
						actualReplacement = `${prefix}${actualReplacement}`;
					}
					// If this placeholder key is in prefixedOrSuffixedReplacements AND suffix exists, append suffix (only if not already appended)
					if (
						suffixingEnabled &&
						suffix &&
						packageDecorationKeys.includes(search) &&
						!actualReplacement.endsWith(suffix)
					) {
						actualReplacement = `${actualReplacement}${suffix}`;
					}
					const escapedSearchPattern = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					modifiedContent = modifiedContent.replace(new RegExp(escapedSearchPattern, 'g'), actualReplacement);
				}
			}

			// 3. If nothing changed during this pass, bail out early
			if (modifiedContent === before) {
				break;
			}
		}

		return modifiedContent;
	}
}

/**
 * Factory for creating PackageItemParInterceptor instances based on configuration type.
 */
export class InterceptorFactory {
	/**
	 * Creates an interceptor instance based on the provided configuration.
	 * @param interceptorDef The interceptor definition
	 * @returns An instance of the appropriate interceptor
	 */
	static createInterceptor(
		interceptorDef: ItemPartInterceptorDefinition<any>,
		depContext: DeploymentContext,
	): Interceptor<any> {
		if (!interceptorDef) {
			throw new Error('Interceptor definition is required');
		}
		switch (interceptorDef.type) {
			case 'StringReplacement':
				return new StringReplaceInterceptor(
					interceptorDef as ItemPartInterceptorDefinition<StringReplacementInterceptorDefinitionConfig>,
					depContext,
				);
			default:
				throw new Error(`Unsupported interceptor type: ${interceptorDef.type}`);
		}
	}

	/**
	 * Creates multiple interceptor instances from an array of configurations.
	 * @param interceptors Array of interceptor definitions
	 * @returns Array of interceptor instances
	 */
	static createInterceptors(
		interceptors: ItemPartInterceptorDefinition<any>[],
		depContext: DeploymentContext,
	): Interceptor<any>[] {
		if (!interceptors || interceptors.length === 0) {
			return [];
		}
		return interceptors.map((interceptor) => this.createInterceptor(interceptor, depContext));
	}

	/**
	 * Gets all supported interceptor types.
	 * @returns Array of supported interceptor type names
	 */
	static getSupportedTypes(): string[] {
		return ['StringReplacement'];
	}

	/**
	 * Checks if an interceptor type is supported.
	 * @param type The interceptor type to check
	 * @returns True if the type is supported, false otherwise
	 */
	static isTypeSupported(type: string): boolean {
		return this.getSupportedTypes().includes(type);
	}
}
