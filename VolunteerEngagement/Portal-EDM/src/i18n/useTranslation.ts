import { useContext } from 'react';

import { LocaleContext } from './LocaleContext';

export const useTranslation = () => useContext(LocaleContext);
