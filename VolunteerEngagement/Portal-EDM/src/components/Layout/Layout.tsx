import React, { useState } from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import {
	Button,
	Menu,
	MenuDivider,
	MenuItem,
	MenuList,
	MenuPopover,
	MenuTrigger,
	Text,
	Tooltip,
} from '@fluentui/react-components';
import {
	ChevronDown20Regular,
	Dismiss24Regular,
	Heart24Regular,
	Navigation24Regular,
	Person24Regular,
	PersonArrowRight24Regular,
	Search24Regular,
	SignOut24Regular,
} from '@fluentui/react-icons';

import { LanguagePicker } from '@/components/LanguagePicker';
import { ThemeToggle } from '@/components/ThemeToggle';

import { useAuth } from '@/hooks/useAuth';

import { navItems } from './Layout.model';
import { useLayoutStyles } from './Layout.styles';
import { useRouteDocumentTitle } from './hooks/useRouteDocumentTitle';

const normalizePath = (path: string) => path.replace(/\/$/, '') || '/';

export const Layout: React.FC = () => {
	const styles = useLayoutStyles();
	const navigate = useNavigate();
	const location = useLocation();
	const { user, isAuthenticated } = useAuth();
	const { t } = useTranslation();
	const [mobileOpen, setMobileOpen] = useState(false);

	const visibleItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);
	const currentPath = normalizePath(location.pathname);

	const isActive = (path: string, activePaths?: string[]) => (activePaths ?? [path]).includes(currentPath);

	useRouteDocumentTitle();

	return (
		<div className={styles.root}>
			<a href="#main-content" className={styles.skipLink}>
				{t('MSVE_SPA/Common/SkipToMainContent')}
			</a>
			<header className={styles.header}>
				<div className={styles.brandSection} onClick={() => navigate('/')}>
					<Heart24Regular className={styles.brandIcon} />
					<Text size={400} weight="semibold" className={styles.brandText}>
						{t('MSVE_SPA/Common/VolunteerEngagement')}
					</Text>
				</div>

				<nav className={styles.nav}>
					{visibleItems.map((item) => (
						<div
							key={item.path}
							className={`${styles.navLink} ${isActive(item.path, item.activePaths) ? styles.navLinkActive : ''}`}
							onClick={() => navigate(item.path)}
							role="link"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter') navigate(item.path);
							}}
						>
							<Text size={300} weight={isActive(item.path, item.activePaths) ? 'semibold' : 'regular'}>
								{t(item.text)}
							</Text>
						</div>
					))}
				</nav>

				<div className={styles.rightSection}>
					<Tooltip content={t('MSVE_SPA/Nav/Search')} relationship="label">
						<Button icon={<Search24Regular />} appearance="subtle" onClick={() => navigate('/search')} />
					</Tooltip>

					<div className={styles.divider} />

					<ThemeToggle />

					<LanguagePicker />

					{isAuthenticated && user ? (
						<Menu>
							<MenuTrigger disableButtonEnhancement>
								<div className={styles.userMenuTrigger} role="button" tabIndex={0}>
									<Person24Regular className={styles.userIconMobile} />
									<Text size={300} truncate wrap={false} className={styles.userNameText}>
										{user.firstName || user.lastName
											? `${user.firstName} ${user.lastName}`.trim()
											: user.userName}
									</Text>
									<ChevronDown20Regular className={styles.userNameText} />
								</div>
							</MenuTrigger>
							<MenuPopover>
								<MenuList>
									<MenuItem onClick={() => navigate('/profile')}>
										{t('MSVE_SPA/Nav/Profile')}
									</MenuItem>
									<MenuItem onClick={() => navigate('/my-engagements')}>
										{t('MSVE_SPA/Nav/MyEngagements')}
									</MenuItem>
									<MenuDivider />
									<MenuItem
										icon={<SignOut24Regular />}
										onClick={() => {
											window.location.href = '/Account/Login/LogOff?returnUrl=%2F';
										}}
									>
										{t('MSVE_SPA/Common/SignOut')}
									</MenuItem>
								</MenuList>
							</MenuPopover>
						</Menu>
					) : (
						<Tooltip content={t('MSVE_SPA/Common/SignIn')} relationship="label">
							<Button
								icon={<PersonArrowRight24Regular />}
								appearance="subtle"
								onClick={() => {
									window.location.href = '/SignIn?returnUrl=/';
								}}
							>
								{t('MSVE_SPA/Common/SignIn')}
							</Button>
						</Tooltip>
					)}

					<button
						className={styles.mobileMenuBtn}
						onClick={() => setMobileOpen(!mobileOpen)}
						aria-label={mobileOpen ? t('MSVE_SPA/Nav/CloseMenu') : t('MSVE_SPA/Nav/OpenMenu')}
						aria-expanded={mobileOpen}
					>
						{mobileOpen ? <Dismiss24Regular /> : <Navigation24Regular />}
					</button>
				</div>
			</header>

			{mobileOpen && (
				<nav className={styles.mobileNav}>
					{visibleItems.map((item) => (
						<div
							key={item.path}
							className={`${styles.mobileNavLink} ${isActive(item.path, item.activePaths) ? styles.mobileNavLinkActive : ''}`}
							onClick={() => {
								navigate(item.path);
								setMobileOpen(false);
							}}
							role="link"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									navigate(item.path);
									setMobileOpen(false);
								}
							}}
						>
							<Text size={300}>{t(item.text)}</Text>
						</div>
					))}
					<div
						className={styles.mobileNavLink}
						onClick={() => {
							navigate('/search');
							setMobileOpen(false);
						}}
						role="link"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								navigate('/search');
								setMobileOpen(false);
							}
						}}
					>
						<Text size={300}>{t('MSVE_SPA/Nav/Search')}</Text>
					</div>
				</nav>
			)}

			<main id="main-content" className={styles.main}>
				<Outlet />
			</main>
		</div>
	);
};
