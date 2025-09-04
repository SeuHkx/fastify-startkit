// Handlebars templates + per-page scripts builder (TypeScript)
// Build all client/views into:
// - public/dist/src/template/{page}/index.js (precompiled Handlebars, ESM)
// - public/dist/src/page/{page}/index.js (page scripts, ESM)
// - public/dist/src/lib/pageRuntime.{js,global.js} (aggregated runtime, ESM + IIFE)

import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import chokidar from 'chokidar';
import Handlebars from 'handlebars';
import { minify as terserMinify } from 'terser';
import * as esbuild from 'esbuild';

const fsp = fs.promises;
const ROOT = process.cwd();
const SRC_DIR = path.resolve(ROOT, 'client/views');
const SERVER_VIEWS_DIR = path.resolve(ROOT, 'src/views');
const OUT_TPL_DIR = path.resolve(ROOT, 'public/dist/src/template');
const OUT_PAGE_DIR = path.resolve(ROOT, 'public/dist/src/page');
const OUT_LIB_DIR = path.resolve(ROOT, 'public/dist/src/lib');

// --- Lightweight SSE hot-reload (dev only) ---
type HotBroadcaster = { broadcast: (event: string, data?: any) => void, url: string } | null;
let HOT: HotBroadcaster = null;

function startHotReloadServer(port = Number(process.env.HOT_PORT) || 38999) {
	const http = require('http');
	const clients: any[] = [];
	const server = http.createServer((req: any, res: any) => {
		if (req.url?.startsWith('/__hot')) {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache, no-transform',
				Connection: 'keep-alive',
				'Access-Control-Allow-Origin': '*',
			});
			res.write(`retry: 1000\n\n`);
			clients.push(res);
			req.on('close', () => {
				const i = clients.indexOf(res);
				if (i >= 0) clients.splice(i, 1);
			});
			return;
		}
		res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
		res.end();
	});
	server.listen(port, '0.0.0.0');
	const broadcast = (event: string, data?: any) => {
		const payload = typeof data === 'string' ? data : JSON.stringify(data ?? {});
		clients.forEach((res) => {
			try { res.write(`event: ${event}\n` + `data: ${payload}\n\n`); } catch {}
		});
	};
	HOT = { broadcast, url: `http://localhost:${port}/__hot` };
	console.log(`[hot] SSE listening at ${HOT.url}`);
}

async function ensureDir(dir: string) { await fsp.mkdir(dir, { recursive: true }); }
async function pathExists(p: string) { try { await fsp.access(p); return true; } catch { return false; } }

function toRelName(absPath: string) {
	const rel = path.relative(SRC_DIR, absPath).replace(/\\/g, '/');
	return rel.replace(/\.hbs$/, '');
}

async function compileHbs(absPath: string) {
	try {
		const name = toRelName(absPath);
		const dirKey = name.split('/').slice(0, -1).join('/');
		const src = await fsp.readFile(absPath, 'utf8');
		const precompiled = Handlebars.precompile(src);
		const outDir = path.join(OUT_TPL_DIR, dirKey);
		await ensureDir(outDir);
		const outFile = path.join(outDir, 'index.js');
		const wrapper = `/* auto-generated from ${path.relative(ROOT, absPath).replace(/\\/g,'/')} */\n// ESM template module\nconst H = typeof window!== 'undefined' ? window.Handlebars : undefined;\nconst tpl = (H && H.template) ? H.template(${precompiled}) : (()=>{ throw new Error('Handlebars runtime not found'); })();\nexport default tpl;`;
		const minified = await terserMinify(wrapper, { module: true, compress: true, mangle: true });
		await fsp.writeFile(outFile, minified.code || wrapper, 'utf8');
		console.log('[hbs] Compiled:', `${name} -> ${path.posix.join(dirKey, 'index.js')}`);
	// broadcast per-page template hot update
	HOT?.broadcast('hot', { t: Date.now(), pageId: dirKey, kind: 'template' });
	} catch (err) { console.error('[hbs] Compile error:', absPath, err); }
}

async function removeHbs(absPath: string) {
	const name = toRelName(absPath);
	const dirKey = path.posix.dirname(name);
	const outFile = path.join(OUT_TPL_DIR, dirKey, 'index.js');
	try { await fsp.unlink(outFile); console.log('[hbs] Removed:', path.relative(OUT_TPL_DIR, outFile)); } catch {}
}

