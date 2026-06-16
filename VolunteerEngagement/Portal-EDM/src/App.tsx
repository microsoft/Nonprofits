import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LocaleProvider } from '@/i18n';
import AccessDenied from '@/pages/AccessDenied';
import EngagementDetails from '@/pages/EngagementDetails';
import Home from '@/pages/Home';
import MyEngagements from '@/pages/MyEngagements';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import Search from '@/pages/Search';
import Success from '@/pages/Success';

import { ThemeProvider } from '@/context/ThemeContext';

import { Layout } from '@/components/Layout';

// Power Pages prepends a language prefix (e.g. /en-US/, /fr-FR/) when
// multiple languages are enabled.  Detect it so React Router matches correctly.
const langMatch = window.location.pathname.match(/^\/([a-z]{2}-[A-Z]{2})(\/|$)/);
const basename = langMatch ? `/${langMatch[1]}` : '/';

export default function App() {
	return (
		<LocaleProvider>
			<ThemeProvider>
				<BrowserRouter basename={basename}>
					<Routes>
						<Route element={<Layout />}>
							<Route path="/" element={<Home />} />
							<Route path="/opportunities" element={<Navigate to="/" replace />} />
							<Route path="/engagement/:id" element={<EngagementDetails />} />
							<Route path="/my-engagements" element={<MyEngagements />} />
							<Route path="/profile" element={<Profile />} />
							<Route path="/profile-availability" element={<Profile />} />
							<Route path="/profile-prefandqual" element={<Profile />} />
							<Route path="/search" element={<Search />} />
							<Route path="/success" element={<Success />} />
							<Route path="/access-denied" element={<AccessDenied />} />
							<Route path="*" element={<NotFound />} />
						</Route>
					</Routes>
				</BrowserRouter>
			</ThemeProvider>
		</LocaleProvider>
	);
}
