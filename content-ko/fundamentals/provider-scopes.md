### 인젝션 스코프(Injection scopes)

다른 프로그래밍 언어 배경을 가진 사람들에게는 Nest에서 거의 모든 것이 수신 요청 전반에 걸쳐 공유된다는 사실이 의외일 수 있습니다. 데이터베이스 연결 풀, 전역 상태를 가진 싱글톤 서비스 등이 있습니다. Node.js는 모든 요청이 별도의 스레드에 의해 처리되는 요청/응답 다중 스레드 무상태 모델(request/response Multi-Threaded Stateless Model)을 따르지 않는다는 것을 기억하세요. 따라서 싱글톤 인스턴스를 사용하는 것은 우리 애플리케이션에서 완전히 **안전**합니다.

하지만, 요청 기반 수명 주기가 바람직한 경우가 있습니다. 예를 들어 GraphQL 애플리케이션에서의 요청별 캐싱, 요청 추적, 다중 테넌시 등이 있습니다. 인젝션 스코프는 원하는 프로바이더 수명 주기 동작을 얻기 위한 메커니즘을 제공합니다.

#### 프로바이더 스코프

프로바이더는 다음 스코프 중 하나를 가질 수 있습니다:

<table>
  <tr>
    <td><code>DEFAULT</code></td>
    <td>프로바이더의 단일 인스턴스가 전체 애플리케이션에서 공유됩니다. 인스턴스 수명 주기는 애플리케이션 수명 주기에 직접 연결됩니다. 애플리케이션이 부트스트랩되면 모든 싱글톤 프로바이더가 인스턴스화됩니다. 싱글톤 스코프는 기본적으로 사용됩니다.</td>
  </tr>
  <tr>
    <td><code>REQUEST</code></td>
    <td>각각의 수신 <strong>요청</strong>에 대해 프로바이더의 새로운 인스턴스가 생성됩니다. 인스턴스는 요청 처리가 완료된 후 가비지 수집됩니다.</td>
  </tr>
  <tr>
    <td><code>TRANSIENT</code></td>
    <td>트랜지언트(Transient) 프로바이더는 컨슈머(consumer) 간에 공유되지 않습니다. 트랜지언트 프로바이더를 인젝션하는 각 컨슈머는 새롭고 전용적인 인스턴스를 받게 됩니다.</td>
  </tr>
</table>

> info **힌트** 대부분의 사용 사례에서는 싱글톤 스코프를 사용하는 것이 **권장**됩니다. 컨슈머와 요청 간에 프로바이더를 공유한다는 것은 인스턴스가 캐시될 수 있고 초기화가 애플리케이션 시작 중에 한 번만 발생한다는 것을 의미합니다.

#### 사용법

`@Injectable()` 데코레이터 옵션 객체에 `scope` 속성을 전달하여 인젝션 스코프를 지정합니다:

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

마찬가지로, [커스텀 프로바이더](/fundamentals/custom-providers)의 경우, 프로바이더 등록을 위한 긴 형식에서 `scope` 속성을 설정합니다:

```typescript
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```

> info **힌트** `@nestjs/common`에서 `Scope` enum을 임포트하세요.

싱글톤 스코프는 기본적으로 사용되며 선언할 필요가 없습니다. 프로바이더를 싱글톤 스코프로 명시적으로 선언하고 싶다면, `scope` 속성에 `Scope.DEFAULT` 값을 사용하세요.

