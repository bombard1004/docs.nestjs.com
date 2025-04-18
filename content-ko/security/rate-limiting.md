### 요청 제한 (Rate Limiting)

무차별 대입 공격으로부터 애플리케이션을 보호하는 일반적인 기술은 **요청 제한**입니다. 시작하려면 `@nestjs/throttler` 패키지를 설치해야 합니다.

```bash
$ npm i --save @nestjs/throttler
```

설치가 완료되면 `ThrottlerModule`은 `forRoot` 또는 `forRootAsync` 메서드를 사용하여 다른 Nest 패키지와 마찬가지로 구성할 수 있습니다.

```typescript
@@filename(app.module)
@Module({
  imports: [
     ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
})
export class AppModule {}
```

위 설정은 가드된 애플리케이션의 라우트에 대해 `ttl` (밀리초 단위 수명 시간) 및 `limit` (ttl 내 최대 요청 수)에 대한 전역 옵션을 설정합니다.

모듈을 임포트한 후에는 `ThrottlerGuard`를 어떻게 바인딩할지 선택할 수 있습니다. [가드](https://nestjs.dokidocs.dev/guards) 섹션에 언급된 어떤 종류의 바인딩도 가능합니다. 예를 들어, 가드를 전역적으로 바인딩하려면 이 프로바이더를 어떤 모듈에든 추가하면 됩니다.

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### 여러 요청 제한 정의

때로는 초당 3회 이하, 10초당 20회 이하, 분당 100회 이하와 같이 여러 요청 제한 정의를 설정해야 할 수 있습니다. 이를 위해 이름이 지정된 옵션을 배열에 설정할 수 있으며, 이 옵션은 나중에 `@SkipThrottle()` 및 `@Throttle()` 데코레이터에서 참조하여 다시 옵션을 변경할 수 있습니다.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
```

#### 사용자 정의

가드를 컨트롤러 또는 전역적으로 바인딩하고 싶지만, 하나 이상의 엔드포인트에 대해 요청 제한을 비활성화하고 싶은 경우가 있을 수 있습니다. 이를 위해 전체 클래스 또는 단일 라우트에 대한 요청 제한을 비활성화하는 `@SkipThrottle()` 데코레이터를 사용할 수 있습니다. `@SkipThrottle()` 데코레이터는 대부분의 컨트롤러를 제외하지만 모든 라우트를 제외하지는 않는 경우에 사용할 수 있으며, 여러 개의 요청 제한 세트가 있는 경우 각 세트별로 구성할 수 있도록 부울 값을 가진 문자열 키의 객체를 인수로 받을 수도 있습니다. 객체를 전달하지 않으면 기본값은 `{{ '{' }} default: true {{ '}' }}`를 사용합니다.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {}
```

이 `@SkipThrottle()` 데코레이터는 라우트 또는 클래스를 건너뛰거나, 건너뛰어진 클래스 내에서 특정 라우트의 건너뛰기를 무효화하는 데 사용할 수 있습니다.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {
  // Rate limiting is applied to this route.
  @SkipThrottle({ default: false })
  dontSkip() {
    return 'List users work with Rate limiting.';
  }
  // This route will skip rate limiting.
  doSkip() {
    return 'List users work without Rate limiting.';
  }
}
```

또한 전역 모듈에 설정된 `limit` 및 `ttl`을 재정의하여 더 강화되거나 완화된 보안 옵션을 제공하는 데 사용할 수 있는 `@Throttle()` 데코레이터가 있습니다. 이 데코레이터는 클래스 또는 함수에서도 사용할 수 있습니다. 버전 5 이상부터는 데코레이터가 요청 제한 세트의 이름과 관련된 문자열 키와 `limit` 및 `ttl` 키와 정수 값을 가진 객체를 인수로 받습니다. 이는 루트 모듈에 전달되는 옵션과 유사합니다. 원본 옵션에 이름이 설정되어 있지 않으면 문자열 `default`를 사용하십시오. 다음과 같이 구성해야 합니다.

```typescript
// Override default configuration for Rate limiting and duration.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "List users works with custom rate limiting.";
}
```

#### 프록시

애플리케이션이 프록시 서버 뒤에서 실행되는 경우, HTTP 어댑터가 프록시를 신뢰하도록 구성하는 것이 중요합니다. `trust proxy` 설정을 활성화하기 위해 [Express](http://expressjs.com/en/guide/behind-proxies.html) 및 [Fastify](https://www.fastify.io/docs/latest/Reference/Server/#trustproxy)의 특정 HTTP 어댑터 옵션을 참조할 수 있습니다.

다음은 Express 어댑터에 대해 `trust proxy`를 활성화하는 방법을 보여주는 예시입니다.

```typescript
@@filename(main.ts)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
```

`trust proxy`를 활성화하면 `X-Forwarded-For` 헤더에서 원래 IP 주소를 가져올 수 있습니다. 또한 `req.ip`에 의존하는 대신 이 헤더에서 IP 주소를 추출하도록 `getTracker()` 메서드를 재정의하여 애플리케이션의 동작을 사용자 정의할 수도 있습니다. 다음 예시는 Express와 Fastify 모두에서 이를 달성하는 방법을 보여줍니다.

```typescript
@@filename(throttler-behind-proxy.guard)
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
  }
}
```

> info **힌트** express의 `req` Request 객체 API는 [여기](https://expressjs.com/en/api.html#req.ips)에서, fastify는 [여기](https://www.fastify.io/docs/latest/Reference/Request/)에서 찾을 수 있습니다.

#### 웹소켓

이 모듈은 웹소켓과 함께 작동할 수 있지만, 일부 클래스 확장이 필요합니다. `ThrottlerGuard`를 확장하고 `handleRequest` 메서드를 다음과 같이 재정의할 수 있습니다.

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;

    const client = context.switchToWs().getClient();
    const tracker = client._socket.remoteAddress;
    const key = generateKey(context, tracker, throttler.name);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name,
      );

    const getThrottlerSuffix = (name: string) =>
      name === 'default' ? '' : `-${name}`;

    // Throw an error when the user reached their limit.
    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }
}
```

