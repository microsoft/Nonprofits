import { useEffect, useRef } from 'react';

import { Tab, TabList } from '@fluentui/react-components';

export const HomeTabList: React.FC<{}> = () => {
	const tabListRef = useRef<HTMLDivElement>(null);

	// Fix WCAG 4.1.2: Remove focusability from aria-hidden tabster dummy elements
	// This addresses an accessibility issue where Fluent UI TabList generates
	// dummy elements with aria-hidden="true" and tabindex="0", violating WCAG 4.1.2
	useEffect(() => {
		try {
			if (tabListRef.current) {
				const dummyElements = tabListRef.current.querySelectorAll('[data-tabster-dummy][aria-hidden="true"]');
				dummyElements.forEach((el) => {
					el.setAttribute('tabindex', '-1');
				});
			}
		} catch (error) {
			console.warn('Failed to apply accessibility fix:', error);
		}
	}, []);

	return (
		<TabList ref={tabListRef} selectedValue={'home'} size="small">
			<Tab value="home">Home</Tab>
		</TabList>
	);
};
