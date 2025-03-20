import { useMediaQuery } from 'react-responsive';

export const useIsUpToSmallScreen = () => useMediaQuery({ query: '(max-width: 479px)' });
export const useIsUpToMediumScreen = () => useMediaQuery({ query: '(max-width: 639px)' });
export const useIsUpToLargeScreen = () => useMediaQuery({ query: '(max-width: 1023px)' });
export const useIsUpToXLScreen = () => useMediaQuery({ query: '(max-width: 1365px)' });
export const useIsUpToXXLScreen = () => useMediaQuery({ query: '(max-width: 1919px)' });
