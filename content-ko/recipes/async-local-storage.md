### 비동기 로컬 스토리지 (Async Local Storage)

`AsyncLocalStorage`는 함수 매개변수로 명시적으로 전달할 필요 없이 애플리케이션 전체에 걸쳐 로컬 상태를 전파하는 대안적인 방법을 제공하는 [Node.js API](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage)(`async_hooks` API 기반)입니다. 이는 다른 언어의 스레드-로컬 스토리지와 유사합니다.

비동기 로컬 스토리지의 주요 아이디어는 `AsyncLocalStorage#run` 호출을 사용하여 일부 함수 호출을 _래핑_할 수 있다는 것입니다. 래핑된 호출 내에서 호출되는 모든 코드는 동일한 `store`에 접근하게 되며, 이 스토어는 각 호출 체인마다 고유합니다.

NestJS의 맥락에서 보면, 요청의 라이프사이클 내에서 요청의 나머지 코드를 래핑할 수 있는 위치를 찾으면 해당 요청에만 보이는 상태에 접근하고 수정할 수 있습니다. 이는 REQUEST-scoped 프로바이더 및 그 한계에 대한 대안으로 사용될 수 있습니다.

또는 ALS를 사용하여 시스템의 일부(예: _트랜잭션_ 객체)에 대해서만 컨텍스트를 전파하고, 서비스 간에 명시적으로 전달하지 않아도 됩니다. 이는 격리(isolation) 및 캡슐화(encapsulation)를 증가시킬 수 있습니다.

#### 사용자 정의 구현

NestJS 자체는 `AsyncLocalStorage`에 대한 내장 추상화를 제공하지 않으므로, 전체 개념을 더 잘 이해하기 위해 가장 간단한 HTTP 사례에 대해 직접 구현하는 방법을 살펴보겠습니다.

