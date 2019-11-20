"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("../src/typescript");
describe('getTypescriptConfig', () => {
    it(`returns default typescript configuration if the one provided doesn't exist`, () => {
        expect(typescript_1.getTypescriptConfig('/ciaone/my-folder')).toEqual(typescript_1.makeDefaultTypescriptConfig());
    });
});
//# sourceMappingURL=typescript.getTypescriptConfig.test.js.map