function detectPageIdFromScript(absPath: string) {
	const rel = path.relative(SRC_DIR, absPath).replace(/\\/g, '/');
	const idx = rel.lastIndexOf('/');
	return idx >= 0 ? rel.substring(0, idx) : '.';
}

async function buildOnePageScript(absPath: string) {
	const pageRel = detectPageIdFromScript(absPath);
	const outDir = path.join(OUT_PAGE_DIR, pageRel);
	const outFile = path.join(outDir, 'index.js');
	await ensureDir(outDir);
	try {
		await esbuild.build({
			entryPoints: [absPath],
			outfile: outFile,
			bundle: true,
			platform: 'browser',
			target: ['es2017'],
			format: 'esm',
			minify: true,
			banner: { js: `/* ${path.relative(ROOT, absPath).replace(/\\/g,'/')} */` },
		});
		console.log('[hbs] Built script:', `${path.relative(SRC_DIR, absPath)} -> ${path.relative(OUT_PAGE_DIR, outFile)}`);
	// broadcast per-page script hot update
	HOT?.broadcast('hot', { t: Date.now(), pageId: pageRel, kind: 'script' });
	} catch (e) { console.error('[hbs] Script build failed:', absPath, e); }
}

async function findEntryForPage(pageRel: string): Promise<string | null> {
	const pageDir = path.join(SRC_DIR, pageRel);
	try { const stat = await fsp.stat(pageDir); if (!stat.isDirectory()) return null; } catch { return null; }
	const files = await fsp.readdir(pageDir);
	const prefers = ['index.ts','index.js','script.ts','script.js'];
	for (const p of prefers) if (files.includes(p)) return path.join(pageDir, p);
	const ts = files.filter(f => /\.ts$/.test(f)).sort();
	const js = files.filter(f => /\.js$/.test(f)).sort();
	if (ts.length) return path.join(pageDir, ts[0]);
	if (js.length) return path.join(pageDir, js[0]);
	return null;
}

async function rebuildPageScriptFor(pageRel: string) {
	const entry = await findEntryForPage(pageRel);
	if (entry) await buildOnePageScript(entry);
	else {
		const outFile = path.join(OUT_PAGE_DIR, pageRel, 'index.js');
		try { await fsp.unlink(outFile); console.log('[hbs] Removed script (no entry):', path.relative(OUT_PAGE_DIR, outFile)); } catch {}
	}
}

function toRelImport(fromAbsDir: string, toAbsFile: string) {
	let rel = path.relative(fromAbsDir, toAbsFile).replace(/\\/g, '/');
	if (!rel.startsWith('.')) rel = './' + rel;
	return rel;
}

async function collectBuiltPages() {
	const tplFiles = await glob('**/index.js', { cwd: OUT_TPL_DIR, absolute: true });
	const pages: Array<{ id: string; tplFile: string; scriptFile: string | null }> = [];
	for (const abs of tplFiles) {
		const rel = path.relative(OUT_TPL_DIR, abs).replace(/\\/g, '/');
		const id = rel.replace(/\/index\.js$/, '');
		const cand1 = path.join(OUT_PAGE_DIR, `${id}.js`);
		const cand2 = path.join(OUT_PAGE_DIR, id, 'index.js');
		let scriptFile: string | null = null;
		if (await pathExists(cand1)) scriptFile = cand1; else if (await pathExists(cand2)) scriptFile = cand2;
		pages.push({ id, tplFile: abs, scriptFile });
	}
	return pages;
}

