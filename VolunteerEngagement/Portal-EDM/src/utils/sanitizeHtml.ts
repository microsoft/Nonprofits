import DOMPurify, { type Config } from 'dompurify';

const sanitizeConfig: Config = {
	ALLOWED_TAGS: [
		'a',
		'abbr',
		'b',
		'blockquote',
		'br',
		'cite',
		'code',
		'dd',
		'div',
		'dl',
		'dt',
		'em',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'hr',
		'i',
		'li',
		'ol',
		'p',
		'pre',
		's',
		'span',
		'strong',
		'sub',
		'sup',
		'table',
		'tbody',
		'td',
		'th',
		'thead',
		'tr',
		'u',
		'ul',
	],
	ALLOWED_ATTR: ['aria-label', 'colspan', 'href', 'rel', 'rowspan', 'target', 'title'],
	ALLOW_DATA_ATTR: false,
	FORBID_TAGS: ['math', 'svg'],
};

export function sanitizeHtml(html: string): string {
	const sanitized = DOMPurify.sanitize(html, sanitizeConfig);
	const template = document.createElement('template');
	template.innerHTML = sanitized;

	template.content.querySelectorAll('a[target]').forEach((link) => {
		if (link.getAttribute('target')?.toLowerCase() === '_blank') {
			link.setAttribute('rel', 'noopener noreferrer');
		}
	});

	return template.innerHTML;
}
