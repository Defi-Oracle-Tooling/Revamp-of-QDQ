export function logCompliance(event: any): void {
  console.log('Compliance event:', event);
}
export function logComplianceEvent(event: Record<string, any>): void {
  // Example: Structured compliance logging
  // In real implementation, log to file, DB, or external system
  console.log('COMPLIANCE_EVENT', event);
}