async function buildRuntimeBundle() {
	try {
		await ensureDir(OUT_LIB_DIR);
		const pages = await collectBuiltPages();
		const tmpDir = path.join(ROOT, '.tmp');
		await ensureDir(tmpDir);
		const tmpEntry = path.join(tmpDir, 'runtime-entry.ts');

		const importLines: string[] = [];
		const registryLines: string[] = [];
		pages.forEach((p, idx) => {
			const tplVar = `tpl_${idx}`;
			const scriptVar = `page_${idx}`;
			importLines.push(`import ${tplVar} from '${toRelImport(path.dirname(tmpEntry), p.tplFile)}';`);
			if (p.scriptFile) {
				importLines.push(`import * as ${scriptVar} from '${toRelImport(path.dirname(tmpEntry), p.scriptFile)}';`);
				registryLines.push(`  '${p.id}': { template: ${tplVar}, script: ${scriptVar} }`);
			} else {
				registryLines.push(`  '${p.id}': { template: ${tplVar} }`);
			}
		});

			const src = `/* auto-generated runtime bundle */\n${importLines.join('\n')}\n\nconst REGISTRY: any = {\n${registryLines.join(',\n')}\n};\n\nexport function assetVersion(){ return (window as any).__assetVersion__ || Date.now(); }\n\nexport async function importWithVersion(src: string, _ver?: any){ return import(src); }\n\n// runtime config (root resolver etc.)\nconst CONFIG: any = (window as any).__PageRuntimeConfig || {};\nexport function configure(cfg: any){ Object.assign(CONFIG, cfg || {}); (window as any).__PageRuntimeConfig = CONFIG; }\nexport function getConfig(){ return CONFIG; }\n\n// hot api: get, set and rerender
		export function __hotGet(name: string){ return REGISTRY[name]; }
		export function __hotSet(name: string, entry: any){ REGISTRY[name] = entry; }

// 兼容旧接口：页面脚本与模板已内联\nexport async function loadPageScript(_name: string, _importer?: any){ return true as any; }\nexport async function loadTemplate(name: string, _importer?: any){\n  const entry = REGISTRY[name];\n  if (!entry || !entry.template) throw new Error('模板未注册: ' + name);\n  return entry.template;\n}\n\nexport async function loadOrReplaceScript(key: string, src: string, _ver?: any){\n  const id = 'dyn-' + key;\n  const exists = document.getElementById(id);\n  const s = document.createElement('script');\n  s.type = 'module';\n  s.id = id;\n  s.src = src;\n  if (exists && exists.parentNode) exists.parentNode.replaceChild(s, exists);\n  else document.head.appendChild(s);\n  return new Promise((resolve, reject) => { s.onload = () => resolve(true as any); s.onerror = reject; });\n}\n\nfunction nextTick(fn: () => void){\n  if (typeof (window as any).queueMicrotask === 'function') return (window as any).queueMicrotask(fn);\n  try { Promise.resolve().then(fn); } catch { setTimeout(fn, 0); }\n}\n\nfunction getCurrentPageId(){\n  try{ const el = document.querySelector('[data-current-page]'); if (el) return (el as any).getAttribute('data-current-page'); }catch{}\n  try{ return (window as any).__currentPageId; }catch{}\n  return null;\n}\n\nfunction selectEl(sel: any): any {\n  if (!sel) return null;\n  if (typeof sel === 'string') { try { return document.querySelector(sel); } catch { return null; } }\n  if (typeof sel === 'function') { try { return sel(); } catch { return null; } }\n  if (sel && typeof sel === 'object' && (sel as any).nodeType === 1) return sel;\n  return null;\n}\n\nfunction resolveRoot(pageId?: string){\n  try{\n    const cfg = CONFIG || {};\n    if (typeof cfg.getRoot === 'function'){\n      try { const el = cfg.getRoot(pageId); if (el) return el; } catch {}\n    }\n    if (cfg.rootSelector){\n      const el = selectEl(cfg.rootSelector); if (el) return el;\n    }\n    const mark = document.querySelector('[data-page-root]');\n    if (mark) return mark;\n    const el2 = document.getElementById('page-content'); // backward compat\n    if (el2) return el2;\n    return document.body || (document as any);\n  } catch { return document.body || (document as any); }\n}\n\nfunction rerenderPage(pageId: string){\n\ttry{\n\t\tconst entry = REGISTRY[pageId];\n\t\tif (!entry || !entry.template) return false;\n\t\tconst root = resolveRoot(pageId);\n\t\tif (!root) return false;\n\t\t(root as any).innerHTML = entry.template({});\n\t\ttry { (window as any).PageRuntime?.runPage(pageId, (window as any).Alpine, root); } catch {}\n\t\treturn true;\n\t}catch(e){ console.warn('[hot] rerender failed', pageId, e); return false; }\n}\nexport function __hotRerender(pageId: string){ return rerenderPage(pageId); }\n\nexport async function loadPageContent(pageId: string, _importer?: any){\n  const entry = REGISTRY[pageId];\n  if (!entry || !entry.template) throw new Error('模板未注册: ' + pageId);\n  const html = entry.template({});\n  nextTick(() => {\n    try {\n      const root = resolveRoot(pageId) || document;\n      runPage(pageId, (window as any).Alpine, root as any);\n      (window as any).__currentPageId = pageId;\n    } catch (e) { console.warn('运行页面脚本失败:', e); }\n  });\n  return html;\n}\n\nexport function runPage(pageId: string, Alpine: any, root: any){\n  const entry = REGISTRY[pageId] || {};\n  if (entry.script && typeof entry.script.register === 'function') {\n    try { entry.script.register(Alpine, root); } catch (e) { console.warn('register 执行失败', pageId, e); }\n    return;\n  }\n  const legacy = (window as any).PageScripts && (window as any).PageScripts[pageId];\n  if (typeof legacy === 'function') {\n    try { legacy(Alpine, root); } catch (e) { console.warn('legacy 脚本执行失败', pageId, e); }\n  }\n}\n`;

		await fsp.writeFile(tmpEntry, src, 'utf8');

			await esbuild.build({ entryPoints: [tmpEntry], bundle: true, format: 'esm', minify: true, platform: 'browser', target: ['es2017'], outfile: path.join(OUT_LIB_DIR, 'pageRuntime.js'), banner: { js: '/* runtime bundle (minified) */' } });
				// 可选桥接源码（如果存在则并入 IIFE 运行时）
					const bridgePath = path.resolve(ROOT, 'src/public/lib/appRuntimeBridge.js');
					let bridgeFooter = '';
					let bridgeRaw: string | null = null;
				try {
						const bridgeContent = await fsp.readFile(bridgePath, 'utf8');
						bridgeRaw = bridgeContent;
						bridgeFooter = `\n/* bridge merged from ${path.relative(ROOT, bridgePath).replace(/\\\\/g,'/')} */\n` + bridgeContent + '\n';
				} catch {}

					const devFooter = HOT ? `\n/* dev live reload (SSE) */\n(function(){\n  try{\n    var port = ${Number(process.env.HOT_PORT) || 38999};\n    var host = (window.location && window.location.hostname) ? window.location.hostname : 'localhost';\n    var proto = (window.location && window.location.protocol) ? window.location.protocol : 'http:';\n    var url = proto + '//' + host + ':' + port + '/__hot';\n    function now(){ return Date.now(); }\n    function json(e){ try { return JSON.parse(e.data||'{}'); } catch { return {}; } }\n    var es = new EventSource(url);\n    es.addEventListener('reload', function(){ try { location.reload(); } catch(e){} });\n    es.addEventListener('hot', async function(e){\n      try{\n        var msg = json(e);\n        var pid = msg.pageId;\n        var kind = msg.kind;\n        if (!pid) return;\n        var PR = (window).PageRuntime || {};\n        var reg = PR && PR.__hotGet ? PR.__hotGet(pid) : null;\n        if (!reg) return;\n        if (kind === 'template'){\n          // force fetch latest built template module via cache-busting import\n          var tplUrl = '/public/dist/src/template/' + pid + '/index.js?t=' + now();\n          var mod = await import(tplUrl);\n          if (mod && mod.default){ var entry = PR.__hotGet(pid) || {}; entry.template = mod.default; PR.__hotSet(pid, entry); }\n          // only rerender if current page matches\n          var cur = (window).__currentPageId || null;\n          if (cur === pid) PR && PR.__hotRerender && PR.__hotRerender(pid);\n        } else if (kind === 'script'){\n          // reload the page esm and rerun register, without full refresh\n          var jsCand1 = '/public/dist/src/page/' + pid + '/index.js?t=' + now();\n          var jsCand2 = '/public/dist/src/page/' + pid + '.js?t=' + now();\n          try { var m = await import(jsCand1); } catch { try { var m = await import(jsCand2); } catch(_){} }\n          if (m){ var entry2 = PR.__hotGet(pid) || {}; for (var k in entry2.script) delete entry2.script[k]; for (var k2 in m) entry2.script[k2] = m[k2]; PR.__hotSet(pid, entry2); }\n          var cur2 = (window).__currentPageId || null;\n          if (cur2 === pid) PR && PR.__hotRerender && PR.__hotRerender(pid);\n        }\n      }catch(err){ console.warn('[hot] event error', err); }\n    });\n    es.onerror = function(){ /* ignore */ };\n    console.log('[hot] connected', url);\n  }catch(e){ console.warn('[hot] disabled', e); }\n})();\n` : '';
					await esbuild.build({ 
					entryPoints: [tmpEntry], 
					bundle: true, 
					format: 'iife', 
					globalName: 'PageRuntime', 
					minify: true, 
					platform: 'browser', 
					target: ['es2017'], 
					outfile: path.join(OUT_LIB_DIR, 'pageRuntime.global.js'), 
					banner: { js: '/* runtime bundle global (minified) */' },
					footer: { js: bridgeFooter + devFooter }
				});
					// 保险：手动追加桥接源码，确保 AppRuntime 可用
					if (bridgeRaw) {
						const outIife = path.join(OUT_LIB_DIR, 'pageRuntime.global.js');
						try {
							const orig = await fsp.readFile(outIife, 'utf8');
							await fsp.writeFile(outIife, orig + '\n' + bridgeRaw + '\n', 'utf8');
							console.log('[hbs] Bridge appended into IIFE runtime');
						} catch {}
					}
	console.log('[hbs] Built runtime:', path.join(OUT_LIB_DIR, 'pageRuntime.js'));
	console.log('[hbs] Built runtime(global):', path.join(OUT_LIB_DIR, 'pageRuntime.global.js'));
	} catch (e) { console.error('[hbs] Runtime build failed:', e); }
}

