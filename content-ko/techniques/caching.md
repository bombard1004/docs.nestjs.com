### 캐싱

캐싱은 애플리케이션의 성능을 향상시키기 위한 강력하고 직관적인 **기술**입니다. 임시 저장소 계층으로 작동하여 자주 사용되는 데이터에 더 빠르게 접근할 수 있도록 해주므로, 동일한 정보를 반복적으로 가져오거나 계산할 필요성을 줄여줍니다. 이를 통해 응답 시간이 단축되고 전반적인 효율성이 향상됩니다.

#### 설치

Nest에서 캐싱을 시작하려면 `@nestjs/cache-manager` 패키지와 `cache-manager` 패키지를 설치해야 합니다.

```bash
$ npm install @nestjs/cache-manager cache-manager
```

기본적으로 모든 것은 메모리에 저장됩니다. `cache-manager`는 내부적으로 [Keyv](https://keyv.org/docs/)를 사용하므로, 적절한 패키지를 설치하여 Redis와 같은 고급 저장소 솔루션으로 쉽게 전환할 수 있습니다. 이는 나중에 더 자세히 다루겠습니다.

#### 인-메모리 캐시

애플리케이션에서 캐싱을 활성화하려면, `CacheModule`을 임포트하고 `register()` 메소드를 사용하여 구성하십시오:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
```

이 설정은 기본 설정으로 인-메모리 캐싱을 초기화하여 즉시 데이터 캐싱을 시작할 수 있게 합니다.

#### 캐시 스토어와 상호작용하기

캐시 관리자 인스턴스와 상호작용하려면, 다음처럼 `CACHE_MANAGER` 토큰을 사용하여 클래스에 주입하십시오:

```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
```

> info **힌트** `Cache` 클래스는 `cache-manager`에서 임포트되며, `CACHE_MANAGER` 토큰은 `@nestjs/cache-manager` 패키지에서 임포트됩니다.

`Cache` 인스턴스의 `get` 메소드(`cache-manager` 패키지에서)는 캐시에서 항목을 가져오는 데 사용됩니다. 항목이 캐시에 존재하지 않으면 `null`이 반환됩니다.

```typescript
const value = await this.cacheManager.get('key');
```

캐시에 항목을 추가하려면 `set` 메소드를 사용하십시오:

```typescript
await this.cacheManager.set('key', 'value');
```

> warning **참고** 인-메모리 캐시 저장소는 [구조화된 복제 알고리즘(structured clone algorithm)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types)이 지원하는 타입의 값만 저장할 수 있습니다.

다음과 같이 특정 키에 대한 TTL(만료 시간, 밀리초 단위)을 수동으로 지정할 수 있습니다:

```typescript
await this.cacheManager.set('key', 'value', 1000);
```

여기서 `1000`은 밀리초 단위의 TTL이며, 이 경우 캐시 항목은 1초 후에 만료됩니다.

캐시의 만료를 비활성화하려면 `ttl` 구성 속성을 `0`으로 설정하십시오:

```typescript
await this.cacheManager.set('key', 'value', 0);
```

캐시에서 항목을 제거하려면 `del` 메소드를 사용하십시오:

```typescript
await this.cacheManager.del('key');
```

전체 캐시를 비우려면 `clear` 메소드를 사용하십시오:

```typescript
await this.cacheManager.clear();
```

#### 응답 자동 캐싱

> warning **경고** [GraphQL](/graphql/quick-start) 애플리케이션에서는 인터셉터가 각 필드 리졸버에 대해 개별적으로 실행됩니다. 따라서 `CacheModule`(응답 캐싱에 인터셉터를 사용)은 제대로 작동하지 않습니다.

응답 자동 캐싱을 활성화하려면, 캐싱하려는 데이터가 있는 곳에 `CacheInterceptor`를 연결하기만 하면 됩니다.

```typescript
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
```

> warning**경고** `GET` 엔드포인트만 캐시됩니다. 또한, 네이티브 응답 객체(`@Res()`)를 주입하는 HTTP 서버 라우트는 캐시 인터셉터를 사용할 수 없습니다. 자세한 내용은
> <a href="https://nestjs.dokidocs.dev/interceptors#response-mapping">응답 매핑</a>을 참조하십시오.

필요한 상용구 코드(boilerplate)의 양을 줄이려면, 모든 엔드포인트에 `CacheInterceptor`를 전역적으로 바인딩할 수 있습니다:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### TTL (Time-to-live)

`ttl`의 기본값은 `0`으로, 캐시가 절대 만료되지 않음을 의미합니다. 사용자 지정 [TTL](https://en.wikipedia.org/wiki/Time_to_live)을 지정하려면, 아래에 설명된 것처럼 `register()` 메소드에 `ttl` 옵션을 제공할 수 있습니다:

```typescript
CacheModule.register({
  ttl: 5000, // 밀리초
});
```

#### 전역적으로 모듈 사용

다른 모듈에서 `CacheModule`을 사용하고 싶다면, 이를 임포트해야 합니다 (다른 Nest 모듈과 마찬가지로 표준입니다). 또는, 옵션 객체의 `isGlobal` 속성을 `true`로 설정하여 [전역 모듈](https://nestjs.dokidocs.dev/modules#global-modules)로 선언하십시오. 이 경우, 일단 루트 모듈(예: `AppModule`)에 로드되면 다른 모듈에서는 `CacheModule`을 임포트할 필요가 없습니다.

```typescript
CacheModule.register({
  isGlobal: true,
});
```

#### 전역 캐시 재정의

전역 캐시가 활성화된 동안, 캐시 항목은 라우트 경로를 기반으로 자동 생성되는 `CacheKey` 아래에 저장됩니다. 특정 캐시 설정(`@CacheKey()` 및 `@CacheTTL()`)을 메소드별로 재정의하여 개별 컨트롤러 메소드에 대한 사용자 지정 캐싱 전략을 허용할 수 있습니다. 이는 [다른 캐시 저장소](https://nestjs.dokidocs.dev/techniques/caching#different-stores)를 사용할 때 가장 관련이 있을 수 있습니다.

컨트롤러별로 `@CacheTTL()` 데코레이터를 적용하여 전체 컨트롤러에 대한 캐싱 TTL을 설정할 수 있습니다. 컨트롤러 레벨 및 메소드 레벨 캐시 TTL 설정이 모두 정의된 경우, 메소드 레벨에서 지정된 캐시 TTL 설정이 컨트롤러 레벨 설정보다 우선 순위를 가집니다.

```typescript
@Controller()
@CacheTTL(50)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] {
    return [];
  }
}
```

> info **힌트** `@CacheKey()` 및 `@CacheTTL()` 데코레이터는 `@nestjs/cache-manager` 패키지에서 임포트됩니다.

`@CacheKey()` 데코레이터는 해당 `@CacheTTL()` 데코레이터와 함께 또는 없이 사용할 수 있으며 그 반대도 마찬가지입니다. `@CacheKey()`만 재정의하거나 `@CacheTTL()`만 재정의할 수 있습니다. 데코레이터로 재정의되지 않은 설정은 전역적으로 등록된 기본값을 사용합니다([캐싱 사용자 지정](https://nestjs.dokidocs.dev/techniques/caching#customize-caching) 참조).

#### WebSockets 및 Microservices

또한 `CacheInterceptor`를 WebSocket 구독자 및 Microservice 패턴(사용 중인 전송 메소드에 관계없이)에 적용할 수 있습니다.

```typescript
@@filename()
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

