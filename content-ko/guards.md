### 가드

가드는 `@Injectable()` 데코레이터로 어노테이션된 클래스이며, `CanActivate` 인터페이스를 구현합니다.

<figure><img class="illustrative-image" src="/assets/Guards_1.png" /></figure>

가드는 **단일 책임**을 가집니다. 가드는 런타임에 존재하는 특정 조건(권한, 역할, ACL 등)에 따라 주어진 요청이 라우트 핸들러에 의해 처리될지 여부를 결정합니다. 이는 종종 **권한 부여(authorization)**라고 불립니다. 권한 부여(그리고 보통 함께 사용되는 관련 개념인 **인증(authentication)**)는 전통적인 Express 애플리케이션에서 일반적으로 [미들웨어](/middleware)에 의해 처리되었습니다. 토큰 유효성 검사 및 `request` 객체에 속성 연결과 같은 작업은 특정 라우트 컨텍스트(및 해당 메타데이터)와 밀접하게 연결되어 있지 않으므로 미들웨어는 인증에 적합한 선택입니다.

하지만 미들웨어는 본질적으로 덜 똑똑합니다. `next()` 함수를 호출한 후 어떤 핸들러가 실행될지 알지 못합니다. 반면에 **가드**는 `ExecutionContext` 인스턴스에 접근할 수 있어 다음에 무엇이 정확히 실행될지 알고 있습니다. 예외 필터, 파이프, 인터셉터와 마찬가지로 가드는 요청/응답 사이클의 정확한 지점에 처리 로직을 삽입하고 이를 선언적으로 수행할 수 있도록 설계되었습니다. 이는 코드를 DRY하고 선언적으로 유지하는 데 도움이 됩니다.

> info **힌트** 가드는 모든 미들웨어 **다음**에 실행되지만, 인터셉터나 파이프 **이전**에 실행됩니다.

#### 권한 부여 가드

앞서 언급했듯이, 특정 라우트는 호출자(일반적으로 특정 인증된 사용자)가 충분한 권한을 가질 때만 사용할 수 있어야 하므로 **권한 부여**는 가드를 사용하기 좋은 사례입니다. 이제 만들 `AuthGuard`는 인증된 사용자(따라서 요청 헤더에 토큰이 첨부됨)를 가정합니다. 이 가드는 토큰을 추출하고 유효성을 검사하며, 추출된 정보를 사용하여 요청이 진행될 수 있는지 여부를 결정합니다.

```typescript
@@filename(auth.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard {
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

> info **힌트** 애플리케이션에 인증 메커니즘을 구현하는 실제 예시를 찾고 있다면, [이 챕터](/security/authentication)를 방문하십시오. 마찬가지로, 더 정교한 권한 부여 예시는 [이 페이지](/security/authorization)를 확인하십시오.

`validateRequest()` 함수 내의 로직은 필요에 따라 간단하거나 복잡할 수 있습니다. 이 예제의 주요 목적은 가드가 요청/응답 사이클에 어떻게 맞춰지는지 보여주는 것입니다.

모든 가드는 `canActivate()` 함수를 구현해야 합니다. 이 함수는 현재 요청이 허용되는지 여부를 나타내는 불리언(boolean) 값을 반환해야 합니다. 반환 값은 동기적으로 또는 비동기적으로(`Promise` 또는 `Observable`을 통해) 반환될 수 있습니다. Nest는 반환 값을 사용하여 다음 동작을 제어합니다.

- `true`를 반환하면 요청이 처리됩니다.
- `false`를 반환하면 Nest는 요청을 거부합니다.

<app-banner-enterprise></app-banner-enterprise>

#### 실행 컨텍스트

`canActivate()` 함수는 단 하나의 인수인 `ExecutionContext` 인스턴스를 받습니다. `ExecutionContext`는 `ArgumentsHost`를 상속합니다. 예외 필터 챕터에서 `ArgumentsHost`에 대해 이전에 살펴봤습니다. 위 예제에서는 이전에 사용했던 `ArgumentsHost`에 정의된 동일한 헬퍼 메소드를 사용하여 `Request` 객체에 대한 참조를 얻고 있습니다. 이 주제에 대해 더 자세히 알아보려면 [예외 필터](https://nestjs.dokidocs.dev/exception-filters#arguments-host) 챕터의 **Arguments host** 섹션을 참조하십시오.

`ArgumentsHost`를 확장함으로써 `ExecutionContext`는 현재 실행 프로세스에 대한 추가 정보를 제공하는 여러 새로운 헬퍼 메소드를 추가합니다. 이러한 세부 정보는 광범위한 컨트롤러, 메소드 및 실행 컨텍스트에서 작동할 수 있는 보다 일반적인 가드를 구축하는 데 유용할 수 있습니다. `ExecutionContext`에 대해 더 자세히 알아보려면 [여기](/fundamentals/execution-context)를 참조하십시오.

#### 역할 기반 인증

특정 역할을 가진 사용자에게만 접근을 허용하는 더 기능적인 가드를 만들어 보겠습니다. 기본적인 가드 템플릿부터 시작하여 다음 섹션에서 이를 기반으로 구축할 것입니다. 지금은 모든 요청이 진행되도록 허용합니다.

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard {
  canActivate(context) {
    return true;
  }
}
```

