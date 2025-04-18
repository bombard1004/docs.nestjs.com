### 마이그레이션 가이드

이 문서는 NestJS 버전 10에서 버전 11로 마이그레이션하기 위한 종합 가이드를 제공합니다. v11에서 도입된 새로운 기능에 대해 알아보려면 [이 글](https://trilon.io/blog/announcing-nestjs-11-whats-new)을 살펴보세요. 업데이트에는 몇 가지 사소한 호환성 문제(breaking changes)가 포함되어 있지만 대부분의 사용자에게 영향을 미치지 않을 것입니다. 전체 변경 목록은 [여기](https://github.com/nestjs/nest/releases/tag/v11.0.0)에서 확인할 수 있습니다.

#### 패키지 업그레이드

패키지를 수동으로 업그레이드할 수도 있지만, 더 효율적인 프로세스를 위해 [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates)를 사용하는 것을 권장합니다.

#### Express v5

수년간의 개발 끝에 Express v5는 2024년에 공식 출시되었고 2025년에 안정 버전이 되었습니다. NestJS 11부터 Express v5가 프레임워크에 기본으로 통합됩니다. 이 업데이트는 대부분의 사용자에게 매끄럽게 적용되지만, Express v5가 몇 가지 호환성 문제를 도입한다는 점을 인지하는 것이 중요합니다. 자세한 지침은 [Express v5 마이그레이션 가이드](https://expressjs.com/en/guide/migrating-5.html)를 참조하십시오.

Express v5에서 가장 주목할 만한 업데이트 중 하나는 수정된 경로 라우트 매칭 알고리즘입니다. 들어오는 요청과 경로 문자열이 일치하는 방식에 다음과 같은 변경 사항이 도입되었습니다.

- 와일드카드 `*`는 이름이 있어야 하며, 매개변수의 동작과 일치합니다: `/*` 대신 `/*splat` 또는 `/{{ '{' }}*splat&#125;`을 사용하세요. `splat`은 단순히 와일드카드 매개변수의 이름이며 특별한 의미는 없습니다. 예를 들어 `*wildcard`처럼 원하는 이름으로 지정할 수 있습니다.
- 선택 문자 `?`는 더 이상 지원되지 않으며, 대신 중괄호를 사용합니다: `/:file{{ '{' }}.:ext&#125;`.
- 정규식 문자는 지원되지 않습니다.
- 업그레이드 중 혼동을 피하기 위해 일부 문자는 예약되어 있습니다 `(()[]?+!)`. 이를 이스케이프하려면 `\`를 사용하세요.
- 이제 매개변수 이름은 유효한 JavaScript 식별자를 지원하거나 `:"this"`처럼 따옴표로 묶을 수 있습니다.

따라서 이전 Express v4에서 작동했던 라우트가 Express v5에서는 작동하지 않을 수 있습니다. 예를 들어:

```typescript
@Get('users/*')
findAll() {
  // NestJS 11에서는 이 라우트가 유효한 Express v5 라우트로 자동 변환됩니다.
  // 여전히 작동할 수 있지만, Express v5에서는 이 와일드카드 구문을 더 이상 사용하지 않는 것이 좋습니다.
  return 'This route should not work in Express v5';
}
```

이 문제를 해결하려면 라우트를 명명된 와일드카드를 사용하도록 업데이트할 수 있습니다.

```typescript
@Get('users/*splat')
findAll() {
  return 'This route will work in Express v5';
}
```

> warning **경고** `*splat`은 루트 경로를 제외한 모든 경로와 일치하는 명명된 와일드카드입니다. 루트 경로(`/users`)도 일치시켜야 하는 경우, 와일드카드를 중괄호(선택적 그룹)로 묶어 `/users/{{ '{' }}*splat&#125;`을 사용할 수 있습니다. `splat`은 단순히 와일드카드 매개변수의 이름이며 특별한 의미는 없습니다. 예를 들어 `*wildcard`처럼 원하는 이름으로 지정할 수 있습니다.

마찬가지로, 모든 라우트에서 실행되는 미들웨어가 있는 경우 경로를 명명된 와일드카드를 사용하도록 업데이트해야 할 수 있습니다.

```typescript
// NestJS 11에서는 이것이 유효한 Express v5 라우트로 자동 변환됩니다.
// 여전히 작동할 수 있지만, Express v5에서는 이 와일드카드 구문을 더 이상 사용하지 않는 것이 좋습니다.
forRoutes('*'); // <-- 이것은 Express v5에서 작동하지 않아야 합니다
```

대신, 경로를 명명된 와일드카드를 사용하도록 업데이트할 수 있습니다.

```typescript
forRoutes('{*splat}'); // <-- 이것은 Express v5에서 작동할 것입니다
```

`{{ '{' }}*splat&#125;`은 루트 경로를 포함한 모든 경로와 일치하는 명명된 와일드카드입니다. 바깥 중괄호는 경로를 선택적으로 만듭니다.

#### 쿼리 매개변수 파싱

> info **참고** 이 변경 사항은 Express v5에만 적용됩니다.

Express v5에서는 기본적으로 쿼리 매개변수가 더 이상 `qs` 라이브러리를 사용하여 파싱되지 않습니다. 대신 중첩된 객체나 배열을 지원하지 않는 `simple` 파서가 사용됩니다.

결과적으로 다음과 같은 쿼리 문자열은:

```plaintext
?filter[where][name]=John&filter[where][age]=30
?item[]=1&item[]=2
```

더 이상 예상대로 파싱되지 않습니다. 이전 동작으로 되돌리려면 `query parser` 옵션을 `extended`로 설정하여 Express가 `extended` 파서(Express v4의 기본값)를 사용하도록 구성할 수 있습니다.

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // <-- <NestExpressApplication>를 사용했는지 확인하세요
  app.set('query parser', 'extended'); // <-- 이 줄을 추가하세요
  await app.listen(3000);
}
bootstrap();
```

#### Fastify v5

`@nestjs/platform-fastify` v11은 이제 마침내 Fastify v5를 지원합니다. 이 업데이트는 대부분의 사용자에게 매끄럽게 적용될 것입니다; 그러나 Fastify v5는 몇 가지 호환성 문제를 도입하지만, 이는 대부분의 NestJS 사용자에게 영향을 미칠 가능성이 낮습니다. 더 자세한 정보는 [Fastify v5 마이그레이션 가이드](https://fastify.dev/docs/v5.1.x/Guides/Migration-Guide-V5/)를 참조하십시오.

> info **힌트** Fastify v5에서는 경로 일치 방식에 변경 사항이 없습니다 (미들웨어 제외, 아래 섹션 참조). 따라서 이전과 마찬가지로 와일드카드 구문을 계속 사용할 수 있습니다. 동작은 동일하며, 와일드카드(`*` 등)로 정의된 라우트는 여전히 예상대로 작동할 것입니다.

#### Fastify CORS

기본적으로 [CORS-safelisted methods](https://fetch.spec.whatwg.org/#methods)만 허용됩니다. 추가 메서드(`PUT`, `PATCH`, `DELETE` 등)를 활성화해야 하는 경우 `methods` 옵션에 명시적으로 정의해야 합니다.

```typescript
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']; // 또는 콤마로 구분된 문자열 'GET,POST,PUT,PATH,DELETE'

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  { cors: { methods } },
);

