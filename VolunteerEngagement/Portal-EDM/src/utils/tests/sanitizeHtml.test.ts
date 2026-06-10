import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from '../sanitizeHtml';

function toFragment(html: string): DocumentFragment {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template.content;
}

describe('sanitizeHtml', () => {
	it('removes script elements while preserving safe text', () => {
		const result = sanitizeHtml('<p>Safe description</p><script>alert("xss")</script>');
		const fragment = toFragment(result);

		expect(fragment.querySelector('script')).toBeNull();
		expect(fragment.textContent).toContain('Safe description');
		expect(result).not.toContain('alert("xss")');
	});

	it('removes inline event handlers from otherwise allowed elements', () => {
		const result = sanitizeHtml('<p onclick="alert(1)">Clickable</p><img src=x onerror="alert(2)">');
		const fragment = toFragment(result);

		expect(fragment.querySelector('p')?.getAttribute('onclick')).toBeNull();
		expect(fragment.querySelector('img')).toBeNull();
		expect(result).not.toContain('onerror');
		expect(result).not.toContain('alert(');
	});

	it('removes javascript urls from links', () => {
		const result = sanitizeHtml('<a href="javascript:alert(1)" title="Unsafe link">Open</a>');
		const link = toFragment(result).querySelector('a');

		expect(link).not.toBeNull();
		expect(link?.getAttribute('href')).toBeNull();
		expect(link?.getAttribute('title')).toBe('Unsafe link');
		expect(link?.textContent).toBe('Open');
	});

	it('removes svg and mathml payloads', () => {
		const result = sanitizeHtml(
			'<svg><animate onbegin="alert(1)"></animate></svg><math><mi>x</mi></math><p>Safe</p>',
		);
		const fragment = toFragment(result);

		expect(fragment.querySelector('svg')).toBeNull();
		expect(fragment.querySelector('math')).toBeNull();
		expect(result).not.toContain('animate');
		expect(result).not.toContain('<mi>');
		expect(fragment.querySelector('p')?.textContent).toBe('Safe');
	});

	it('preserves basic formatted HTML used by engagement descriptions', () => {
		const result = sanitizeHtml(
			'<p><strong>Prepare meals</strong> with <em>care</em>.</p><ul><li>Pack boxes</li><li>Clean stations</li></ul>',
		);
		const fragment = toFragment(result);

		expect(fragment.querySelector('p')).not.toBeNull();
		expect(fragment.querySelector('strong')?.textContent).toBe('Prepare meals');
		expect(fragment.querySelector('em')?.textContent).toBe('care');
		expect(Array.from(fragment.querySelectorAll('li')).map((item) => item.textContent)).toEqual([
			'Pack boxes',
			'Clean stations',
		]);
	});

	it('adds noopener noreferrer to links that open a new tab', () => {
		const result = sanitizeHtml('<a href="https://example.test" target="_blank">External</a>');
		const link = toFragment(result).querySelector('a');

		expect(link?.getAttribute('href')).toBe('https://example.test');
		expect(link?.getAttribute('target')).toBe('_blank');
		expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
	});
});
