import { Test } from '@nestjs/testing';
import { OpenTelemetryModule } from '../../OpenTelemetryModule';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Controller, Get, Injectable } from '@nestjs/common';
import { Span } from '../Decorators/Span';
import * as request from 'supertest';
import { Constants } from '../../Constants';
import { Tracing } from '../../Tracing';

describe('Tracing Decorator Injector Test', () => {
  const sdkModule = OpenTelemetryModule.forRoot();
  let exporterSpy: jest.SpyInstance;
  const exporter = new NoopSpanProcessor();
  Tracing.init({ serviceName: 'a', spanProcessors: [exporter] });

  beforeEach(() => {
    exporterSpy = jest.spyOn(exporter, 'onStart');
  });

  afterEach(() => {
    exporterSpy.mockClear();
    exporterSpy.mockReset();
  });

  it(`should trace decorated provider method`, async () => {
    // given
    @Injectable()
    class HelloService {
      @Span()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      hi() {}
    }
    const context = await Test.createTestingModule({
      imports: [sdkModule],
      providers: [HelloService],
    }).compile();
    const app = context.createNestApplication();
    const helloService = app.get(HelloService);

    // when
    helloService.hi();

    //then
    expect(exporterSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Provider->HelloService.hi' }),
      expect.any(Object),
    );

    await app.close();
  });

  it(`should trace decorated controller method`, async () => {
    // given
    @Controller('hello')
    class HelloController {
      @Span()
      @Get()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      hi() {}
    }
    const context = await Test.createTestingModule({
      imports: [sdkModule],
      controllers: [HelloController],
    }).compile();
    const app = context.createNestApplication();
    await app.init();

    // when
    await request(app.getHttpServer()).get('/hello').send().expect(200);

    //then
    expect(exporterSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Controller->HelloController.hi' }),
      expect.any(Object),
    );

    await app.close();
  });

  it(`should trace decorated controller method with custom trace name`, async () => {
    // given
    @Controller('hello')
    class HelloController {
      @Span('MAVI_VATAN')
      @Get()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      hi() {}
    }
    const context = await Test.createTestingModule({
      imports: [sdkModule],
      controllers: [HelloController],
    }).compile();
    const app = context.createNestApplication();
    await app.init();

    // when
    await request(app.getHttpServer()).get('/hello').send().expect(200);

    //then
    expect(exporterSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Controller->HelloController.MAVI_VATAN',
      }),
      expect.any(Object),
    );

    await app.close();
  });

  it(`should not trace already tracing prototype`, async () => {
    // given
    @Injectable()
    class HelloService {
      @Span()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      hi() {}
    }
    Reflect.defineMetadata(
      Constants.TRACE_METADATA_ACTIVE,
      1,
      HelloService.prototype.hi,
    );

    const context = await Test.createTestingModule({
      imports: [sdkModule],
      providers: [HelloService],
    }).compile();
    const app = context.createNestApplication();
    const helloService = app.get(HelloService);

    // when
    helloService.hi();

    //then
    expect(exporterSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Provider->HelloService.hi' }),
      expect.any(Object),
    );

    await app.close();
  });
});
