export type PipelineActivityDependency = {
	activity: string;
	dependencyConditions: string[];
};

export type ExecutePipelineActivity = {
	name: string;
	type: 'ExecutePipeline';
	dependsOn: PipelineActivityDependency[];
	policy?: {
		secureInput?: boolean;
		[key: string]: unknown;
	};
	typeProperties: {
		pipeline: {
			referenceName: string;
			type: string;
		};
		waitOnCompletion: boolean;
		parameters: Record<string, unknown>;
	};
	[key: string]: unknown;
};

export type TridentNotebookActivity = {
	name: string;
	type: 'TridentNotebook';
	dependsOn: PipelineActivityDependency[];
	policy: {
		timeout: string;
		retry: number;
		retryIntervalInSeconds: number;
		secureOutput: boolean;
		secureInput: boolean;
	};
	typeProperties: {
		notebookId: string;
		workspaceId: string;
	};
	[key: string]: unknown;
};

export type BronzePipelineActivity = ExecutePipelineActivity | TridentNotebookActivity;
export type BronzePipelineDefinition = BronzePipelineActivity[];
export type BronzePipelineSource =
	| BronzePipelineDefinition
	| {
			activities: BronzePipelineDefinition;
			[key: string]: unknown;
	  };

export interface BronzePipelineContent {
	properties?: {
		activities?: BronzePipelineActivity[];
		[key: string]: unknown;
	};
	[key: string]: unknown;
}
