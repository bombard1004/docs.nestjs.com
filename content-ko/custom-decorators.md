### 커스텀 라우트 데코레이터

Nest는 **데코레이터**라고 불리는 언어 기능을 중심으로 구축되어 있습니다. 데코레이터는 많은 일반적인 프로그래밍 언어에서 잘 알려진 개념이지만, JavaScript 세계에서는 비교적 새로운 개념입니다. 데코레이터가 어떻게 작동하는지 더 잘 이해하기 위해 [이 문서](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841)를 읽어보시는 것을 권장합니다. 간단한 정의는 다음과 같습니다:

<blockquote class="external">
  ES2016 데코레이터는 함수를 반환하는 표현식으로, 타겟, 이름, 속성 디스크립터를 인수로 받을 수 있습니다.
  데코레이터를 사용하려면 데코레이터 접두사 <code>@</code> 문자를 붙이고 꾸미려는 대상 바로 위에 배치합니다. 데코레이터는 클래스, 메서드 또는 속성에 대해 정의할 수 있습니다.
</blockquote>

#### 매개변수 데코레이터

Nest는 HTTP 라우트 핸들러와 함께 사용할 수 있는 유용한 **매개변수 데코레이터** 세트를 제공합니다. 아래는 제공되는 데코레이터와 해당 데코레이터가 나타내는 순수 Express (또는 Fastify) 객체의 목록입니다.

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td>
    </tr>
    <tr>
      <td><code>@Response(), @Res()</code></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(param?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[param]</code></td>
    </tr>
    <tr>
      <td><code>@Body(param?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[param]</code></td>
    </tr>
    <tr>
      <td><code>@Query(param?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[param]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(param?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[param]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam()</code></td>
      <td><code>req.hosts</code></td>
    </tr>
  </tbody>
</table>

또한, 여러분만의 **커스텀 데코레이터**를 만들 수 있습니다. 왜 이것이 유용할까요?

node.js 세계에서는 **request** 객체에 속성을 붙이는 것이 일반적인 관행입니다. 그런 다음 각 라우트 핸들러에서 다음 코드와 같이 수동으로 추출합니다.

```typescript
const user = req.user;
```

코드를 더 읽기 쉽고 투명하게 만들기 위해 `@User()` 데코레이터를 만들어 모든 컨트롤러에서 재사용할 수 있습니다.

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

그런 다음 요구사항에 맞는 곳 어디에서든 간단히 사용할 수 있습니다.

```typescript
@@filename()
@Get()
async findOne(@User() user: UserEntity) {
  console.log(user);
}
@@switch
@Get()
@Bind(User())
async findOne(user) {
  console.log(user);
}
```

#### 데이터 전달하기

데코레이터의 동작이 일부 조건에 의존하는 경우, `data` 매개변수를 사용하여 데코레이터의 팩토리 함수에 인수를 전달할 수 있습니다. 이 경우의 한 가지 사용 사례는 키로 request 객체에서 속성을 추출하는 커스텀 데코레이터입니다. 예를 들어, 저희 <a href="techniques/authentication#implementing-passport-strategies">인증 레이어</a>가 요청을 검증하고 request 객체에 user 엔티티를 붙인다고 가정해 봅시다. 인증된 요청의 user 엔티티는 다음과 같을 수 있습니다.

```json
{
  "id": 101,
  "firstName": "Alan",
  "lastName": "Turing",
  "email": "alan@email.com",
  "roles": ["admin"]
}
```

속성 이름을 키로 받고, 해당 값이 존재하면 관련 값을 반환하고 (또는 존재하지 않거나 `user` 객체가 생성되지 않은 경우 undefined를 반환하는) 데코레이터를 정의해 보겠습니다.

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
@@switch
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user && user[data] : user;
});
```

컨트롤러의 `@User()` 데코레이터를 통해 특정 속성에 접근하는 방법은 다음과 같습니다.

```typescript
@@filename()
@Get()
async findOne(@User('firstName') firstName: string) {
  console.log(`Hello ${firstName}`);
}
@@switch
@Get()
@Bind(User('firstName'))
async findOne(firstName) {
  console.log(`Hello ${firstName}`);
}
```

이 동일한 데코레이터를 다른 키와 함께 사용하여 다른 속성에 접근할 수 있습니다. `user` 객체가 깊거나 복잡한 경우, 이렇게 하면 요청 핸들러 구현을 더 쉽고 읽기 쉽게 만들 수 있습니다.

> info **힌트** TypeScript 사용자의 경우 `createParamDecorator<T>()`는 제네릭이라는 점에 유의하세요. 이는 명시적으로 타입 안전성을 강제할 수 있음을 의미합니다. 예를 들어 `createParamDecorator<string>((data, ctx) => ...)`와 같이 사용할 수 있습니다. 또는 팩토리 함수에서 매개변수 타입을 지정할 수 있습니다. 예를 들어 `createParamDecorator((data: string, ctx) => ...)`와 같이 사용할 수 있습니다. 둘 다 생략하면 `data`의 타입은 `any`가 됩니다.

#### 파이프 사용하기

Nest는 커스텀 매개변수 데코레이터를 내장 데코레이터 (`@Body()`, `@Param()`, `@Query()`)와 동일하게 취급합니다. 즉, 커스텀으로 어노테이션된 매개변수에도 파이프가 실행됩니다 (예제에서는 `user` 인수). 더욱이, 파이프를 커스텀 데코레이터에 직접 적용할 수 있습니다.

```typescript
@@filename()
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {
  console.log(user);
}
@@switch
@Get()
@Bind(User(new ValidationPipe({ validateCustomDecorators: true })))
async findOne(user) {
  console.log(user);
}
```

> info **힌트** `validateCustomDecorators` 옵션은 true로 설정되어야 합니다. `ValidationPipe`는 기본적으로 커스텀 데코레이터로 어노테이션된 인수를 검증하지 않습니다.

#### 데코레이터 조합

Nest는 여러 데코레이터를 조합하는 헬퍼 메서드를 제공합니다. 예를 들어, 인증과 관련된 모든 데코레이터를 하나의 데코레이터로 결합하고 싶다고 가정해 봅시다. 이는 다음 구조를 사용하여 수행할 수 있습니다.

```typescript
@@filename(auth.decorator)
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
@@switch
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
```

그런 다음 이 커스텀 `@Auth()` 데코레이터를 다음과 같이 사용할 수 있습니다.

```typescript
@Get('users')
@Auth('admin')
findAllUsers() {}
```

이는 단일 선언으로 네 가지 데코레이터를 모두 적용하는 효과를 가집니다.

> warning **경고** `@nestjs/swagger` 패키지의 `@ApiHideProperty()` 데코레이터는 조합 가능하지 않으며 `applyDecorators` 함수와 함께 제대로 작동하지 않습니다.