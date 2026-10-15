import { chmod, lstat, mkdtemp, open, readFile, realpath, rename, rm } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { GuidanceError } from './errors.js';

export class LocalFileError extends GuidanceError {
	constructor(message = 'A local file operation was refused. Use an output folder outside any Git repository that doesn\'t exist yet, and check folder permissions and JSON syntax.') {
		super(message);
	}
}

async function assertOutsideRepository(path: string): Promise<void> {
	let current = path;
	while (true) {
		try {
			await lstat(join(current, '.git'));
			throw new LocalFileError('The output folder is inside a Git repository, so reports could be committed by mistake. Choose a folder outside Git with --output.');
		} catch (error) {
			if (error instanceof LocalFileError) {
				throw error;
			}
			if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}
		const parent = dirname(current);
		if (parent === current) {
			return;
		}
		current = parent;
	}
}

export async function readLocalJson(path: string): Promise<unknown> {
	try {
		const stat = await lstat(path);
		if (!stat.isFile() || stat.size > 10 * 1024 * 1024) {
			throw new LocalFileError();
		}
		return JSON.parse(await readFile(path, 'utf8')) as unknown;
	} catch {
		throw new LocalFileError();
	}
}

export async function writeLocalBundle(path: string, files: Record<string, string>): Promise<string> {
	let temporary: string | undefined;
	try {
		if (!isAbsolute(path) || path.startsWith('\\\\') || path.startsWith('//')) {
			throw new LocalFileError();
		}
		const destination = resolve(path);
		const parent = await realpath(dirname(destination));
		await assertOutsideRepository(parent);
		for (const name of Object.keys(files)) {
			if (!/^[a-zA-Z0-9._-]+$/.test(name) || name === '.' || name === '..') {
				throw new LocalFileError();
			}
		}

		const actual = join(parent, basename(destination));
		try {
			await lstat(actual);
			throw new LocalFileError('The output folder already exists. Choose a new folder name.');
		} catch (error) {
			if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}

		temporary = await mkdtemp(join(parent, `.${basename(destination)}-`));
		await chmod(temporary, 0o700);
		for (const [name, content] of Object.entries(files)) {
			const file = await open(join(temporary, name), 'wx', 0o600);
			try {
				await file.writeFile(content, 'utf8');
			} finally {
				await file.close();
			}
		}
		await rename(temporary, actual);
		temporary = undefined;
		return actual;
	} catch (error) {
		if (temporary) {
			await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
		}
		throw error instanceof LocalFileError ? error : new LocalFileError();
	}
}

export async function writeLocalFile(path: string, content: string): Promise<string> {
	let temporary: string | undefined;
	try {
		if (!isAbsolute(path) || path.startsWith('\\\\') || path.startsWith('//')) {
			throw new LocalFileError();
		}
		const destination = resolve(path);
		const parent = await realpath(dirname(destination));
		await assertOutsideRepository(parent);
		const name = basename(destination);
		if (!/^[a-zA-Z0-9._-]+\.(md|json)$/.test(name)) {
			throw new LocalFileError();
		}
		try {
			await lstat(destination);
			throw new LocalFileError('The report file already exists. Choose another output folder.');
		} catch (error) {
			if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
				throw error;
			}
		}
		temporary = join(parent, `.${name}.${process.pid}.${Date.now()}`);
		const file = await open(temporary, 'wx', 0o600);
		try {
			await file.writeFile(content, 'utf8');
		} finally {
			await file.close();
		}
		await rename(temporary, destination);
		temporary = undefined;
		return destination;
	} catch (error) {
		if (temporary) {
			await rm(temporary, { force: true }).catch(() => undefined);
		}
		throw error instanceof LocalFileError ? error : new LocalFileError();
	}
}
