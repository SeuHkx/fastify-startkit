import path from 'path';
import { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';
import WebpackObfuscator from 'webpack-obfuscator';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

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
    plugins: [
        new CleanWebpackPlugin(),
        new WebpackObfuscator(
            {
                rotateStringArray: true,
            },
            []
        ),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'package.json', to: '../' },
                { from: 'pnpm-lock.yaml', to: '../' },
                { from: '.env.development', to: '../' },
                { from: '.env.production', to: '../' },
                { from: './dist/app.js', to: '' },
                { from: './dist/config', to: './config' },
                { from: './src/views', to: './views' },
                { from: './prisma', to: '../prisma' },
                { from: './public', to: '../public' },
                { from: './logs', to: './logs' },
            ]
        })
    ],
};

export default config;