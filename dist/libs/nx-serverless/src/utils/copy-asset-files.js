"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
function copyAssetFiles(options, context) {
    context.logger.info('Copying asset files...');
    return Promise.all(options.assetFiles.map((file) => fs_extra_1.copy(file.input, file.output)))
        .then(() => {
        context.logger.info('Done copying asset files.');
        return {
            success: true,
        };
    })
        .catch((err) => {
        return {
            error: err.message,
            success: false,
        };
    });
}
exports.default = copyAssetFiles;
//# sourceMappingURL=copy-asset-files.js.map