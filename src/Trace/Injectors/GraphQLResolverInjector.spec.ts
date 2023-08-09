import { Test } from '@nestjs/testing';
import { OpenTelemetryModule } from '../../OpenTelemetryModule';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Injectable } from '@nestjs/common';
import { Constants } from '../../Constants';
import { Resolver, Query, Subscription, Mutation } from '@nestjs/graphql';

describe('Tracing Decorator Injector Test', () => {
  const exporter = new NoopSpanProcessor();
  const exporterSpy = jest.spyOn(exporter, 'onStart');

  const sdkModule = OpenTelemetryModule.forRoot({
    spanProcessor: exporter,
  });

  beforeEach(() => {
    exporterSpy.mockClear();
    exporterSpy.mockReset();
  });

  it(`should trace graphql resolver provider Query method`, async () => {
    // given
    @Resolver(() => {
      /***/
    })
    class HelloService {
      @Query(() => [String], {
        nullable: false,
      })
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
      expect.objectContaining({ name: 'Resolver->HelloService.hi' }),
      expect.any(Object),
    );

    await app.close();
  });

  it(`should trace graphql resolver provider Mutation method`, async () => {
    // given
    @Resolver(() => {
      /***/
    })
    class HelloService {
      @Mutation(() => [String], {
        nullable: false,
      })
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
      expect.objectContaining({ name: 'Resolver->HelloService.hi' }),
      expect.any(Object),
    );

    await app.close();
  });
  it(`should trace graphql resolver provider Subscription method`, async () => {
    // given
    @Resolver(() => {
      /***/
    })
    class HelloService {
      @Subscription(() => [String], {
        nullable: false,
      })
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
      expect.objectContaining({ name: 'Resolver->HelloService.hi' }),
      expect.any(Object),
    );

    await app.close();
  });

  it(`should not trace already tracing prototype`, async () => {
    // given
    @Injectable()
    @Resolver()
    class HelloService {
      @Query(() => [String], {
        nullable: false,
      })
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
