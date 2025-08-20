import { NodeSDK } from '@opentelemetry/sdk-node';
import { TracingConfig } from './TracingConfig.interface';
import {
  NodeAutoInstrumentationsDefaultConfig,
  TracingDefaultConfig,
} from './TracingConfigDefault';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export class Tracing {
  static init(
    configuration: TracingConfig,
    loadAutoInstrumentations = true,
  ): void {
    const instrumentations = loadAutoInstrumentations
      ? getNodeAutoInstrumentations(NodeAutoInstrumentationsDefaultConfig)
      : [];
    const otelSDK = new NodeSDK({
      ...TracingDefaultConfig,
      instrumentations,
      ...configuration,
    });
    otelSDK.start();
  }
}