#### 가드 바인딩

파이프 및 예외 필터와 마찬가지로 가드는 **컨트롤러 범위**, 메소드 범위 또는 전역 범위일 수 있습니다. 아래에서 `@UseGuards()` 데코레이터를 사용하여 컨트롤러 범위 가드를 설정합니다. 이 데코레이터는 단일 인수를 받거나 쉼표로 구분된 인수 목록을 받을 수 있습니다. 이를 통해 하나의 선언으로 적절한 가드 집합을 쉽게 적용할 수 있습니다.

```typescript
@@filename()
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
```

> info **힌트** `@UseGuards()` 데코레이터는 `@nestjs/common` 패키지에서 가져옵니다.

위에서는 `RolesGuard` 클래스(인스턴스 대신)를 전달하여 인스턴스화 책임을 프레임워크에 맡기고 의존성 주입을 가능하게 했습니다. 파이프 및 예외 필터와 마찬가지로 즉석에서 인스턴스를 전달할 수도 있습니다.

```typescript
@@filename()
@Controller('cats')
@UseGuards(new RolesGuard())
export class CatsController {}
```

위의 코드는 이 컨트롤러에 의해 선언된 모든 핸들러에 가드를 첨부합니다. 가드를 단일 메소드에만 적용하려면 **메소드 레벨**에서 `@UseGuards()` 데코레이터를 적용합니다.

전역 가드를 설정하려면 Nest 애플리케이션 인스턴스의 `useGlobalGuards()` 메소드를 사용하십시오.

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new RolesGuard());
```

> warning **주의** 하이브리드 앱의 경우 `useGlobalGuards()` 메소드는 기본적으로 게이트웨이 및 마이크로서비스에 대한 가드를 설정하지 않습니다([하이브리드 애플리케이션](/faq/hybrid-application)에서 이 동작 변경 방법에 대한 정보를 확인하십시오). "표준"(비하이브리드) 마이크로서비스 앱의 경우 `useGlobalGuards()`는 가드를 전역적으로 마운트합니다.

전역 가드는 애플리케이션 전체에서 모든 컨트롤러와 모든 라우트 핸들러에 대해 사용됩니다. 의존성 주입 관점에서 볼 때, 어떤 모듈 외부에서(위 예제처럼 `useGlobalGuards()`로) 등록된 전역 가드는 어떤 모듈의 컨텍스트 외부에서 수행되기 때문에 의존성을 주입할 수 없습니다. 이 문제를 해결하기 위해 다음 구조를 사용하여 어떤 모듈에서든 직접 가드를 설정할 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

> info **힌트** 이 접근 방식을 사용하여 가드의 의존성 주입을 수행할 때, 이 구조가 사용되는 모듈에 관계없이 가드는 실제로 전역이라는 점에 유의하십시오. 어디서 수행해야 할까요? 가드(위 예제의 `RolesGuard`)가 정의된 모듈을 선택하십시오. 또한 `useClass`는 커스텀 프로바이더 등록을 다루는 유일한 방법이 아닙니다. [여기](/fundamentals/custom-providers)에서 더 자세히 알아보십시오.

#### 핸들러별 역할 설정

`RolesGuard`는 작동하지만 아직 그다지 스마트하지는 않습니다. 가드의 가장 중요한 기능인 [실행 컨텍스트](/fundamentals/execution-context)를 아직 활용하고 있지 않습니다. 역할에 대해 아직 모르거나, 각 핸들러에 어떤 역할이 허용되는지 알지 못합니다. 예를 들어, `CatsController`는 다른 라우트에 대해 다른 권한 체계를 가질 수 있습니다. 일부는 관리자 사용자에게만 제공될 수 있고, 다른 일부는 모든 사람에게 열려 있을 수 있습니다. 유연하고 재사용 가능한 방식으로 역할을 라우트와 어떻게 매칭할 수 있을까요?

여기서 **커스텀 메타데이터**가 활용됩니다([여기](https://nestjs.dokidocs.dev/fundamentals/execution-context#reflection-and-metadata)에서 자세히 알아보십시오). Nest는 `Reflector.createDecorator` 정적 메소드를 통해 생성된 데코레이터나 내장된 `@SetMetadata()` 데코레이터를 통해 라우트 핸들러에 커스텀 **메타데이터**를 첨부하는 기능을 제공합니다.

예를 들어, `Reflector.createDecorator` 메소드를 사용하여 핸들러에 메타데이터를 첨부할 `@Roles()` 데코레이터를 생성해 보겠습니다. `Reflector`는 프레임워크에 의해 기본적으로 제공되며 `@nestjs/core` 패키지에서 노출됩니다.

```ts
@@filename(roles.decorator)
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

