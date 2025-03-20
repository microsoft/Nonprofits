const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env, argv) => {
	const isDev = argv.mode === 'development';
	const isProd = argv.mode === 'production';

	return {
		entry: {
			EngagementQualificationForm: path.resolve(__dirname, 'src/EngagementQualificationForm.ts'),
			EngagementOpportunityForm: path.resolve(__dirname, 'src/EngagementOpportunityForm.ts'),
			EngagementOpportunityScheduleForm: path.resolve(__dirname, 'src/EngagementOpportunityScheduleForm.ts'),
			EngagementOpportunitySettingForm: path.resolve(__dirname, 'src/EngagementOpportunitySettingForm.ts'),
			GroupForm: path.resolve(__dirname, 'src/GroupForm.ts'),
			ParticipationForm: path.resolve(__dirname, 'src/ParticipationForm.ts'),
			ParticipationScheduleForm: path.resolve(__dirname, 'src/ParticipationScheduleForm.ts'),
			QualificationForm: path.resolve(__dirname, 'src/QualificationForm.ts'),
			QualificationTypeForm: path.resolve(__dirname, 'src/QualificationTypeForm.ts'),
			QualificationStageForm: path.resolve(__dirname, 'src/QualificationStageForm.ts'),
		},
		mode: argv.mode,
		devtool: isDev && 'source-map',
		module: {
			rules: [
				{
					test: /\.ts?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				}
			]
		},
		plugins: [
			new ESLintPlugin()
		],
		resolve: {
			extensions: ['.ts', '.js'],
		},
		output: {
			filename: 'msnfp_[name].gen.js',
			path: path.resolve(__dirname, 'dist'),
		},
	};
};
