(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define("axolotlCryptoCurve25519", [], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.axolotlCryptoCurve25519 = factory();
    }
}(this, function() {