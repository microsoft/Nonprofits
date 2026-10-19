import { makeStyles, tokens } from '@fluentui/react-components';

export const useShimmerStyles = makeStyles({
	shimmer: {
		backgroundColor: tokens.colorNeutralBackground3,
		borderRadius: tokens.borderRadiusSmall,
		animationDuration: '1s',
		animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
		animationIterationCount: 'infinite',
		animationDirection: 'alternate',
		animationName: {
			from: { opacity: 1 },
			to: { opacity: 0.5 },
		},
	},
	round: {
		borderRadius: '50%',
	},
});
