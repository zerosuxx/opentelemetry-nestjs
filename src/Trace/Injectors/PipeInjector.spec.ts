import { Test } from '@nestjs/testing';
import { OpenTelemetryModule } from '../../OpenTelemetryModule';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Controller, Get, PipeTransform, UsePipes } from '@nestjs/common';
import { PipeInjector } from './PipeInjector';
import { PIPES_METADATA } from '@nestjs/common/constants';
import { APP_PIPE } from '@nestjs/core';
import { Tracing } from '../../Tracing';

describe('Tracing Pipe Injector Test', () => {
  const sdkModule = OpenTelemetryModule.forRoot([PipeInjector]);
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

  it(`should trace global pipe`, async function () {
    // given
    class HelloPipe implements PipeTransform {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async transform() {}
    }
    const context = await Test.createTestingModule({
      imports: [sdkModule],
      providers: [{ provide: APP_PIPE, useClass: HelloPipe }],
    }).compile();
    const app = context.createNestApplication();
    await app.init();
    const injector = app.get(PipeInjector);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const providers = injector.getProviders();

    // when
    for await (const provider of providers) {
      if (
        typeof provider.token === 'string' &&
        provider.token.includes(APP_PIPE)
      ) {
        await provider.metatype.prototype.transform(1);
      }
    }

    //then
    expect(exporterSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Pipe->Global->HelloPipe' }),
      expect.any(Object),
    );

    await app.close();
  });

  it(`should trace controller pipe`, async function () {
    // given
    class HelloPipe implements PipeTransform {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async transform() {}
    }

    @Controller('hello')
    class HelloController {
      @Get()
      @UsePipes(HelloPipe)
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async hi() {}
    }
    const context = await Test.createTestingModule({
      imports: [sdkModule],
      controllers: [HelloController],
    }).compile();
    const app = context.createNestApplication();
    const helloController = app.get(HelloController);
    await app.init();

    // when
    const pipes = Reflect.getMetadata(PIPES_METADATA, helloController.hi);
    await pipes[0].transform(1);

    //then
    expect(exporterSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Pipe->HelloController.hi.HelloPipe' }),
      expect.any(Object),
    );

    await app.close();
  });
});