> info **정보** 바로 사용할 수 있는 [전용 패키지](recipes/async-local-storage#nestjs-cls)는 아래에서 계속 읽어보세요.

1.  먼저, 일부 공유 소스 파일에 `AsyncLocalStorage`의 새 인스턴스를 생성합니다. NestJS를 사용하고 있으므로, 사용자 정의 프로바이더를 가진 모듈로 만듭시다.

```ts
@@filename(als.module)
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
```
> info **힌트** `AsyncLocalStorage`는 `async_hooks`에서 임포트됩니다.

2.  우리는 HTTP에만 관심이 있으므로, 미들웨어를 사용하여 `AsyncLocalStorage#run`으로 `next` 함수를 래핑하겠습니다. 미들웨어는 요청이 처음 도달하는 곳이므로, 이는 모든 인핸서(enhancer) 및 시스템의 나머지 부분에서 `store`를 사용할 수 있게 합니다.

```ts
@@filename(app.module)
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule implements NestModule {
  constructor(
    // 모듈 생성자에서 AsyncLocalStorage를 주입합니다.
    private readonly als: AsyncLocalStorage
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // 미들웨어를 바인딩합니다.
    consumer
      .apply((req, res, next) => {
        // 요청을 기반으로
        // 스토어에 기본 값을 채웁니다.
        const store = {
          userId: req.headers['x-user-id'],
        };
        // 그리고 "next" 함수를 콜백으로
        // 스토어와 함께 "als.run" 메서드에 전달합니다.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
@@switch
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
@Dependencies(AsyncLocalStorage)
export class AppModule {
  constructor(als) {
    // 모듈 생성자에서 AsyncLocalStorage를 주입합니다.
    this.als = als
  }

  configure(consumer) {
    // 미들웨어를 바인딩합니다.
    consumer
      .apply((req, res, next) => {
        // 요청을 기반으로
        // 스토어에 기본 값을 채웁니다.
        const store = {
          userId: req.headers['x-user-id'],
        };
        // 그리고 "next" 함수를 콜백으로
        // 스토어와 함께 "als.run" 메서드에 전달합니다.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
```

3.  이제 요청의 라이프사이클 내 어디에서든 로컬 스토어 인스턴스에 접근할 수 있습니다.

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    // 제공된 ALS 인스턴스를 주입할 수 있습니다.
    private readonly als: AsyncLocalStorage,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // "getStore" 메서드는 항상
    // 주어진 요청과 연결된 스토어 인스턴스를 반환합니다.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(als, catsRepository) {
    // 제공된 ALS 인스턴스를 주입할 수 있습니다.
    this.als = als
    this.catsRepository = catsRepository
  }

  getCatForUser() {
    // "getStore" 메서드는 항상
    // 주어진 요청과 연결된 스토어 인스턴스를 반환합니다.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
```

4.  이것으로 끝입니다. 이제 전체 `REQUEST` 객체를 주입할 필요 없이 요청 관련 상태를 공유할 수 있는 방법이 생겼습니다.

> warning **경고** 이 기법은 많은 사용 사례에 유용하지만, 본질적으로 코드 흐름을 모호하게 만들고(암묵적인 컨텍스트 생성), 따라서 책임감 있게 사용하고 특히 컨텍스트적인 "[신 객체](https://en.wikipedia.org/wiki/God_object)" 생성을 피하도록 주의하십시오.

### NestJS CLS

[nestjs-cls](https://github.com/Papooch/nestjs-cls) 패키지는 일반 `AsyncLocalStorage` 사용에 비해 몇 가지 개발 경험(DX) 개선 사항을 제공합니다(`CLS`는 _continuation-local storage_의 약어입니다). 이는 구현을 `ClsModule`로 추상화하여 다양한 전송(HTTP뿐만 아니라)에 대한 `store` 초기화의 다양한 방법을 제공하며, 강력한 타입 지원도 제공합니다.

그런 다음 스토어는 주입 가능한 `ClsService`를 사용하여 접근하거나, [프록시 프로바이더](https://www.npmjs.com/package/nestjs-cls#proxy-providers)를 사용하여 비즈니스 로직에서 완전히 추상화할 수 있습니다.

> info **정보** `nestjs-cls`는 타사 패키지이며 NestJS 코어 팀에서 관리하지 않습니다. 라이브러리에서 발견된 모든 문제는 [해당 저장소](https://github.com/Papooch/nestjs-cls/issues)에 보고해 주십시오.

#### 설치

`@nestjs` 라이브러리의 피어 종속성 외에는 내장 Node.js API만 사용합니다. 다른 패키지처럼 설치하십시오.

```bash
npm i nestjs-cls
```

#### 사용법

[위](recipes/async-local-storage#custom-implementation)에서 설명된 것과 유사한 기능은 다음과 같이 `nestjs-cls`를 사용하여 구현할 수 있습니다.

1.  루트 모듈에 `ClsModule`을 임포트합니다.

```ts
@@filename(app.module)
@Module({
  imports: [
    // ClsModule을 등록합니다.
    ClsModule.forRoot({
      middleware: {
        // 모든 라우트에 대해
        // ClsMiddleware를 자동으로 마운트하고
        mount: true,
        // setup 메서드를 사용하여
        // 기본 스토어 값을 제공합니다.
        setup: (cls, req) => {
          cls.set('userId', req.headers['x-user-id']);
        },
      },
    }),
  ],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule {}
```

2.  그리고 `ClsService`를 사용하여 스토어 값에 접근할 수 있습니다.

```ts
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    // 제공된 ClsService 인스턴스를 주입할 수 있으며,
    private readonly cls: ClsService,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // "get" 메서드를 사용하여 저장된 값을 검색할 수 있습니다.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
@@switch
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(cls, catsRepository) {
    // 제공된 ClsService 인스턴스를 주입할 수 있으며,
    this.cls = cls
    this.catsRepository = catsRepository
  }

  getCatForUser() {
    // "get" 메서드를 사용하여 저장된 값을 검색할 수 있습니다.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
```

3.  `ClsService`로 관리되는 스토어 값에 대한 강력한 타입 지정(그리고 문자열 키에 대한 자동 완성)을 얻으려면, 주입 시 선택적 타입 매개변수인 `ClsService<MyClsStore>`를 사용할 수 있습니다.

```ts
export interface MyClsStore extends ClsStore {
  userId: number;
}
```

> info **힌트** 패키지가 요청 ID를 자동으로 생성하고 나중에 `cls.getId()`로 접근하거나, `cls.get(CLS_REQ)`를 사용하여 전체 요청 객체를 얻는 것도 가능합니다.
#### 테스트

`ClsService`는 또 다른 주입 가능한 프로바이더이므로 단위 테스트에서 완전히 모킹할 수 있습니다.

하지만 특정 통합 테스트에서는 실제 `ClsService` 구현을 사용하고 싶을 수 있습니다. 이 경우 컨텍스트를 인지하는 코드 부분을 `ClsService#run` 또는 `ClsService#runWith` 호출로 래핑해야 합니다.

```ts
describe('CatsService', () => {
  let service: CatsService
  let cls: ClsService
  const mockCatsRepository = createMock<CatsRepository>()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // 대부분의 테스트 모듈은 평소처럼 설정합니다.
      providers: [
        CatsService,
        {
          provide: CatsRepository
          useValue: mockCatsRepository
        }
      ],
      imports: [
        // 스토어를 어떤 식으로든 설정하지 않고 ClsService만 제공하는
        // ClsModule의 static 버전을 임포트합니다.
        ClsModule
      ],
    }).compile()

    service = module.get(CatsService)

    // 나중에 사용하기 위해 ClsService도 검색합니다.
    cls = module.get(ClsService)
  })

  describe('getCatForUser', () => {
    it('retrieves cat based on user id', async () => {
      const expectedUserId = 42
      mocksCatsRepository.getForUser.mockImplementationOnce(
        (id) => ({ userId: id })
      )

      // `runWith` 메서드 내에서 테스트 호출을 래핑합니다.
      // 여기서 직접 만든 스토어 값을 전달할 수 있습니다.
      const cat = await cls.runWith(
        { userId: expectedUserId },
        () => service.getCatForUser()
      )

      expect(cat.userId).toEqual(expectedUserId)
    })
  })
})
```

#### 추가 정보

전체 API 문서 및 더 많은 코드 예제는 [NestJS CLS GitHub 페이지](https://github.com/Papooch/nestjs-cls)를 방문하십시오.
