import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace-node';
import {
  CompositePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { InstrumentationConfigMap } from '@opentelemetry/auto-instrumentations-node';
import { containerDetector } from '@opentelemetry/resource-detector-container';
import { Span } from '@opentelemetry/api';
import { IncomingMessage } from 'http';
import { TracingConfig } from './TracingConfig.interface';

export const NodeAutoInstrumentationsDefaultConfig = <InstrumentationConfigMap>{
  '@opentelemetry/instrumentation-fs': {
    requireParentSpan: true,
    enabled: true,
    createHook: (_, { args }) => {
      return !args[0].toString().indexOf('node_modules');
    },
    endHook: (_, { args, span }) => {
      span.setAttribute('file', args[0].toString());
    },
  },
  '@opentelemetry/instrumentation-http': {
    requireParentforOutgoingSpans: true,
    requestHook: (span: Span, request: IncomingMessage) => {
      span.updateName(`${request.method} ${request.url}`);
    },
    enabled: true,
    ignoreIncomingRequestHook: (request: IncomingMessage) => {
      return (
        ['/health', '/_health', '/healthz', 'healthcheck'].includes(
          request.url,
        ) || request.method === 'OPTIONS'
      );
    },
  },
  '@opentelemetry/instrumentation-graphql': {
    enabled: true,
    mergeItems: true,
    ignoreResolveSpans: true,
    ignoreTrivialResolveSpans: true,
  },
  '@opentelemetry/instrumentation-net': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-nestjs-core': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-dns': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-express': {
    enabled: false,
  },
};

export const TracingDefaultConfig = <TracingConfig>{
  serviceName: 'UNKNOWN',
  autoDetectResources: false,
  resourceDetectors: [containerDetector],
  contextManager: new AsyncLocalStorageContextManager(),
  resource: resourceFromAttributes({
    lib: '@overbit/opentelemetry-nestjs',
  }),
  instrumentations: [],
  spanProcessors: [new NoopSpanProcessor()],
  textMapPropagator: new CompositePropagator({
    propagators: [
      new JaegerPropagator(),
      new W3CTraceContextPropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
    ],
  }),
};
