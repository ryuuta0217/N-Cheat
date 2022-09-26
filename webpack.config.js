const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    entry: {
        content: path.join(__dirname, "src/content.ts"),
        popup: path.join(__dirname, "src/popup.ts")
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: ".", to: ".", context: "public" }]
        })
    ]
}