> info **힌트** ws를 사용하는 경우 `_socket`을 `conn`으로 바꿔야 합니다.

웹소켓 작업 시 몇 가지 유의할 점이 있습니다.

- 가드는 `APP_GUARD` 또는 `app.useGlobalGuards()`로 등록할 수 없습니다.
- 제한에 도달하면 Nest는 `exception` 이벤트를 발생시키므로, 이를 수신할 리스너가 준비되어 있는지 확인하십시오.

> info **힌트** `@nestjs/platform-ws` 패키지를 사용하는 경우 대신 `client._socket.remoteAddress`를 사용할 수 있습니다.

#### GraphQL

`ThrottlerGuard`는 GraphQL 요청과 함께 작동하는 데도 사용할 수 있습니다. 다시 말하지만, 가드는 확장될 수 있으며 이번에는 `getRequestResponse` 메서드가 재정의됩니다.

```typescript
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

#### 구성

다음 옵션은 `ThrottlerModule` 옵션 배열에 전달되는 객체에 대해 유효합니다.

<table>
  <tr>
    <td><code>name</code></td>
    <td>사용 중인 요청 제한 세트를 내부적으로 추적하기 위한 이름입니다. 전달되지 않으면 기본값은 `default`입니다.</td>
  </tr>
  <tr>
    <td><code>ttl</code></td>
    <td>각 요청이 저장소에 유지되는 밀리초 수입니다.</td>
  </tr>
  <tr>
    <td><code>limit</code></td>
    <td>TTL 제한 내 최대 요청 수입니다.</td>
  </tr>
  <tr>
    <td><code>blockDuration</code></td>
    <td>해당 시간 동안 요청이 차단되는 밀리초 수입니다.</td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>요청 제한 시 무시할 사용자 에이전트의 정규 표현식 배열입니다.</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td><code>ExecutionContext</code>를 받아 요청 제한 로직을 중단할지 여부를 결정하는 <code>boolean</code>을 반환하는 함수입니다. <code>@SkipThrottler()</code>와 유사하지만 요청에 기반합니다.</td>
  </tr>
</table>

대신 저장소를 설정하거나, 위 옵션 중 일부를 각 요청 제한 세트에 적용되는 보다 전역적인 의미로 사용하고 싶다면, `throttlers` 옵션 키를 통해 위 옵션을 전달하고 아래 표를 사용할 수 있습니다.

<table>
  <tr>
    <td><code>storage</code></td>
    <td>요청 제한 추적을 위한 사용자 정의 저장소 서비스입니다. <a href="/security/rate-limiting#storages">여기서 확인하세요.</a></td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>요청 제한 시 무시할 사용자 에이전트의 정규 표현식 배열입니다.</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td><code>ExecutionContext</code>를 받아 요청 제한 로직을 중단할지 여부를 결정하는 <code>boolean</code>을 반환하는 함수입니다. <code>@SkipThrottler()</code>와 유사하지만 요청에 기반합니다.</td>
  </tr>
  <tr>
    <td><code>throttlers</code></td>
    <td>위 표를 사용하여 정의된 요청 제한 세트 배열입니다.</td>
  </tr>
  <tr>
    <td><code>errorMessage</code></td>
    <td>기본 요청 제한 오류 메시지를 재정의하는 <code>string</code> 또는 <code>ExecutionContext</code> 및 <code>ThrottlerLimitDetail</code>을 받아 <code>string</code>을 반환하는 함수입니다.</td>
  </tr>
  <tr>
    <td><code>getTracker</code></td>
    <td><code>Request</code>를 받아 <code>string</code>을 반환하여 <code>getTracker</code> 메서드의 기본 로직을 재정의하는 함수입니다.</td>
  </tr>
  <tr>
    <td><code>generateKey</code></td>
    <td><code>ExecutionContext</code>, 트래커 <code>string</code>, 요청 제한기 이름을 <code>string</code>으로 받아 요청 제한 값을 저장하는 데 사용될 최종 키를 재정의하는 <code>string</code>을 반환하는 함수입니다. 이는 <code>generateKey</code> 메서드의 기본 로직을 재정의합니다.</td>
  </tr>
</table>

#### 비동기 구성

요청 제한 구성을 동기적으로 가져오는 대신 비동기적으로 가져오고 싶을 수 있습니다. 의존성 주입 및 `async` 메서드를 허용하는 `forRootAsync()` 메서드를 사용할 수 있습니다.

한 가지 접근 방식은 팩토리 함수를 사용하는 것입니다.

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
})
export class AppModule {}
```

