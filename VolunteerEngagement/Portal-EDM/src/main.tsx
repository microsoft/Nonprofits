import React from 'react';

import ReactDOM from 'react-dom/client';

import App from '@/App';
import { initializePortalBootstrap } from '@/bootstrap/portalBootstrap';

import { ThemeMode, getStoredThemeMode } from '@/context/themeStorage';

import './index.css';

initializePortalBootstrap();

// Apply saved theme class immediately to prevent white flash
if (getStoredThemeMode() === ThemeMode.Dark) {
	document.documentElement.classList.add('ve-dark');
}

// Inject critical layout CSS inline — index.css may be blocked by MIME type issues
// on some portal environments where the file gets served as text/plain.
const criticalStyle = document.createElement('style');
criticalStyle.textContent = `
	*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
	html,body{font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;background:white}
	html.ve-dark,html.ve-dark body{background:#292929}
	body{min-height:100vh;display:flex;flex-direction:column}
	#root{display:flex;flex-grow:1;flex-direction:column}
	#root:empty{display:none!important}
	.header,.navbar,.footer,.footer-bottom{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
	a{text-decoration:none;color:inherit}
	::-webkit-scrollbar{width:8px}
	::-webkit-scrollbar-track{background:transparent}
	::-webkit-scrollbar-thumb{background-color:rgba(0,0,0,.2);border-radius:4px}
	html.ve-dark ::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,.2)}
	:root{--focus-color:#0f6cbd;--focus-shadow:0 0 0 2px #ffffff,0 0 0 4px #0f6cbd}
	html.ve-dark{--focus-color:#479ef5;--focus-shadow:0 0 0 2px #292929,0 0 0 4px #479ef5}
	:focus-visible{outline:2px solid var(--focus-color);outline-offset:2px}
	:focus:not(:focus-visible){outline:none}
	@media(max-width:768px){h1{font-size:24px!important}}
	@media(max-width:480px){h1{font-size:20px!important}}
`;
document.head.appendChild(criticalStyle);

// Mount to the first #root (our app), then hide any other empty #root divs
// injected by Power Pages platform that cause extra page height
const appRoot = document.getElementById('root')!;
ReactDOM.createRoot(appRoot).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
