### 실행 컨텍스트

Nest는 여러 애플리케이션 컨텍스트(예: Nest HTTP 서버 기반, 마이크로서비스 및 웹소켓 애플리케이션 컨텍스트)에서 작동하는 애플리케이션을 쉽게 작성할 수 있도록 돕는 몇 가지 유틸리티 클래스를 제공합니다. 이러한 유틸리티는 현재 실행 컨텍스트에 대한 정보를 제공하며, 이를 사용하여 광범위한 컨트롤러, 메서드 및 실행 컨텍스트에서 작동할 수 있는 범용 [가드](/guards), [필터](/exception-filters) 및 [인터셉터](/interceptors)를 구축할 수 있습니다.

이 장에서는 이러한 두 클래스, 즉 `ArgumentsHost`와 `ExecutionContext`에 대해 다룹니다.

#### ArgumentsHost 클래스

`ArgumentsHost` 클래스는 핸들러에 전달되는 인수를 검색하는 메서드를 제공합니다. 이를 통해 인수를 가져올 적절한 컨텍스트(예: HTTP, RPC (마이크로서비스) 또는 웹소켓)를 선택할 수 있습니다. 프레임워크는 `ArgumentsHost` 인스턴스를 제공하며, 일반적으로 `host` 매개변수로 참조되어 필요에 따라 액세스할 수 있습니다. 예를 들어, [예외 필터](https://nestjs.dokidocs.dev/exception-filters#arguments-host)의 `catch()` 메서드는 `ArgumentsHost` 인스턴스와 함께 호출됩니다.

`ArgumentsHost`는 단순히 핸들러의 인수에 대한 추상화 역할을 합니다. 예를 들어, HTTP 서버 애플리케이션의 경우 (`@nestjs/platform-express`가 사용될 때), `host` 객체는 Express의 `[request, response, next]` 배열을 캡슐화하며, 여기서 `request`는 요청 객체, `response`는 응답 객체, `next`는 애플리케이션의 요청-응답 주기를 제어하는 함수입니다. 반면에, [GraphQL](/graphql/quick-start) 애플리케이션의 경우, `host` 객체는 `[root, args, context, info]` 배열을 포함합니다.

#### 현재 애플리케이션 컨텍스트

여러 애플리케이션 컨텍스트에서 실행되도록 설계된 범용 [가드](/guards), [필터](/exception-filters) 및 [인터셉터](/interceptors)를 구축할 때는 현재 메서드가 실행되는 애플리케이션의 유형을 결정할 방법이 필요합니다. 이를 위해 `ArgumentsHost`의 `getType()` 메서드를 사용합니다:

```typescript
if (host.getType() === 'http') {
  // 일반 HTTP 요청(REST) 컨텍스트에서만 중요한 작업을 수행합니다.
} else if (host.getType() === 'rpc') {
  // 마이크로서비스 요청 컨텍스트에서만 중요한 작업을 수행합니다.
} else if (host.getType<GqlContextType>() === 'graphql') {
  // GraphQL 요청 컨텍스트에서만 중요한 작업을 수행합니다.
}
```

> info **힌트** `GqlContextType`은 `@nestjs/graphql` 패키지에서 가져옵니다.

애플리케이션 유형을 알 수 있게 되면 아래에 나타낸 것처럼 더 일반적인 구성 요소를 작성할 수 있습니다.

#### 호스트 핸들러 인수

핸들러에 전달되는 인수의 배열을 검색하는 한 가지 방법은 호스트 객체의 `getArgs()` 메서드를 사용하는 것입니다.

```typescript
const [req, res, next] = host.getArgs();
```

`getArgByIndex()` 메서드를 사용하여 인덱스로 특정 인수를 선택할 수 있습니다:

```typescript
const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);
```

이 예제에서는 인덱스로 요청 및 응답 객체를 검색했는데, 이는 애플리케이션을 특정 실행 컨텍스트에 결합시키므로 일반적으로 권장되지 않습니다. 대신, 애플리케이션에 맞는 적절한 애플리케이션 컨텍스트로 전환하기 위해 `host` 객체의 유틸리티 메서드 중 하나를 사용하여 코드를 더 견고하고 재사용 가능하게 만들 수 있습니다. 컨텍스트 전환 유틸리티 메서드는 아래에 나와 있습니다.

```typescript
/**
 * RPC 컨텍스트로 전환합니다.
 */
switchToRpc(): RpcArgumentsHost;
/**
 * HTTP 컨텍스트로 전환합니다.
 */
switchToHttp(): HttpArgumentsHost;
/**
 * 웹소켓 컨텍스트로 전환합니다.
 */
switchToWs(): WsArgumentsHost;
```

`switchToHttp()` 메서드를 사용하여 이전 예제를 다시 작성해 보겠습니다. `host.switchToHttp()` 헬퍼 호출은 HTTP 애플리케이션 컨텍스트에 적합한 `HttpArgumentsHost` 객체를 반환합니다. `HttpArgumentsHost` 객체에는 원하는 객체를 추출하는 데 사용할 수 있는 두 가지 유용한 메서드가 있습니다. 이 경우 네이티브 Express 타입 객체를 반환하기 위해 Express 타입 어설션도 사용합니다:

```typescript
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
```

마찬가지로 `WsArgumentsHost`와 `RpcArgumentsHost`는 마이크로서비스 및 웹소켓 컨텍스트에서 적절한 객체를 반환하는 메서드를 가지고 있습니다. `WsArgumentsHost`에 대한 메서드는 다음과 같습니다:

```typescript
export interface WsArgumentsHost {
  /**
   * 데이터 객체를 반환합니다.
   */
  getData<T>(): T;
  /**
   * 클라이언트 객체를 반환합니다.
   */
  getClient<T>(): T;
}
```

다음은 `RpcArgumentsHost`에 대한 메서드입니다:

```typescript
export interface RpcArgumentsHost {
  /**
   * 데이터 객체를 반환합니다.
   */
  getData<T>(): T;

  /**
   * 컨텍스트 객체를 반환합니다.
   */
  getContext<T>(): T;
}
```

#### ExecutionContext 클래스

`ExecutionContext`는 `ArgumentsHost`를 확장하여 현재 실행 프로세스에 대한 추가 정보를 제공합니다. `ArgumentsHost`와 마찬가지로 Nest는 필요한 곳에 `ExecutionContext` 인스턴스를 제공합니다. 예를 들어, [가드](https://nestjs.dokidocs.dev/guards#execution-context)의 `canActivate()` 메서드와 [인터셉터](https://nestjs.dokidocs.dev/interceptors#execution-context)의 `intercept()` 메서드에 제공됩니다. 다음과 같은 메서드를 제공합니다:

```typescript
export interface ExecutionContext extends ArgumentsHost {
  /**
   * 현재 핸들러가 속한 컨트롤러 클래스의 유형을 반환합니다.
   */
  getClass<T>(): Type<T>;
  /**
   * 요청 파이프라인에서 다음에 호출될 핸들러(메서드)에 대한 참조를 반환합니다.
   */
  getHandler(): Function;
}
```

`getHandler()` 메서드는 호출될 핸들러에 대한 참조를 반환합니다. `getClass()` 메서드는 해당 핸들러가 속한 `Controller` 클래스의 유형을 반환합니다. 예를 들어, HTTP 컨텍스트에서 현재 처리되는 요청이 `CatsController`의 `create()` 메서드에 바인딩된 `POST` 요청인 경우, `getHandler()`는 `create()` 메서드에 대한 참조를 반환하고 `getClass()`는 `CatsController` **클래스**(인스턴스가 아닌)를 반환합니다.

```typescript
const methodKey = ctx.getHandler().name; // "create"
const className = ctx.getClass().name; // "CatsController"
```

현재 클래스와 핸들러 메서드 모두에 대한 참조에 액세스할 수 있는 능력은 뛰어난 유연성을 제공합니다. 가장 중요한 것은 `Reflector#createDecorator`를 통해 생성된 데코레이터 또는 가드 또는 인터셉터 내에서 내장 `@SetMetadata()` 데코레이터를 통해 설정된 메타데이터에 액세스할 기회를 제공한다는 것입니다. 아래에서 이 사용 사례를 다룹니다.

<app-banner-enterprise></app-banner-enterprise>

#### 리플렉션 및 메타데이터

Nest는 `Reflector#createDecorator` 메서드를 통해 생성된 데코레이터와 내장 `@SetMetadata()` 데코레이터를 통해 라우트 핸들러에 **커스텀 메타데이터**를 첨부하는 기능을 제공합니다. 이 섹션에서는 두 가지 접근 방식을 비교하고 가드 또는 인터셉터 내에서 메타데이터에 액세스하는 방법을 살펴봅니다.

`Reflector#createDecorator`를 사용하여 강력한 타입의 데코레이터를 만들려면 타입 인수를 지정해야 합니다. 예를 들어, 문자열 배열을 인수로 받는 `Roles` 데코레이터를 만들어 보겠습니다.

```ts
@@filename(roles.decorator)
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

여기서 `Roles` 데코레이터는 `string[]` 타입의 단일 인수를 받는 함수입니다.

이제 이 데코레이터를 사용하려면 단순히 핸들러에 이를 어노테이션하면 됩니다:

```typescript
@@filename(cats.controller)
@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

여기서 `create()` 메서드에 `Roles` 데코레이터 메타데이터를 첨부하여, `admin` 역할을 가진 사용자만 이 라우트에 액세스할 수 있도록 했습니다.

라우트의 역할(들) (커스텀 메타데이터)에 액세스하려면 `Reflector` 헬퍼 클래스를 다시 사용합니다. `Reflector`는 일반적인 방식으로 클래스에 주입할 수 있습니다:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **힌트** `Reflector` 클래스는 `@nestjs/core` 패키지에서 가져옵니다.

이제 핸들러 메타데이터를 읽으려면 `get()` 메서드를 사용합니다:

```typescript
const roles = this.reflector.get(Roles, context.getHandler());
```

`Reflector#get` 메서드는 두 인수를 전달하여 메타데이터에 쉽게 액세스할 수 있도록 합니다: 데코레이터 참조 및 메타데이터를 검색할 **컨텍스트** (데코레이터 대상). 이 예제에서 지정된 **데코레이터**는 `Roles`입니다 (위의 `roles.decorator.ts` 파일을 참조하십시오). 컨텍스트는 `context.getHandler()` 호출에 의해 제공되며, 현재 처리되는 라우트 핸들러에 대한 메타데이터를 추출합니다. `getHandler()`는 라우트 핸들러 함수에 대한 **참조**를 제공한다는 것을 기억하십시오.

대안으로, 컨트롤러 수준에서 메타데이터를 적용하여 컨트롤러 클래스의 모든 라우트에 적용되도록 컨트롤러를 구성할 수 있습니다.

```typescript
@@filename(cats.controller)
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
@@switch
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
```

이 경우 컨트롤러 메타데이터를 추출하려면 `context.getHandler()` 대신 두 번째 인수로 `context.getClass()`를 전달합니다 (메타데이터 추출을 위한 컨텍스트로 컨트롤러 클래스를 제공하기 위해):

```typescript
@@filename(roles.guard)
const roles = this.reflector.get(Roles, context.getClass());
```

여러 수준에서 메타데이터를 제공할 수 있으므로 여러 컨텍스트에서 메타데이터를 추출하고 병합해야 할 수 있습니다. `Reflector` 클래스는 이를 돕기 위해 사용되는 두 가지 유틸리티 메서드를 제공합니다. 이러한 메서드는 컨트롤러 및 메서드 메타데이터를 **모두** 한 번에 추출하고 다른 방식으로 결합합니다.

두 수준 모두에서 `Roles` 메타데이터를 제공하는 다음 시나리오를 고려하십시오.

```typescript
@@filename(cats.controller)
@Roles(['user'])
@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
}
@@switch
@Roles(['user'])
@Controller('cats')
export class CatsController {}
  @Post()
  @Roles(['admin'])
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }
}
```

의도가 `'user'`를 기본 역할로 지정하고 특정 메서드에 대해 선택적으로 재정의하는 것이라면, `getAllAndOverride()` 메서드를 사용할 가능성이 높습니다.

```typescript
const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
```

위 메타데이터를 가지고 `create()` 메서드의 컨텍스트에서 실행되는 이 코드를 가진 가드는 `roles`에 `['admin']`이 포함되도록 합니다.

두 메타데이터를 모두 가져와 병합하려면 (이 메서드는 배열과 객체 모두 병합합니다) `getAllAndMerge()` 메서드를 사용합니다:

```typescript
const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);
```

이렇게 하면 `roles`에 `['user', 'admin']`이 포함됩니다.

이 두 병합 메서드 모두 첫 번째 인수로 메타데이터 키를 전달하고, 두 번째 인수로 메타데이터 대상 컨텍스트 배열(예: `getHandler()` 및/또는 `getClass()` 메서드 호출)을 전달합니다.

#### 저수준 접근 방식

앞서 언급했듯이, `Reflector#createDecorator`를 사용하는 대신 내장 `@SetMetadata()` 데코레이터를 사용하여 핸들러에 메타데이터를 첨부할 수도 있습니다.

```typescript
@@filename(cats.controller)
@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@SetMetadata('roles', ['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **힌트** `@SetMetadata()` 데코레이터는 `@nestjs/common` 패키지에서 가져옵니다.

위 구성으로 `create()` 메서드에 `roles` 메타데이터 (`roles`는 메타데이터 키이고 `['admin']`은 연관된 값입니다)를 첨부했습니다. 이것은 작동하지만, `@SetMetadata()`를 라우트에서 직접 사용하는 것은 좋은 관행이 아닙니다. 대신 아래에 나타낸 것처럼 자신만의 데코레이터를 만들 수 있습니다:

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles) => SetMetadata('roles', roles);
```

이 접근 방식은 훨씬 깨끗하고 가독성이 높으며, `Reflector#createDecorator` 접근 방식과 다소 유사합니다. 차이점은 `@SetMetadata`를 사용하면 메타데이터 키와 값에 대해 더 많은 제어권을 가지며, 하나 이상의 인수를 받는 데코레이터를 만들 수 있다는 것입니다.

이제 커스텀 `@Roles()` 데코레이터가 있으므로, 이를 사용하여 `create()` 메서드를 데코레이트할 수 있습니다.

```typescript
@@filename(cats.controller)
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles('admin')
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

라우트의 역할(들) (커스텀 메타데이터)에 액세스하려면 `Reflector` 헬퍼 클래스를 다시 사용합니다:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **힌트** `Reflector` 클래스는 `@nestjs/core` 패키지에서 가져옵니다.

이제 핸들러 메타데이터를 읽으려면 `get()` 메서드를 사용합니다.

```typescript
const roles = this.reflector.get<string[]>('roles', context.getHandler());
```

여기서는 데코레이터 참조를 전달하는 대신, 첫 번째 인수로 메타데이터 **키**를 전달합니다 (이 경우 `'roles'`입니다). 다른 모든 것은 `Reflector#createDecorator` 예제와 동일합니다.