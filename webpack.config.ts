import nodeExternals from 'webpack-node-externals';
import WebpackObfuscator from 'webpack-obfuscator';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import {minify} from 'html-minifier-terser';
import TerserPlugin from 'terser-webpack-plugin';
import JavaScriptObfuscator from 'javascript-obfuscator';
import path from 'path';
import fs from 'fs';
// 简化 __dirname 解析：webpack.config.ts 通过 ts-node 执行时仍是 CJS 环境，可直接使用 __dirname
// 若极端场景不存在（理论上不会），回退到 process.cwd()
// @ts-ignore
const __dirnameResolved = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// 自定义插件：删除指定目录
class RemoveDirectoriesPlugin {
    apply(compiler: any) {
        compiler.hooks.done.tap('RemoveDirectoriesPlugin', () => {
            const appPublicPath = path.resolve(__dirnameResolved, 'app/public');
            const dirsToRemove = [
                path.join(appPublicPath, 'dist/src/page'),
                path.join(appPublicPath, 'dist/src/template')
            ];

            dirsToRemove.forEach(dir => {
                if (fs.existsSync(dir)) {
                    try {
                        fs.rmSync(dir, { recursive: true, force: true });
                        console.log(`已删除目录: ${dir}`);
                    } catch (error) {
                        console.error(`删除目录失败 ${dir}:`, error);
                    }
                }
            });
        });
    }
}

