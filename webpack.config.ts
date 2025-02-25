import {Configuration} from 'webpack';
import nodeExternals from 'webpack-node-externals';
import WebpackObfuscator from 'webpack-obfuscator';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import {minify} from 'html-minifier-terser';
import TerserPlugin from 'terser-webpack-plugin';
import JavaScriptObfuscator from 'javascript-obfuscator';
import {execSync} from 'child_process';
import path from 'path';

function terserMinifySync(code: string): string {
    try {
        return execSync(`npx terser --compress --mangle`, {
            input: code,
            encoding: 'utf8'
        }).toString();
    } catch (error) {
        console.error('Terser minification error:', error);
        return code;
    }
}

const config: Configuration = {
    mode: 'production',
    entry: './dist/server.js',
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, 'app/bin'),
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
                        drop_console: true, // 移除 console.log
                        drop_debugger: true, // 移除 debugger
                    },
                    format: {
                        comments: false, // 移除注释
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
                { from: '.env.development', to: '../' },
                { from: '.env.production', to: '../' },
                { from: './dist/ecosystem.config.js', to: '' },
                { from: './config', to: '../config' },
                { from: './prisma', to: '../prisma' },
                { from: './public', to: '../public' },
                { from: './logs', to: '../logs' },
                {
                    from: './src/views',
                    to: './views',
                    transform(content, absoluteFrom) {
                        if (absoluteFrom.endsWith('.ejs')) {
                            return minify(content.toString(), {
                                collapseWhitespace: true,
                                removeComments: true,
                                minifyJS: true,
                                minifyCSS: true,
                            });
                        }
                        return content;
                    }
                },
                {
                    from: './public/dist',
                    to: '../public/dist',
                    transform(content, absoluteFrom) {
                        if (absoluteFrom.endsWith('.js')) {
                            try {
                                const minifiedCode = terserMinifySync(content.toString());
                                return JavaScriptObfuscator.obfuscate(minifiedCode, {
                                    compact: true,
                                    controlFlowFlattening: true,
                                    numbersToExpressions: true,
                                    stringArrayEncoding: ['rc4'],
                                    stringArrayThreshold: 1,
                                }).getObfuscatedCode();
                            } catch (error) {
                                console.error(`Error minifying ${absoluteFrom}:`, error);
                                return content;
                            }
                        }
                        return content;
                    }
                },
            ]
        })
    ],
};

export default config;