> warning **주의** Websocket Gateway는 싱글톤으로 동작해야 하므로 요청 스코프 프로바이더를 사용해서는 안 됩니다. 각 게이트웨이는 실제 소켓을 캡슐화하며 여러 번 인스턴스화될 수 없습니다. 이 제한 사항은 [_Passport strategies_](../security/authentication#request-scoped-strategies) 또는 _Cron controllers_와 같은 일부 다른 프로바이더에도 적용됩니다.

#### 컨트롤러 스코프

컨트롤러도 스코프를 가질 수 있으며, 이는 해당 컨트롤러에 선언된 모든 요청 메서드 핸들러에 적용됩니다. 프로바이더 스코프와 마찬가지로, 컨트롤러의 스코프는 그 수명 주기를 선언합니다. 요청 스코프 컨트롤러의 경우, 각 인바운드 요청에 대해 새로운 인스턴스가 생성되고 요청 처리가 완료될 때 가비지 수집됩니다.

`ControllerOptions` 객체의 `scope` 속성으로 컨트롤러 스코프를 선언합니다:

```typescript
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```

#### 스코프 계층 구조

`REQUEST` 스코프는 인젝션 체인을 따라 위로 버블링됩니다. 요청 스코프 프로바이더에 의존하는 컨트롤러는 그 자체로 요청 스코프가 됩니다.

다음 종속성 그래프를 상상해 보세요: `CatsController <- CatsService <- CatsRepository`. 만약 `CatsService`가 요청 스코프이고 (나머지는 기본 싱글톤인 경우), `CatsController`는 인젝션된 서비스에 의존하기 때문에 요청 스코프가 됩니다. 의존하지 않는 `CatsRepository`는 싱글톤 스코프를 유지합니다.

트랜지언트 스코프 종속성은 이러한 패턴을 따르지 않습니다. 만약 싱글톤 스코프 `DogsService`가 트랜지언트 `LoggerService` 프로바이더를 인젝션한다면, 그것은 새로운 인스턴스를 받게 될 것입니다. 그러나 `DogsService`는 싱글톤 스코프를 유지하므로, 어디서든 이를 인젝션해도 `DogsService`의 새로운 인스턴스로 해석되지는 않습니다. 원하는 동작이라면, `DogsService`도 명시적으로 `TRANSIENT`로 표시되어야 합니다.

<app-banner-courses></app-banner-courses>

#### 요청 프로바이더

HTTP 서버 기반 애플리케이션(예: `@nestjs/platform-express` 또는 `@nestjs/platform-fastify` 사용)에서, 요청 스코프 프로바이더를 사용할 때 원래 요청 객체에 대한 참조에 접근하고 싶을 수 있습니다. `REQUEST` 객체를 인젝션함으로써 이를 수행할 수 있습니다.

`REQUEST` 프로바이더는 본질적으로 요청 스코프이며, 이를 사용할 때 `REQUEST` 스코프를 명시적으로 지정할 필요가 없습니다. 또한, 그렇게 하려고 해도 무시됩니다. 요청 스코프 프로바이더에 의존하는 모든 프로바이더는 자동으로 요청 스코프를 채택하며, 이 동작은 변경할 수 없습니다.

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

기저 플랫폼/프로토콜 차이로 인해, 마이크로서비스 또는 GraphQL 애플리케이션에서는 인바운드 요청에 조금 다르게 접근합니다. [GraphQL](/graphql/quick-start) 애플리케이션에서는 `REQUEST` 대신 `CONTEXT`를 인젝션합니다:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
```

그런 다음 `context` 값을 ( `GraphQLModule`에서) 구성하여 `request`를 속성으로 포함하도록 합니다.

#### Inquirer 프로바이더

로그인 또는 메트릭스 프로바이더와 같이 프로바이더가 생성된 클래스를 얻고 싶다면, `INQUIRER` 토큰을 인젝션할 수 있습니다.

```typescript
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

그런 다음 다음과 같이 사용합니다:

```typescript
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('My name is getRoot');

    return 'Hello world!';
  }
}
```

위 예제에서 `AppService#getRoot`가 호출되면, 콘솔에 `"AppService: My name is getRoot"`가 로깅될 것입니다.

#### 성능

요청 스코프 프로바이더를 사용하면 애플리케이션 성능에 영향을 미칩니다. Nest는 가능한 한 많은 메타데이터를 캐시하려고 시도하지만, 각 요청 시 클래스의 인스턴스를 생성해야 합니다. 따라서 평균 응답 시간과 전반적인 벤치마킹 결과를 늦출 것입니다. 프로바이더가 요청 스코프여야 하는 경우가 아니라면, 기본 싱글톤 스코프를 사용하는 것이 강력히 권장됩니다.

> info **힌트** 이 모든 것이 상당히 부담스럽게 들리겠지만, 요청 스코프 프로바이더를 활용하여 적절하게 설계된 애플리케이션은 지연 시간 측면에서 ~5% 이상 느려지지 않아야 합니다.

#### Durable 프로바이더

위 섹션에서 언급했듯이, 요청 스코프 프로바이더는 지연 시간 증가를 유발할 수 있습니다. 왜냐하면 (컨트롤러 인스턴스에 인젝션되거나, 더 깊게는 그 프로바이더 중 하나에 인젝션되는) 적어도 하나의 요청 스코프 프로바이더를 가지는 것은 컨트롤러 자체도 요청 스코프가 되기 때문입니다. 즉, 각 개별 요청당 다시 생성(인스턴스화)되어야 하며 (그 후 가비지 수집되어야 합니다). 이제 이것은 또한 병렬로 30k 요청이 있다면, 컨트롤러 (및 해당 요청 스코프 프로바이더)의 30k 임시 인스턴스가 있을 것이라는 것을 의미합니다.

대부분의 프로바이더가 의존하는 공통 프로바이더(데이터베이스 연결 또는 로거 서비스)를 가지는 것은 모든 프로바이더를 암묵적으로 요청 스코프 프로바이더로 변환합니다. 이는 **다중 테넌트 애플리케이션**에서 특히 어려움을 초래할 수 있으며, 특히 요청 객체에서 헤더/토큰을 가져와 그 값을 기반으로 해당 데이터베이스 연결/스키마(해당 테넌트별)를 검색하는 중앙 집중식 요청 스코프 "데이터 소스" 프로바이더를 가진 애플리케이션에서 더욱 그렇습니다.

예를 들어, 10명의 다른 고객이 번갈아 사용하는 애플리케이션이 있다고 가정해 봅시다. 각 고객은 **자신의 전용 데이터 소스**를 가지고 있으며, 고객 A가 고객 B의 데이터베이스에 절대 접근할 수 없도록 보장하고 싶습니다. 이를 달성하는 한 가지 방법은 요청 객체를 기반으로 "현재 고객"이 누구인지 결정하고 해당 데이터베이스를 검색하는 요청 스코프 "데이터 소스" 프로바이더를 선언하는 것입니다. 이 접근 방식을 사용하면 몇 분 안에 애플리케이션을 다중 테넌트 애플리케이션으로 전환할 수 있습니다. 그러나 이 접근 방식의 주요 단점은 대부분의 애플리케이션 구성 요소가 "데이터 소스" 프로바이더에 의존할 가능성이 높기 때문에 암묵적으로 "요청 스코프"가 되어 앱 성능에 분명히 영향을 미치게 된다는 것입니다.

하지만 더 나은 해결책이 있다면 어떨까요? 고객이 10명뿐이라면, (요청당 각 트리를 다시 생성하는 대신) 고객당 10개의 개별 [DI 서브 트리](/fundamentals/module-ref#resolving-scoped-providers)를 가질 수는 없을까요? 프로바이더가 (예: 요청 UUID) 각 연속 요청에 대해 진정으로 고유한 속성에 의존하는 것이 아니라, 대신 집계(분류)할 수 있는 특정 속성이 있다면, 들어오는 모든 요청에서 _DI 서브 트리를 다시 생성_할 이유가 없습니다.

그리고 바로 이때 **durable 프로바이더**가 유용하게 사용됩니다.

프로바이더를 durable로 플래그하기 전에, 먼저 Nest에 "공통 요청 속성"이 무엇인지 지시하는 **전략**을 등록해야 합니다. 이 전략은 요청을 그룹화하고 해당 DI 서브 트리와 연결하는 로직을 제공합니다.

```typescript
import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // 트리가 durable하지 않으면 원래의 "contextId" 객체를 반환합니다.
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? tenantSubTreeId : contextId;
  }
}
```

> info **힌트** 요청 스코프와 유사하게, durability는 인젝션 체인을 따라 위로 버블링됩니다. 즉, A가 durable로 플래그된 B에 의존하면, A는 암묵적으로 durable이 됩니다 (A 프로바이더에 대해 `durable`이 명시적으로 `false`로 설정되지 않은 경우).

> warning **경고** 이 전략은 많은 수의 테넌트로 운영되는 애플리케이션에는 이상적이지 않다는 점에 유의하세요.

`attach` 메서드에서 반환된 값은 Nest에 주어진 호스트에 대해 어떤 컨텍스트 식별자가 사용되어야 하는지 지시합니다. 이 경우, 호스트 컴포넌트(예: 요청 스코프 컨트롤러)가 durable로 플래그될 때 원래 자동 생성된 `contextId` 객체 대신 `tenantSubTreeId`가 사용되어야 한다고 지정했습니다 (아래에서 프로바이더를 durable로 표시하는 방법을 배울 수 있습니다). 또한, 위 예제에서는 페이로드(payload = "루트" - 서브 트리의 부모를 나타내는 `REQUEST`/`CONTEXT` 프로바이더)가 등록되지 않습니다.

durable 트리에 대한 페이로드를 등록하고 싶다면, 대신 다음 구성을 사용하세요:

```typescript
// `AggregateByTenantContextIdStrategy#attach` 메서드의 반환:
return {
  resolve: (info: HostComponentInfo) =>
    info.isTreeDurable ? tenantSubTreeId : contextId,
  payload: { tenantId },
};
```

이제 `@Inject(REQUEST)`/`@Inject(CONTEXT)`를 사용하여 `REQUEST` 프로바이더(또는 GraphQL 애플리케이션의 경우 `CONTEXT`)를 인젝션할 때마다, `payload` 객체가 인젝션됩니다 (이 경우 단일 속성 - `tenantId`로 구성됨).

자, 이 전략이 준비되었으니, 어디에든 코드에 등록할 수 있습니다 (어쨌든 전역적으로 적용되므로). 예를 들어, `main.ts` 파일에 배치할 수 있습니다:

```typescript
ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
```

> info **힌트** `ContextIdFactory` 클래스는 `@nestjs/core` 패키지에서 임포트됩니다.

애플리케이션에 어떤 요청이 들어오기 전에 등록이 이루어진다면, 모든 것이 의도한 대로 작동할 것입니다.

마지막으로, 일반 프로바이더를 durable 프로바이더로 전환하려면 단순히 `durable` 플래그를 `true`로 설정하고 스코프를 `Scope.REQUEST`로 변경하세요 (REQUEST 스코프가 인젝션 체인에 이미 있는 경우 필요하지 않습니다):

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
```

마찬가지로, [커스텀 프로바이더](/fundamentals/custom-providers)의 경우, 프로바이더 등록을 위한 긴 형식에서 `durable` 속성을 설정하세요:

```typescript
{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}
```