async function buildPagesOnce() {
	const hbsFiles = await glob('**/*.hbs', { cwd: SRC_DIR, absolute: true });
	await Promise.all(hbsFiles.map(compileHbs));
	const pageIndexHbs = await glob('**/index.hbs', { cwd: SRC_DIR, absolute: true });
	await Promise.all(pageIndexHbs.map(async (hbsPath) => {
		const pageRel = path.relative(SRC_DIR, path.dirname(hbsPath)).replace(/\\/g, '/');
		const entry = await findEntryForPage(pageRel);
		if (entry) await buildOnePageScript(entry);
	}));
	await buildRuntimeBundle();
}

async function findNearestPageRootRel(absPath: string): Promise<string | null> {
	let dir = path.dirname(absPath);
	while (dir.startsWith(SRC_DIR)) {
		const indexHbs = path.join(dir, 'index.hbs');
		if (await pathExists(indexHbs)) return path.relative(SRC_DIR, dir).replace(/\\/g, '/');
		const parent = path.dirname(dir); if (parent === dir) break; dir = parent;
	}
	return null;
}

function onFsEvent(absPath: string) {
	if (absPath.endsWith('.hbs')) { const p = compileHbs(absPath); scheduleRuntimeBuild(); return p; }
	if (/\.(ts|js)$/.test(absPath)) { const p = findNearestPageRootRel(absPath).then((pageRel) => { if (pageRel) return rebuildPageScriptFor(pageRel); }); scheduleRuntimeBuild(); return p; }
}

