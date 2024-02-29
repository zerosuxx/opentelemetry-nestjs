import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryModuleConfig } from './OpenTelemetryModuleConfig.interface';
import { OpenTelemetryModuleDefaultConfig } from './OpenTelemetryModuleDefaultConfig';

export class Tracing {
  static init(configuration: OpenTelemetryModuleConfig): void {
    const otelSDK = new NodeSDK({
      ...OpenTelemetryModuleDefaultConfig,
      ...configuration,
    });
    otelSDK.start();
  }
}