여기서 `Roles` 데코레이터는 `string[]` 타입의 단일 인수를 받는 함수입니다.

이제 이 데코레이터를 사용하려면 핸들러에 단순히 어노테이션을 지정합니다.

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

여기서는 `create()` 메소드에 `Roles` 데코레이터 메타데이터를 첨부하여 `admin` 역할을 가진 사용자만 이 라우트에 접근할 수 있도록 지정했습니다.

대안으로, `Reflector.createDecorator` 메소드 대신 내장된 `@SetMetadata()` 데코레이터를 사용할 수 있습니다. [여기](/fundamentals/execution-context#low-level-approach)에서 자세히 알아보십시오.

#### 종합

이제 돌아가서 `RolesGuard`와 이를 연결해 봅시다. 현재는 모든 경우에 단순히 `true`를 반환하여 모든 요청이 진행되도록 허용합니다. 반환 값을 **현재 사용자에게 할당된 역할**과 처리 중인 현재 라우트에 필요한 실제 역할을 비교하는 조건에 따라 결정되도록 만들고 싶습니다. 라우트의 역할(들)(커스텀 메타데이터)에 접근하기 위해 다음과 같이 `Reflector` 헬퍼 클래스를 다시 사용할 것입니다.

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
```

> info **힌트** Node.js 세계에서는 승인된 사용자를 `request` 객체에 첨부하는 것이 일반적입니다. 따라서 위의 예제 코드에서는 `request.user`에 사용자 인스턴스와 허용된 역할이 포함되어 있다고 가정합니다. 여러분의 앱에서는 커스텀 **인증 가드**(또는 미들웨어)에서 해당 연결을 만들 것입니다. 이 주제에 대한 자세한 내용은 [이 챕터](/security/authentication)를 확인하십시오.

> warning **경고** `matchRoles()` 함수 내부의 로직은 필요에 따라 간단하거나 복잡할 수 있습니다. 이 예제의 주요 목적은 가드가 요청/응답 사이클에 어떻게 맞춰지는지 보여주는 것입니다.

컨텍스트에 민감한 방식으로 `Reflector`를 활용하는 방법에 대한 자세한 내용은 **실행 컨텍스트** 챕터의 <a href="https://nestjs.dokidocs.dev/fundamentals/execution-context#reflection-and-metadata">반영(Reflection) 및 메타데이터</a> 섹션을 참조하십시오.

권한이 부족한 사용자가 엔드포인트를 요청하면 Nest는 자동으로 다음 응답을 반환합니다.

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

참고로, 가드가 내부적으로 `false`를 반환하면 프레임워크는 `ForbiddenException`을 발생시킵니다. 다른 오류 응답을 반환하고 싶다면 자신만의 특정 예외를 발생시켜야 합니다. 예를 들어:

```typescript
throw new UnauthorizedException();
```

가드에 의해 발생된 예외는 [예외 계층](/exception-filters)(전역 예외 필터 및 현재 컨텍스트에 적용된 모든 예외 필터)에 의해 처리됩니다.

> info **힌트** 권한 부여를 구현하는 실제 예시를 찾고 있다면, [이 챕터](/security/authorization)를 확인하십시오.
