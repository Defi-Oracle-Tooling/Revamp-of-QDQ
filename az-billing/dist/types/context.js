"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDeploymentContext = toDeploymentContext;
function toDeploymentContext(nc) {
    if (!nc.resolvedAzure)
        throw new Error('resolvedAzure topology required for cost analysis');
    return {
        regions: nc.resolvedAzure.regions,
        placements: nc.resolvedAzure.placements,
        deploymentDefault: nc.azureDeploymentDefault,
        sizeMap: nc.azureSizeMap,
        scaleMap: nc.azureScaleMap,
        pricingRegion: nc.azurePricingRegion || 'eastus',
        currency: 'USD'
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90eXBlcy9jb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBc0JBLGtEQVdDO0FBWEQsU0FBZ0IsbUJBQW1CLENBQUMsRUFBc0I7SUFDeEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO0lBQzVGLE9BQU87UUFDTCxPQUFPLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPO1FBQ2pDLFVBQVUsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVU7UUFDdkMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLHNCQUFzQjtRQUM1QyxPQUFPLEVBQUUsRUFBRSxDQUFDLFlBQVk7UUFDeEIsUUFBUSxFQUFFLEVBQUUsQ0FBQyxhQUFhO1FBQzFCLGFBQWEsRUFBRSxFQUFFLENBQUMsa0JBQWtCLElBQUksUUFBUTtRQUNoRCxRQUFRLEVBQUUsS0FBSztLQUNoQixDQUFDO0FBQ0osQ0FBQyJ9