`useClass` 구문도 사용할 수 있습니다.

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
  ],
})
export class AppModule {}
```

`ThrottlerConfigService`가 `ThrottlerOptionsFactory` 인터페이스를 구현하는 한 가능합니다.

#### 저장소

내장된 저장소는 전역 옵션으로 설정된 TTL을 초과할 때까지 이루어진 요청을 추적하는 인메모리 캐시입니다. 클래스가 `ThrottlerStorage` 인터페이스를 구현하는 한 `ThrottlerModule`의 `storage` 옵션에 자체 저장소 옵션을 추가할 수 있습니다.

분산 서버의 경우 단일 진실 공급원을 갖도록 [Redis](https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis)를 위한 커뮤니티 저장소 프로바이더를 사용할 수 있습니다.

> info **참고** `ThrottlerStorage`는 `@nestjs/throttler`에서 임포트할 수 있습니다.

#### 시간 헬퍼

직접 정의하는 것보다 더 읽기 쉽게 타이밍을 설정할 수 있는 몇 가지 헬퍼 메서드가 있습니다. `@nestjs/throttler`는 `seconds`, `minutes`, `hours`, `days`, `weeks` 다섯 가지 헬퍼를 내보냅니다. 사용하려면 `seconds(5)` 또는 다른 헬퍼를 호출하기만 하면 올바른 밀리초 수가 반환됩니다.

#### 마이그레이션 가이드

대부분의 경우 옵션을 배열로 감싸는 것으로 충분합니다.

사용자 정의 저장소를 사용하는 경우, `ttl` 및 `limit`를 배열로 감싸고 옵션 객체의 `throttlers` 속성에 할당해야 합니다.

이제 `@ThrottleSkip()`는 `string: boolean` 속성을 가진 객체를 인수로 받아야 합니다. 문자열은 요청 제한기의 이름입니다. 이름이 없는 경우, 그렇지 않으면 내부적으로 사용될 문자열 `'default'`를 전달하십시오.

모든 `@Throttle()` 데코레이터도 이제 요청 제한 컨텍스트의 이름과 관련된 문자열 키(이름이 없으면 다시 `'default'`)와 `limit` 및 `ttl` 키를 가진 객체 값을 가진 객체를 인수로 받아야 합니다.

> Warning **중요** 이제 `ttl`은 **밀리초** 단위입니다. 가독성을 위해 ttl을 초 단위로 유지하고 싶다면 이 패키지의 `seconds` 헬퍼를 사용하십시오. 이는 단순히 ttl에 1000을 곱하여 밀리초로 만듭니다.

자세한 내용은 [변경 로그](https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#500)를 참조하십시오.