import pino, { Logger } from 'pino';

export interface ConnectorLogContext {
  connector: string;
  operation: string;
  accountId?: string;
  referenceId?: string;
  simulation?: boolean;
  [key: string]: unknown;
}

const level = process.env.CONNECTOR_LOG_LEVEL || 'info';
export const connectorLogger: Logger = pino({ level, name: 'connectors' });

export function logConnectorError(context: ConnectorLogContext, error: unknown) {
  connectorLogger.error({ err: error instanceof Error ? { message: error.message, stack: error.stack } : error, ...context }, 'Connector error');
}

export function logSimulationFallback(context: ConnectorLogContext, reason: string) {
  connectorLogger.warn({ ...context, reason }, 'Simulation fallback');
}

export function logConnectorInfo(context: ConnectorLogContext, msg: string) {
  connectorLogger.info({ ...context }, msg);
}