// 또는 대안으로 `enableCors` 메서드를 사용할 수 있습니다
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
app.enableCors({ methods });
```

#### Fastify 미들웨어 등록

NestJS 11은 이제 `@nestjs/platform-fastify`의 **미들웨어 경로**와 일치시키기 위해 [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) 패키지의 최신 버전을 사용합니다. 결과적으로 모든 경로와 일치시키는 `(.*)` 구문은 더 이상 지원되지 않습니다. 대신 명명된 와일드카드를 사용해야 합니다.

예를 들어, 모든 라우트에 적용되는 미들웨어가 있는 경우:

```typescript
// NestJS 11에서는 업데이트하지 않더라도 유효한 라우트로 자동 변환됩니다.
.forRoutes('(.*)');
```

대신 명명된 와일드카드를 사용하도록 업데이트해야 합니다.

```typescript
.forRoutes('*splat');
```

여기서 `splat`은 와일드카드 매개변수에 대한 임의의 이름입니다. 원하는 이름으로 지정할 수 있습니다.

#### 모듈 해석 알고리즘

NestJS 11부터 모듈 해석 알고리즘이 개선되어 대부분의 애플리케이션에서 성능이 향상되고 메모리 사용량이 줄어들었습니다. 이 변경 사항은 수동 개입이 필요하지 않지만, 이전 버전과 동작이 다를 수 있는 일부 엣지 케이스가 있습니다.

NestJS v10 이하 버전에서는 동적 모듈에 모듈의 동적 메타데이터에서 생성된 고유한 불투명 키가 할당되었습니다. 이 키는 모듈 레지스트리에서 모듈을 식별하는 데 사용되었습니다. 예를 들어, 여러 모듈에 `TypeOrmModule.forFeature([User])`를 포함하면 NestJS는 모듈을 중복 제거하고 레지스트리에서 단일 모듈 노드로 취급했습니다. 이 프로세스는 노드 중복 제거(node deduplication)라고 알려져 있습니다.

NestJS v11 출시와 함께 더 이상 동적 모듈에 예측 가능한 해시를 생성하지 않습니다. 대신 객체 참조를 사용하여 하나의 모듈이 다른 모듈과 동등한지 판단합니다. 여러 모듈에서 동일한 동적 모듈을 공유하려면 단순히 변수에 할당하고 필요한 곳에 가져오면 됩니다. 이 새로운 접근 방식은 더 많은 유연성을 제공하고 동적 모듈이 더 효율적으로 처리되도록 보장합니다.

이 새로운 알고리즘은 동적 모듈을 많이 사용하는 경우 통합 테스트에 영향을 미칠 수 있습니다. 위에서 언급한 수동 중복 제거 없이는 `TestingModule`에 종속성의 여러 인스턴스가 있을 수 있기 때문입니다. 이로 인해 메서드를 스텁(stub)하기가 조금 더 까다로워집니다. 올바른 인스턴스를 대상으로 지정해야 하기 때문입니다. 다음 옵션 중 하나를 선택할 수 있습니다.

- 스텁하려는 동적 모듈을 중복 제거합니다.
- `module.select(ParentModule).get(Target)`를 사용하여 올바른 인스턴스를 찾습니다.
- `module.get(Target, {{ '{' }} each: true &#125;)`를 사용하여 모든 인스턴스를 스텁합니다.
- 또는 `Test.createTestingModule({{ '{' }}&#125;, {{ '{' }} moduleIdGeneratorAlgorithm: 'deep-hash' &#125;)`를 사용하여 테스트를 이전 알고리즘으로 전환합니다.

#### Reflector 타입 추론

NestJS 11은 `Reflector` 클래스에 몇 가지 개선 사항을 도입하여 기능과 메타데이터 값에 대한 타입 추론을 향상시켰습니다. 이러한 업데이트는 메타데이터 작업 시 보다 직관적이고 견고한 경험을 제공합니다.

1. `getAllAndMerge`는 메타데이터 항목이 하나뿐이고 `value`가 `object` 타입인 경우 단일 요소를 포함하는 배열 대신 객체를 반환합니다. 이 변경 사항은 객체 기반 메타데이터 처리 시 일관성을 향상시킵니다.
2. `getAllAndOverride` 반환 타입은 `T` 대신 `T | undefined`로 업데이트되었습니다. 이 업데이트는 메타데이터가 발견되지 않을 가능성을 더 잘 반영하고 정의되지 않은 경우를 적절하게 처리하도록 보장합니다.
3. `ReflectableDecorator`의 변환된 타입 인수가 모든 메서드에서 올바르게 추론됩니다.

이러한 개선 사항은 NestJS 11에서 더 나은 타입 안전성과 메타데이터 처리를 제공하여 전반적인 개발자 경험을 향상시킵니다.

#### 라이프사이클 훅 실행 순서

종료 라이프사이클 훅은 이제 초기화 훅과 역순으로 실행됩니다. 즉, `OnModuleDestroy`, `BeforeApplicationShutdown`, `OnApplicationShutdown`와 같은 훅은 이제 역순으로 실행됩니다.

다음 시나리오를 상상해 보세요.

```plaintext
// 여기서 A, B, C는 모듈이고 "->"는 모듈 종속성을 나타냅니다.
A -> B -> C
```

이 경우 `OnModuleInit` 훅은 다음 순서로 실행됩니다.

```plaintext
C -> B -> A
```

반면 `OnModuleDestroy` 훅은 역순으로 실행됩니다.

```plaintext
A -> B -> C
```

> info **힌트** 전역 모듈은 다른 모든 모듈에 의존하는 것으로 취급됩니다. 즉, 전역 모듈은 가장 먼저 초기화되고 가장 나중에 파괴됩니다.

#### 미들웨어 등록 순서

NestJS v11에서는 미들웨어 등록 동작이 업데이트되었습니다. 이전에는 미들웨어 등록 순서가 모듈 종속성 그래프의 위상 정렬에 따라 결정되었습니다. 여기서 루트 모듈로부터의 거리가 미들웨어 등록 순서를 정의했으며, 미들웨어가 전역 모듈에 등록되었는지 일반 모듈에 등록되었는지 여부와 관계없이 동일했습니다. 전역 모듈은 이러한 측면에서 일반 모듈과 유사하게 취급되었으며, 이는 특히 다른 프레임워크 기능과 비교할 때 일관성 없는 동작을 초래했습니다.

v11부터는 전역 모듈에 등록된 미들웨어가 모듈 종속성 그래프에서의 위치와 관계없이 **가장 먼저 실행**됩니다. 이 변경 사항은 전역 미들웨어가 임포트된 모듈의 미들웨어보다 항상 먼저 실행되도록 보장하여 일관되고 예측 가능한 순서를 유지합니다.

#### 캐시 모듈

`CacheModule`(`@nestjs/cache-manager` 패키지에서)은 `cache-manager` 패키지의 최신 버전을 지원하도록 업데이트되었습니다. 이 업데이트는 몇 가지 호환성 문제(breaking changes)를 가져오며, 스토리지 어댑터를 통해 여러 백엔드 스토리지에 대한 통합 인터페이스를 제공하는 [Keyv](https://keyv.org/)로 마이그레이션한 것을 포함합니다.

이전 버전과 새 버전의 주요 차이점은 외부 스토어 구성 방식에 있습니다. 이전 버전에서 Redis 스토어를 등록하려면 다음과 같이 구성했을 것입니다.

```ts
// 이전 버전 - 더 이상 지원되지 않음
CacheModule.registerAsync({
  useFactory: async () => {
    const store = await redisStore({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });

    return {
      store,
    };
  },
}),
```

새 버전에서는 `Keyv` 어댑터를 사용하여 스토어를 구성해야 합니다.

```ts
// 새 버전 - 지원됨
CacheModule.registerAsync({
  useFactory: async () => {
    return {
      stores: [
        new KeyvRedis('redis://localhost:6379'),
      ],
    };
  },
}),
```

여기서 `KeyvRedis`는 `@keyv/redis` 패키지에서 가져옵니다. 자세한 내용은 [캐싱 문서](/techniques/caching)를 참조하십시오.

> warning **경고** 이 업데이트에서 Keyv 라이브러리가 처리하는 캐시된 데이터는 이제 `value` 및 `expires` 필드를 포함하는 객체 구조로 저장됩니다. 예를 들어: `{{ '{' }}"value": "yourData", "expires": 1678901234567{{ '}' }}`입니다. Keyv는 API를 통해 데이터에 접근할 때 자동으로 `value` 필드를 검색하지만, 캐시 데이터와 직접 상호 작용하거나(예: cache-manager API 외부에서) 이전 버전의 `@nestjs/cache-manager`를 사용하여 작성된 데이터를 지원해야 하는 경우 이 변경 사항에 유의하는 것이 중요합니다.

#### Config 모듈

`@nestjs/config` 패키지의 `ConfigModule`을 사용하는 경우, `@nestjs/config@4.0.0`에 도입된 몇 가지 호환성 문제(breaking changes)에 유의하십시오. 가장 주목할 만한 변경 사항은 `ConfigService#get` 메서드가 구성 변수를 읽는 순서가 업데이트되었다는 것입니다. 새로운 순서는 다음과 같습니다.

- 내부 구성 (config namespaces 및 custom config files)
- 유효성 검사된 환경 변수 (유효성 검사가 활성화되고 스키마가 제공된 경우)
- `process.env` 객체

이전에는 유효성 검사된 환경 변수와 `process.env` 객체가 먼저 읽혀서 내부 구성에 의해 재정의되는 것을 방지했습니다. 이 업데이트로 인해 내부 구성이 이제 항상 환경 변수보다 우선합니다.

또한, 이전에 `process.env` 객체의 유효성 검사를 비활성화할 수 있었던 `ignoreEnvVars` 구성 옵션은 더 이상 사용되지 않습니다. 대신 `validatePredefined` 옵션을 사용하십시오 (사전 정의된 환경 변수의 유효성 검사를 비활성화하려면 `false`로 설정). 사전 정의된 환경 변수는 모듈이 임포트되기 전에 설정된 `process.env` 변수를 의미합니다. 예를 들어 `PORT=3000 node main.js`로 애플리케이션을 시작하면 `PORT` 변수는 사전 정의된 것으로 간주됩니다. 그러나 `ConfigModule`이 `.env` 파일에서 로드한 변수는 사전 정의된 것으로 분류되지 않습니다.

새로운 `skipProcessEnv` 옵션도 도입되었습니다. 이 옵션을 사용하면 `ConfigService#get` 메서드가 `process.env` 객체에 접근하는 것을 완전히 방지할 수 있으며, 이는 서비스가 환경 변수를 직접 읽는 것을 제한하려는 경우 유용할 수 있습니다.

#### Terminus 모듈

`TerminusModule`을 사용하고 자체 커스텀 상태 표시기(health indicator)를 구축한 경우, 버전 11에 새로운 API가 도입되었습니다. 새로운 `HealthIndicatorService`는 커스텀 상태 표시기의 가독성과 테스트 용이성을 향상시키도록 설계되었습니다.

버전 11 이전에는 상태 표시기가 다음과 같았을 수 있습니다.

```typescript
@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async isHealthy(key: string) {
    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      const result = this.getStatus(key, isHealthy, {
        badboys: badboys.length,
      });

      if (!isHealthy) {
        throw new HealthCheckError('Dog check failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus(key, isHealthy);
      throw new HealthCheckError('Dog check failed', result);
    }
  }

  private getBadboys() {
    return firstValueFrom(
      this.httpService.get<Dog[]>('https://example.com/dog').pipe(
        map((response) => response.data),
        map((dogs) => dogs.filter((dog) => dog.state === DogState.BAD_BOY)),
      ),
    );
  }
}
```

버전 11부터는 구현 프로세스를 간소화하는 새로운 `HealthIndicatorService` API를 사용하는 것이 좋습니다. 동일한 상태 표시기를 이제 다음과 같이 구현할 수 있습니다.

```typescript
@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    // TerminusModule에서 제공하는 HealthIndicatorService를 주입합니다
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    // 주어진 키에 대한 상태 표시기 검사를 시작합니다
    const indicator = this.healthIndicatorService.check(key);

    try {
      const badboys = await this.getBadboys();
      const isHealthy = badboys.length === 0;

      if (!isHealthy) {
        // 표시기를 "다운"으로 표시하고 응답에 추가 정보를 추가합니다
        return indicator.down({ badboys: badboys.length });
      }

      // 상태 표시기를 업으로 표시합니다
      return indicator.up();
    } catch (error) {
      return indicator.down('Unable to retrieve dogs');
    }
  }

  private getBadboys() {
    // ...
  }
}
```

주요 변경 사항:

- `HealthIndicatorService`는 레거시 `HealthIndicator` 및 `HealthCheckError` 클래스를 대체하여 상태 검사를 위한 더 깔끔한 API를 제공합니다.
- `check` 메서드는 상태 검사 응답에 추가 메타데이터 포함을 지원하면서 상태 추적(`up` 또는 `down`)을 쉽게 할 수 있습니다.

> info **정보** `HealthIndicator` 및 `HealthCheckError` 클래스는 더 이상 사용되지 않는 것으로 표시되었으며 다음 주요 릴리스에서 제거될 예정입니다.

#### Node.js v16 및 v18 지원 중단

NestJS 11부터 Node.js v16은 2023년 9월 11일에 수명 종료(EOL)에 도달했기 때문에 더 이상 지원되지 않습니다. 마찬가지로 Node.js v18에 대한 보안 지원은 2025년 4월 30일에 종료될 예정이므로 v18에 대한 지원도 미리 중단했습니다.

NestJS 11은 이제 **Node.js v20 이상**을 요구합니다.

최고의 경험을 위해 최신 LTS 버전의 Node.js를 사용하는 것을 강력히 권장합니다.

#### Mau 공식 배포 플랫폼

2024년에 공식 배포 플랫폼인 [Mau](https://www.mau.nestjs.com/)를 출시했다는 발표를 놓치셨을 수도 있습니다.
Mau는 NestJS 애플리케이션 배포 프로세스를 단순화하는 완전 관리형 플랫폼입니다. Mau를 사용하면 단일 명령으로 클라우드(**AWS**, Amazon Web Services)에 애플리케이션을 배포하고, 환경 변수를 관리하며, 애플리케이션 성능을 실시간으로 모니터링할 수 있습니다.

Mau는 몇 번의 클릭만으로 인프라 프로비저닝 및 유지 관리를 매우 간단하게 만듭니다. Mau는 단순하고 직관적으로 설계되어 인프라에 대해 걱정할 필요 없이 애플리케이션 구축에 집중할 수 있습니다. 내부적으로는 Amazon Web Services를 사용하여 강력하고 안정적인 플랫폼을 제공하는 동시에 AWS의 모든 복잡성을 추상화합니다. 우리는 모든 번거로운 작업을 처리해 드리므로 애플리케이션 구축 및 비즈니스 성장에 집중할 수 있습니다.

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

Mau에 대해 더 자세히 알아보려면 [이 챕터](/deployment#easy-deployment-with-mau)를 참조하십시오.