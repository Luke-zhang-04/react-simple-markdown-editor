export default {
    presets: ["@babel/preset-env"],
    minified: false,
    shouldPrintComment: (val) => (
        (/@/u).test(val) && !((/eslint|istanbul/u).test(val))
    ),
    comments: true,
}
