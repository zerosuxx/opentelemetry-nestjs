# NestJS OpenTelemetry

<p align="center">
<a href="https://www.npmjs.com/package/@amplication/opentelemetry-nestjs"><img src="https://img.shields.io/npm/v/@amplication/opentelemetry-nestjs.svg"/> <img src="https://img.shields.io/npm/dt/@amplication/opentelemetry-nestjs.svg"/></a>
<a href="https://github.com/overbit/opentelemetry-nestjs"><img src="https://img.shields.io/npm/l/@overbit/opentelemetry-nestjs.svg"/></a>
<a href="https://github.com/overbit/opentelemetry-nestjs"><img src="https://img.shields.io/github/stars/overbit/opentelemetry-nestjs.svg"/></a>
</p>

This library, initially forked from [@overbit/opentelemetry-nestjs](https://github.com/overbit/opentelemetry-nestjs.git), provides deeply integrated protocol-agnostic Nestjs [OpenTelemetry](https://opentelemetry.io/) instrumentations, metrics and SDK.

## Description

Nestjs is a protocol-agnostic framework. That's why this library can able to work with different protocols like RabbitMQ, GRPC and HTTP. Also you can observe and trace Nestjs specific layers like [Pipe](https://docs.nestjs.com/pipes), [Guard](https://docs.nestjs.com/guards), [Controller](https://docs.nestjs.com/controllers) and [Provider](https://docs.nestjs.com/providers).

It also includes auto trace and metric instrumentations for some popular Nestjs libraries.

- ### Distributed Tracing
  - [Setup](#distributed-tracing-1)
  - [Decorators](#trace-decorators)
  - [Trace Providers](#trace-providers)
  - [Trace Not @Injectable() classes](#trace-not-injectable-classes)
  - [Auto Trace Instrumentations](#auto-trace-instrumentations)
  - [Distributed Logging with Trace ID](#distributed-logging-with-trace-id)
- ### Metrics
  - [Setup](#metrics-1)

OpenTelemetry Metrics currently experimental. So, this library doesn't support metric decorators and Auto Observers until it's stable. but if you want to use it, you can use OpenTelemetry API directly.

Competability table for Nestjs versions.

| Nestjs | Nestjs-OpenTelemetry |
| ------ | -------------------- |
| 9.x    | 3.x.x                |
| 8.x    | 2.x.x                |

## Installation

```bash
npm install @amplication/opentelemetry-nestjs --save
```

---

## Configuration

This is a basic configuration without any trace and metric exporter, but includes default metrics and injectors

```ts
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: 'nestjs-opentelemetry-example',
    }),
  ],
})
export class AppModule {}
```

Async configuration example

```ts
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    OpenTelemetryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        serviceName: configService.get('SERVICE_NAME'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Default Parameters

<table>
   <tbody>
      <tr>
         <th>key</th>
         <th>value</th>
         <th>description</th>
      </tr>
      <tr>
         <td>
            traceAutoInjectors
         </td>
         <td>ControllerInjector, GuardInjector, EventEmitterInjector, ScheduleInjector, PipeInjector, LoggerInjector</td>
         <td>default auto trace instrumentations inherited from <a href="https://github.com/open-telemetry/opentelemetry-js/blob/745bd5c34d3961dc73873190adc763747e5e026d/experimental/packages/opentelemetry-sdk-node/src/types.ts#:~:text=NodeSDKConfiguration">NodeSDKConfiguration</a> </td>
      </tr>
      <tr>
         <td> contextManager    </td>
         <td>AsyncLocalStorageContextManager
         </td>
         <td>default trace context manager inherited from <a href="https://github.com/open-telemetry/opentelemetry-js/blob/745bd5c34d3961dc73873190adc763747e5e026d/experimental/packages/opentelemetry-sdk-node/src/types.ts#:~:text=NodeSDKConfiguration"> NodeSDKConfiguration </a> 
         </td>
      </tr>
      <tr>
         <td> instrumentations  </td>
         <td>AutoInstrumentations                                                                                   </td>
         <td>
            default instrumentations inherited from defaults of<a href="https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node">@opentelemetry/auto-instrumentations-node</a> where:
            <ul>
            <li><code>@opentelemetry/instrumentation-dns</code> and <code>@opentelemetry/instrumentation-net</code> have been disabled to reduce noise</li>
            <li> <code>@opentelemetry/instrumentation-http</code> ignores common health check endpoints and creates span with name <code>"HTTP_METHOD PATH"</code> </li>
            <li><code>@opentelemetry/instrumentation-fs</code>ignores operations on files under <code>node_modules</code></li>
         </td>
      <tr>
         <td> spanProcessor     </td>
         <td>NoopSpanProcessor                                                                                      </td>
         <td>default spanProcessor inherited from <a href="https://github.com/open-telemetry/opentelemetry-js/blob/745bd5c34d3961dc73873190adc763747e5e026d/experimental/packages/opentelemetry-sdk-node/src/types.ts#:~:text=NodeSDKConfiguration"> NodeSDKConfiguration </a>  </td>
      </tr>
      <tr>
         <td> textMapPropagator </td>
         <td>JaegerPropagator, B3Propagator </td>
         <td>default textMapPropagator inherited from <a href="https://github.com/open-telemetry/opentelemetry-js/blob/745bd5c34d3961dc73873190adc763747e5e026d/experimental/packages/opentelemetry-sdk-node/src/types.ts#:~:text=NodeSDKConfiguration"> NodeSDKConfiguration </a></td>
      </tr>
</table>

`OpenTelemetryModule.forRoot()` takes [OpenTelemetryModuleConfig](https://github.com/MetinSeylan/Nestjs-OpenTelemetry/blob/main/src/OpenTelemetryModuleConfig.ts#L25) as a parameter, this type is inherited by [NodeSDKConfiguration](https://github.com/open-telemetry/opentelemetry-js/blob/745bd5c34d3961dc73873190adc763747e5e026d/experimental/packages/opentelemetry-sdk-node/src/types.ts#:~:text=NodeSDKConfiguration) so you can use same OpenTelemetry SDK parameter.

---

## Distributed Tracing

Simple setup with Zipkin exporter, including with default trace instrumentations.

```ts
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      spanProcessor: new SimpleSpanProcessor(
        new ZipkinExporter({
          url: 'your-zipkin-url',
        }),
      ),
    }),
  ],
})
export class AppModule {}
```

After setup, your application will be instrumented, so that you can see almost every layer of application in ZipkinUI, including Guards, Pipes, Controllers even global layers like this

![Example trace output](./docs/trace-flow.jpeg)

List of supported official exporters [here](https://opentelemetry.io/docs/js/exporters/).

---

### Trace Decorators

This library supports auto instrumentations for Nestjs layers, but sometimes you need to define custom span for specific method blocks like providers methods. In this case `@Traceable` and `@Span` decorators will help you.

#### `@Span`

```ts
import { Injectable } from '@nestjs/common';
import { Span } from '@amplication/opentelemetry-nestjs';

@Injectable()
export class AppService {
  @Span()
  getHello(): string {
    return 'Hello World!';
  }
}
```

Also `@Span` decorator takes `name` field as a parameter

```ts
@Span('hello')
```

#### `@Traceable`

`@Traceable` works like `@Span` but with the difference that it can be used at a class level to auto instrument every method of the class

```ts
import { Injectable } from '@nestjs/common';
import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

---

### Trace Providers

In an advanced use cases, you need to access the native OpenTelemetry Trace provider to access them from Nestjs application context.

```ts
import { Injectable } from '@nestjs/common';
import { Tracer } from '@opentelemetry/sdk-trace-base';

@Injectable()
export class AppService {
  constructor(private readonly tracer: Tracer) {}

  getHello(): string {
    const span = this.tracer.startSpan('important_section_start');
    // do something important
    span.setAttributes({ userId: 1150 });
    span.end();
    return 'Hello World!';
  }
}
```

`TraceService` can access directly current span context and start new span.

```ts
import { Injectable } from '@nestjs/common';
import { TraceService } from '@amplication/opentelemetry-nestjs';

@Injectable()
export class AppService {
  constructor(private readonly traceService: TraceService) {}

  getHello(): string {
    const span = this.traceService.startSpan('hello');
    // do something
    span.end();
    return 'Hello World!';
  }
}
```

---

### Auto Trace Instrumentations

The most helpful part of this library is that you already get all of the instrumentations by default if you set up a module without any extra configuration. If you need to avoid some of them, you can use the `traceAutoInjectors` parameter.

```ts
import { Module } from '@nestjs/common';
import {
  OpenTelemetryModule,
  ControllerInjector,
  EventEmitterInjector,
  GuardInjector,
  LoggerInjector,
  PipeInjector,
  ScheduleInjector,
} from '@amplication/opentelemetry-nestjs';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      traceAutoInjectors: [
        ControllerInjector,
        GuardInjector,
        EventEmitterInjector,
        ScheduleInjector,
        PipeInjector,
        LoggerInjector,
      ],
      spanProcessor: new SimpleSpanProcessor(
        new ZipkinExporter({
          url: 'your-zipkin-url',
        }),
      ),
    }),
  ],
})
export class AppModule {}
```

#### List of Trace Injectors

| Instance                | Description                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ControllerInjector`    | Auto trace all of module controllers                                                                                                                                                                               |
| `GuardInjector`         | Auto trace all of module guards including global guards                                                                                                                                                            |
| `PipeInjector`          | Auto trace all of module pipes including global pipes                                                                                                                                                              |
| `EventEmitterInjector`  | Auto trace for [@nestjs/event-emitter](https://docs.nestjs.com/techniques/events) library, supports all features                                                                                                   |
| `ScheduleInjector`      | Auto trace for [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) library, supports all features                                                                                               |
| `ConsoleLoggerInjector` | [ConsoleLogger](https://docs.nestjs.com/techniques/logger#extend-built-in-logger) and [Logger](https://docs.nestjs.com/techniques/logger#using-the-logger-for-application-logging) class tracer, logs with traceId |

---

#### Distributed Logging with Trace ID

When you set up your environment with the `LoggerInjector` class or default configuration, you can see trace id with every log.

![Example trace output](./docs/log.png)

---

### Trace Not @Injectable() classes

In some use cases, you need to trace instances of classes instanciated outside the NestJS DI container.
In order to do so, use the `TraceWrapper.trace()` method to wrap every method of the instance in a new span as follow

```ts
import { TraceWrapper } from '@amplication/opentelemetry-nestjs';

class MyClass {
  hello() {
    console.log('Hi');
  }

  async bye() {
    await new Promise(() => console.log('bye bye'));
  }
}

// ....
const instance = new MyClass();
const tracedInstance = TraceWrapper.trace(instance);

// ....
```

## Metrics

Simple setup with Prometheus exporter, you need install [@opentelemetry/exporter-prometheus](https://www.npmjs.com/package/@opentelemetry/exporter-prometheus)

```ts
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: 'nestjs-opentelemetry-example',
      metricReader: new PrometheusExporter({
        endpoint: 'metrics',
        port: 9464,
      }),
    }),
  ],
})
export class AppModule {}
```

Now you can access Prometheus exporter with auto collected metrics [http://localhost:9464/metrics](http://localhost:9464/metrics).
Also, you can find different exporters [here](https://opentelemetry.io/docs/js/exporters/)

---

## Examples

```ts
import { Module } from '@nestjs/common';
import type { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { CompositePropagator } from '@opentelemetry/core';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: 'myservice-opentelemetry-example',
      metricReader: new PrometheusExporter({
        endpoint: 'metrics',
        port: 9464,
      }),
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: 'your-jaeger-url',
        }),
      ),
      textMapPropagator: new CompositePropagator({
        propagators: [
          new JaegerPropagator(),
          new B3Propagator(),
          new B3Propagator({
            injectEncoding: B3InjectEncoding.MULTI_HEADER,
          }),
        ],
      }),
    }),
  ],
})
export class AppModule {}
```

### AWS XRay

For the integration with AWS X-Ray, follow the official instructions.

i.e.

```ts
import { Module } from '@nestjs/common';
import type {
  OpenTelemetryModule,
  OpenTelemetryModuleDefaultConfig,
} from '@amplication/opentelemetry-nestjs';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { CompositePropagator } from '@opentelemetry/core';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: 'myservice-opentelemetry-example',
      metricReader: new PrometheusExporter({
        endpoint: 'metrics',
        port: 9464,
      }),
      instrumentations: [
        ...OpenTelemetryModuleDefaultConfig.instrumentations,
        new AwsInstrumentation({
          suppressInternalInstrumentation: true,
          sqsExtractContextPropagationFromPayload: true,
        }),
      ],
      idGenerator: new AWSXRayIdGenerator(),
      spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
      textMapPropagator: new AWSXRayPropagator(),
    }),
  ],
})
export class AppModule {}
```