그러나 추가적인 `@CacheKey()` 데코레이터는 캐시된 데이터를 이후에 저장하고 검색하는 데 사용되는 키를 지정하기 위해 필요합니다. 또한 **모든 것을 캐시해서는 안 된다**는 점에 유의하십시오. 단순히 데이터를 쿼리하는 것보다 비즈니스 작업을 수행하는 작업은 절대 캐시해서는 안 됩니다.

또한, `@CacheTTL()` 데코레이터를 사용하여 캐시 만료 시간(TTL)을 지정할 수 있으며, 이는 전역 기본 TTL 값을 재정의합니다.

```typescript
@@filename()
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

> info **힌트** `@CacheTTL()` 데코레이터는 해당 `@CacheKey()` 데코레이터와 함께 또는 없이 사용할 수 있습니다.

#### 추적 조정

기본적으로 Nest는 요청 URL(HTTP 앱에서) 또는 캐시 키(웹소켓 및 마이크로서비스 앱에서, `@CacheKey()` 데코레이터를 통해 설정됨)를 사용하여 캐시 레코드를 엔드포인트와 연결합니다. 그러나 때로는 다른 요소를 기반으로 추적을 설정하고 싶을 수 있습니다. 예를 들어, HTTP 헤더(예: `Authorization`)를 사용하여 `profile` 엔드포인트를 올바르게 식별하는 경우입니다.

이를 달성하려면 `CacheInterceptor`의 서브클래스를 생성하고 `trackBy()` 메소드를 재정의하십시오.

```typescript
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
```

#### 대체 캐시 스토어 사용하기

다른 캐시 스토어로 전환하는 것은 간단합니다. 먼저 적절한 패키지를 설치하십시오. 예를 들어, Redis를 사용하려면 `@keyv/redis` 패키지를 설치하십시오:

```bash
$ npm install @keyv/redis
```

이것이 준비되면, 아래와 같이 여러 스토어를 사용하여 `CacheModule`을 등록할 수 있습니다:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

이 예제에서는 `CacheableMemory`와 `KeyvRedis` 두 개의 스토어를 등록했습니다. `CacheableMemory` 스토어는 간단한 인-메모리 스토어이며, `KeyvRedis`는 Redis 스토어입니다. `stores` 배열은 사용하려는 스토어를 지정하는 데 사용됩니다. 배열의 첫 번째 스토어는 기본 스토어이고, 나머지는 폴백(fallback) 스토어입니다.

사용 가능한 스토어에 대한 자세한 내용은 [Keyv 문서](https://keyv.org/docs/)를 확인하십시오.

#### 비동기 구성

컴파일 시점에 정적으로 모듈 옵션을 전달하는 대신 비동기적으로 전달하고 싶을 수 있습니다. 이 경우, 비동기 구성을 다루는 여러 방법을 제공하는 `registerAsync()` 메소드를 사용하십시오.

한 가지 접근 방식은 팩토리 함수를 사용하는 것입니다:

```typescript
CacheModule.registerAsync({
  useFactory: () => ({
    ttl: 5,
  }),
});
```

우리의 팩토리는 다른 모든 비동기 모듈 팩토리처럼 작동합니다 (`async`일 수 있으며 `inject`를 통해 종속성을 주입할 수 있습니다).

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
```

