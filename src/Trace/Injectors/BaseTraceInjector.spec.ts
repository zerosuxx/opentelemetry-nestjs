import { Test } from '@nestjs/testing';
import { Tracing } from '../../Tracing';
import { OpenTelemetryModule } from '../../OpenTelemetryModule';
import {
  NoopSpanProcessor,
  Span as OtelSpan,
} from '@opentelemetry/sdk-trace-node';
import { Controller, Get, Injectable } from '@nestjs/common';
import { Span } from '../Decorators/Span';
import * as request from 'supertest';
import { ControllerInjector } from './ControllerInjector';

describe('Base Trace Injector Test', () => {
  const sdkModule = OpenTelemetryModule.forRoot([ControllerInjector]);
  let exporterSpy: jest.SpyInstance;

  beforeEach(() => {
    const exporter = new NoopSpanProcessor();
    exporterSpy = jest.spyOn(exporter, 'onStart');
    Tracing.init({ serviceName: 'a', spanProcessors: [exporter] });
  });

  afterEach(() => {
    exporterSpy.mockClear();
    exporterSpy.mockReset();
  });

  it('should create spans that inherit the ids of their parents', async () => {
    // given
    @Injectable()
    class HelloService {
      @Span()
      hello() {
        this.helloAgain();
      }
      @Span()
      helloAgain() {} // eslint-disable-line @typescript-eslint/no-empty-function
    }

    @Controller('hello')
    class HelloController {
      constructor(private service: HelloService) {}
      @Get()
      hi() {
        return this.service.hello();
      }
    }

    const context = await Test.createTestingModule({
      imports: [sdkModule],
      providers: [HelloService],
      controllers: [HelloController],
    }).compile();
    const app = context.createNestApplication();
    await app.init();

    //when
    await request(app.getHttpServer()).get('/hello').send().expect(200);

    //then
    const [[parent], [childOfParent], [childOfChild]] = exporterSpy.mock
      .calls as OtelSpan[][];
    expect(parent.parentSpanContext?.spanId).toBeUndefined();
    expect(childOfParent.parentSpanContext?.spanId).toBe(
      parent.spanContext().spanId,
    );
    expect(childOfChild.parentSpanContext?.spanId).toBe(
      childOfParent.spanContext().spanId,
    );

    await app.close();
  });
});
