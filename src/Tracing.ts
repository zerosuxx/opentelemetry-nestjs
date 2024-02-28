import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryModuleConfig } from './OpenTelemetryModuleConfig.interface';

export class Tracing {
  static init(configuration: OpenTelemetryModuleConfig): void {
    const otelSDK = new NodeSDK(configuration);
    otelSDK.start();
  }
}
