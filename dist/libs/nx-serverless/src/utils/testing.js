"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = require("path");
const testing_1 = require("@angular-devkit/schematics/testing");
const testing_2 = require("@angular-devkit/architect/testing");
const core_1 = require("@angular-devkit/core");
const architect_1 = require("@angular-devkit/architect");
const testing_3 = require("@nrwl/workspace/testing");
const testRunner = new testing_1.SchematicTestRunner('@flowaccount/nx-serverless', path_1.join(__dirname, '../../collection.json'));
function runSchematic(schematicName, options, tree) {
    return testRunner.runSchematicAsync(schematicName, options, tree).toPromise();
}
exports.runSchematic = runSchematic;
function runExternalSchematic(packageName, schematicName, options, tree) {
    return testRunner
        .runExternalSchematicAsync(packageName, schematicName, options, tree)
        .toPromise();
}
exports.runExternalSchematic = runExternalSchematic;
function callRule(rule, tree) {
    return testRunner.callRule(rule, tree).toPromise();
}
exports.callRule = callRule;
function getTestArchitect() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const architectHost = new testing_2.TestingArchitectHost('/root', '/root');
        const registry = new core_1.schema.CoreSchemaRegistry();
        registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        const architect = new architect_1.Architect(architectHost, registry);
        yield architectHost.addBuilderFromPackage(path_1.join(__dirname, '../..'));
        return [architect, architectHost];
    });
}
exports.getTestArchitect = getTestArchitect;
function getMockContext() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const [architect, architectHost] = yield getTestArchitect();
        const context = new testing_3.MockBuilderContext(architect, architectHost);
        yield context.addBuilderFromPackage(path_1.join(__dirname, '../..'));
        return context;
    });
}
exports.getMockContext = getMockContext;
//# sourceMappingURL=testing.js.map