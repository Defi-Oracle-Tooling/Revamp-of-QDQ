"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCostAnalysis = runCostAnalysis;
__exportStar(require("./types/context"), exports);
__exportStar(require("./costing/costingEngine"), exports);
__exportStar(require("./keyvault/secrets"), exports);
__exportStar(require("./pricing/azurePricingClient"), exports);
__exportStar(require("./quota/quotaClient"), exports);
// High-level convenience API
const costingEngine_1 = require("./costing/costingEngine");
const context_1 = require("./types/context");
async function runCostAnalysis(ctx, options = {}) {
    const deployment = (0, context_1.toDeploymentContext)(ctx);
    const engine = new costingEngine_1.CostingEngine(options);
    return engine.analyzeCosts(deployment);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQVdBLDBDQUlDO0FBZkQsa0RBQWdDO0FBQ2hDLDBEQUF3QztBQUN4QyxxREFBbUM7QUFDbkMsK0RBQTZDO0FBQzdDLHNEQUFvQztBQUVwQyw2QkFBNkI7QUFDN0IsMkRBQXdEO0FBQ3hELDZDQUFzRDtBQUcvQyxLQUFLLFVBQVUsZUFBZSxDQUFDLEdBQXVCLEVBQUUsVUFBZSxFQUFFO0lBQzlFLE1BQU0sVUFBVSxHQUFHLElBQUEsNkJBQW1CLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUMsTUFBTSxNQUFNLEdBQUcsSUFBSSw2QkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLE9BQU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6QyxDQUFDIn0=