const config: any = {
    mode: 'production',
    entry: './dist/server.js',
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirnameResolved, 'app/bin'),
        filename: 'server.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                    },
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new WebpackObfuscator(
            {
                rotateStringArray: true,
                stringArray: true,
                stringArrayEncoding: ['rc4'],
                stringArrayThreshold: 1,
                unicodeEscapeSequence: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1,
            },
            []
        ),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'package.json', to: '../' },
                { from: 'pnpm-lock.yaml', to: '../' },
                { from: 'Dockerfile', to: '../' },
                { from: '.env.development', to: '../' },
                { from: '.env.production', to: '../' },
                // copy PM2 config file next to bin/, but our start script references bin/ecosystem.config.js
                { from: './dist/ecosystem.config.js', to: './ecosystem.config.js' },
                { from: './config', to: '../config' },
                { from: './public', to: '../public' },
                { from: './logs', to: '../logs' },
                {
                    from: './src/views',
                    to: './views',
                    transform(content, absoluteFrom) {
                        if (absoluteFrom.endsWith('.ejs')) {
                            // Guard 1: 检测 x-* 属性中直接内联大型 JSON 或 JSON.stringify，提示或阻止（STRICT_X_ATTR=1 失败构建）
                            try {
                                const html = content.toString();
                                const risky: Array<{attr: string, value: string}> = [];
                                // 提取 x-init/x-data/x-on/x-bind/x-model 等属性值（不做完美 HTML 解析，正则足够覆盖常见场景）
                                const attrRe = /\b(x-(?:init|data|on|bind|model))\s*=\s*("|')(.*?)\2/ig;
                                let m: RegExpExecArray | null;
                                while ((m = attrRe.exec(html))) {
                                    const val = m[3] || '';
                                    // 认为高风险：1) 包含 JSON.stringify 2) 明显的数组对象字面量交叉 [{ 或 {[
                                    // 3) 属性值过长（> 150 字符），通常意味着塞入了较大的数据
                                    if (/JSON\.stringify\(/.test(val) || /\[\s*\{|\{\s*\[/.test(val) || val.length > 150) {
                                        risky.push({ attr: m[1], value: val });
                                    }
                                }
                                if (risky.length) {
                                    const msg = `[x-attr-guard] 检测到潜在高风险的 x-* 属性内联数据 (${path.basename(absoluteFrom)}):\n` +
                                        risky.slice(0, 5).map((r, i) => `  ${i+1}. ${r.attr}="${r.value.slice(0, 180)}${r.value.length>180?'...':''}"`).join('\n');
                                    if (process.env.STRICT_X_ATTR === '1') {
                                        throw new Error(msg + '\n已启用 STRICT_X_ATTR=1，构建失败以避免线上回归。\n建议改为 <script type="application/json"> + 运行时解析 或 window 变量注入。');
                                    } else {
                                        console.warn(msg + '\n提示：可设置 STRICT_X_ATTR=1 在 CI 中直接阻止。');
                                    }
                                }
                            } catch (scanErr) {
                                // 如果上面主动抛错，则继续抛出；否则忽略
                                if (scanErr instanceof Error && /STRICT_X_ATTR/.test(String(scanErr.message))) {
                                    throw scanErr;
                                }
                            }
                            // IMPORTANT: 生产环境中 html-minifier-terser 的 minifyJS 会尝试压缩
                            // 内联的 Alpine (x-*) 指令表达式，可能造成语法被破坏（例如添加/删除分号导致
                            // "Unexpected token ';'"），这里显式关闭 JS/CSS 压缩，仅做基础 whitespace 与注释处理。
                            // 如果后续需要进一步压缩，可针对 <script> 内容做定向处理，而不是盲目全局 minifyJS。
                            return minify(content.toString(), {
                                collapseWhitespace: true,
                                removeComments: true,
                                // 关闭以下两项以保护 x-data / x-init / x-on 等指令里的表达式
                                minifyJS: false,
                                minifyCSS: false,
                                // 保留属性引号，避免某些场景属性值被拆分
                                removeAttributeQuotes: false,
                            });
                        }
                        return content;
                    }
                },
                {
                    from: './public/dist',
                    to: '../public/dist',
                    transform(content, absoluteFrom) {
                        // 仅处理 JS；其它直接返回
                        if (!absoluteFrom.endsWith('.js')) return content;

                        const raw = content.toString();

                        // ---- 可配置开关 ----
                        // 1) 完全关闭（部署诊断时使用）: DISABLE_CLIENT_OBFUSCATION=1
                        // 2) 降级轻量模式：REDUCE_CLIENT_OBFUSCATION=1（去掉 controlFlowFlattening / stringArrayEncoding）
                        const disableAll = process.env.DISABLE_CLIENT_OBFUSCATION === '1';
                        const reduceMode = process.env.REDUCE_CLIENT_OBFUSCATION === '1';

                        // ---- 跳过名单（避免二次/破坏性处理）----
                        // - 已标记为 *.min.js 或带 runtime / vendor 特征的第三方产物
                        // - pageRuntime.* (ESBuild 已压缩)
                        // - Alpine / Handlebars runtime / axios 等外部库
                        const skipPatterns = [
                            /pageRuntime\.global\.js$/i,
                            /pageRuntime\.js$/i,
                            /\.min\.js$/i,
                            /alpinejs@/i,
                            /handlebars\.runtime/i,
                            /axios@/i,
                            /toastify-js\.js$/i,
                            /page\.js-\d+\.\d+\.\d+\//i
                        ];
                        if (skipPatterns.some(r => r.test(absoluteFrom))) {
                            console.log(`[skip-obfuscate] ${absoluteFrom}`);
                            return content;
                        }

                        if (disableAll) {
                            console.log(`[obfuscate-disabled] ${absoluteFrom}`);
                            return content; // 诊断阶段不混淆
                        }

                        // ---- 混淆策略 ----
                        // 之前使用 controlFlowFlattening + stringArrayEncoding(rc4) 可能放大已压缩代码的边缘语法风险
                        // Alpine 报 "Unexpected token ';'" 的根因之一常见是属性表达式被二次修改/插入分号。
                        // 降级模式: 只做基础压缩+局部标识符混淆；正常模式仍保留适度混淆但关闭高风险选项。
                        const baseOptions: any = reduceMode ? {
                            compact: true,
                            controlFlowFlattening: false,
                            stringArray: false,
                            stringArrayEncoding: [],
                            stringArrayThreshold: 0,
                            identifierNamesGenerator: 'hexadecimal',
                            renameGlobals: false,
                            deadCodeInjection: false,
                            selfDefending: false,
                            debugProtection: false
                        } : {
                            compact: true,
                            controlFlowFlattening: false, // 关闭：减少结构重写
                            stringArray: true,
                            stringArrayEncoding: [], // 关闭 rc4 编码，减低符号变形风险
                            stringArrayThreshold: 0.2,
                            identifierNamesGenerator: 'hexadecimal',
                            renameGlobals: false,
                            deadCodeInjection: false,
                            selfDefending: false,
                            debugProtection: false,
                            numbersToExpressions: false
                        };

                        // 可选：输出 sourceMap 以便快速定位线上问题（默认关闭）。
                        // 启用方式：OBFUSCATE_SOURCEMAP=1
                        if (process.env.OBFUSCATE_SOURCEMAP === '1') {
                            baseOptions.sourceMap = true;
                            baseOptions.sourceMapMode = 'separate';
                        }

                        try {
                            const result = JavaScriptObfuscator.obfuscate(raw, baseOptions).getObfuscatedCode();

                            // 基础健诊：若输出以分号开头且原始不以分号开头，保留原代码防止潜在属性表达式被提前分号化
                            if (/^;/.test(result) && !/^;/.test(raw)) {
                                console.warn(`[obfuscate-safety-revert] leading semicolon added, revert file: ${absoluteFrom}`);
                                return content;
                            }

                            return Buffer.from(result);
                        } catch (error) {
                            console.error(`[obfuscate-error] ${absoluteFrom}`, error);
                            // 出错回退原文，避免构建中断
                            return content;
                        }
                    }
                },
            ]
        }),
        // 添加自定义删除插件
        new RemoveDirectoriesPlugin()
    ],
};

export default config;