function onFsUnlink(absPath: string) {
	if (absPath.endsWith('.hbs')) return removeHbs(absPath);
	if (/\.(ts|js)$/.test(absPath)) { const p = findNearestPageRootRel(absPath).then((pageRel) => { if (pageRel) return rebuildPageScriptFor(pageRel); }); scheduleRuntimeBuild(); return p; }
}

let runtimeBuildTimer: NodeJS.Timeout | null = null;
function scheduleRuntimeBuild(){ if (runtimeBuildTimer) clearTimeout(runtimeBuildTimer); runtimeBuildTimer = setTimeout(() => { buildRuntimeBundle().catch(()=>{}); }, 500); }

async function main() {
	const watch = process.argv.includes('--watch');
	console.log(`[hbs] Source: ${SRC_DIR}`);
	console.log(`[hbs] Output(templates): ${OUT_TPL_DIR}`);
	console.log(`[hbs] Output(pages): ${OUT_PAGE_DIR}`);
	console.log(`[hbs] Output(runtime): ${OUT_LIB_DIR}`);
	if (watch) {
		// start dev SSE hot reload server BEFORE initial build
		startHotReloadServer();
	}
	await buildPagesOnce();
	if (watch) {
		const watcher = chokidar.watch(SRC_DIR, { ignored: /(^|[\/\\])\../, ignoreInitial: true });
		watcher.on('add', onFsEvent);
		watcher.on('change', onFsEvent);
		watcher.on('unlink', onFsUnlink);
		// also watch server EJS views for auto refresh
		const watcherViews = chokidar.watch(SERVER_VIEWS_DIR, { ignored: /(^|[\/\\])\../, ignoreInitial: true });
		const onViewsChange = (p: string) => { console.log('[hbs] views changed:', path.relative(ROOT, p)); HOT?.broadcast('reload', { t: Date.now(), kind: 'views' }); };
		watcherViews.on('add', onViewsChange);
		watcherViews.on('change', onViewsChange);
		watcherViews.on('unlink', onViewsChange);
		console.log('[hbs] Watching for changes... (client/views + src/views)');
	}
}

main().catch((e) => { console.error('[hbs] Fatal:', e); process.exit(1); });
// - Source: client/{id}/index.hbs and {id}/script.ts|script.js