또는 `useClass` 메소드를 사용할 수 있습니다:

```typescript
CacheModule.registerAsync({
  useClass: CacheConfigService,
});
```

위 구성은 `CacheModule` 내부에 `CacheConfigService`의 인스턴스를 생성하고, 이를 사용하여 옵션 객체를 가져옵니다. `CacheConfigService`는 구성 옵션을 제공하기 위해 `CacheOptionsFactory` 인터페이스를 구현해야 합니다:

```typescript
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5,
    };
  }
}
```

다른 모듈에서 임포트된 기존 구성 프로바이더를 사용하고 싶다면, `useExisting` 구문을 사용하십시오:

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

이는 `useClass`와 동일하게 작동하지만 한 가지 중요한 차이점이 있습니다 - `CacheModule`은 자체 `ConfigService` 인스턴스를 생성하는 대신, 임포트된 모듈을 찾아 이미 생성된 `ConfigService`를 재사용합니다.

> info **힌트** `CacheModule#register` 및 `CacheModule#registerAsync`, `CacheOptionsFactory`는 스토어별 구성 옵션을 좁혀 타입 안전성을 높이는 선택적 제네릭(타입 인자)을 가집니다.

또한 `registerAsync()` 메소드에 `extraProviders`라고 불리는 것을 전달할 수 있습니다. 이 프로바이더들은 모듈 프로바이더들과 병합됩니다.

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

이는 팩토리 함수나 클래스 생성자에 추가 종속성을 제공하고 싶을 때 유용합니다.

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/20-cache)에서 확인할 수 있습니다.