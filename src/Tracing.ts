import { NodeSDK } from '@opentelemetry/sdk-node';
import { TracingConfig } from './TracingConfig.interface';
import {
  NodeAutoInstrumentationsDefaultConfig,
  TracingDefaultConfig,
} from './TracingConfigDefault';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export class Tracing {
  static init(configuration: TracingConfig): void {
    const otelSDK = new NodeSDK({
      ...TracingDefaultConfig,
      instrumentations: getNodeAutoInstrumentations(
        NodeAutoInstrumentationsDefaultConfig,
      ),
      ...configuration,
    });
    otelSDK.start();
  }

  static initWithoutAutoInstrumentations(configuration: TracingConfig): void {
    const otelSDK = new NodeSDK({
      ...TracingDefaultConfig,
      ...configuration,
    });
    otelSDK.start();
  }
}
