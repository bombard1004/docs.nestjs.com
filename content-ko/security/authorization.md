### 권한 부여 (Authorization)

**권한 부여(Authorization)**는 사용자가 무엇을 할 수 있는지 결정하는 프로세스를 말합니다. 예를 들어, 관리자 권한이 있는 사용자는 게시물을 생성, 편집 및 삭제할 수 있습니다. 관리자가 아닌 사용자는 게시물을 읽는 것만 허용됩니다.

권한 부여는 인증과 직교하며 독립적입니다. 하지만 권한 부여는 인증 메커니즘을 필요로 합니다.

권한 부여를 처리하는 다양한 접근 방식과 전략이 있습니다. 모든 프로젝트에서 채택하는 접근 방식은 특정 애플리케이션 요구 사항에 따라 달라집니다. 이 장에서는 다양한 요구 사항에 맞게 조정할 수 있는 몇 가지 권한 부여 접근 방식을 소개합니다.

#### 기본적인 RBAC 구현

역할 기반 접근 제어(**RBAC**)는 역할과 권한을 중심으로 정의된 정책 중립적인 접근 제어 메커니즘입니다. 이 섹션에서는 Nest의 [가드](/guards)를 사용하여 매우 기본적인 RBAC 메커니즘을 구현하는 방법을 보여줍니다.

먼저, 시스템의 역할을 나타내는 `Role` 열거형을 생성해 보겠습니다:

```typescript
@@filename(role.enum)
export enum Role {
  User = 'user',
  Admin = 'admin',
}
```

> info **힌트** 더 복잡한 시스템에서는 데이터베이스에 역할을 저장하거나 외부 인증 제공자로부터 가져올 수 있습니다.

이를 바탕으로 `@Roles()` 데코레이터를 생성할 수 있습니다. 이 데코레이터는 특정 리소스에 접근하는 데 필요한 역할을 지정할 수 있게 해줍니다.

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
```

이제 사용자 정의 `@Roles()` 데코레이터가 있으므로, 이를 사용하여 모든 라우트 핸들러를 데코레이트할 수 있습니다.

```typescript
@@filename(cats.controller)
@Post()
@Roles(Role.Admin)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(Role.Admin)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

마지막으로, 현재 사용자에게 할당된 역할을 현재 처리 중인 라우트에 필요한 실제 역할과 비교하는 `RolesGuard` 클래스를 생성합니다. 라우트의 역할(사용자 정의 메타데이터)에 접근하기 위해, 프레임워크에서 기본으로 제공되고 `@nestjs/core` 패키지에서 노출되는 `Reflector` 헬퍼 클래스를 사용합니다.

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
```

> info **힌트** 컨텍스트에 민감한 방식으로 `Reflector`를 활용하는 방법에 대한 자세한 내용은 실행 컨텍스트 장의 [리플렉션 및 메타데이터](/fundamentals/execution-context#reflection-and-metadata) 섹션을 참조하세요.

> warning **주의** 이 예제는 라우트 핸들러 수준에서 역할의 존재 여부만 확인하기 때문에 "**기본적**"이라고 명명되었습니다. 실제 애플리케이션에서는 여러 작업과 관련된 엔드포인트/핸들러가 있을 수 있으며, 각 작업은 특정 권한 세트를 요구할 수 있습니다. 이 경우, 비즈니스 로직 내 어딘가에서 역할을 확인하는 메커니즘을 제공해야 하며, 특정 작업과 권한을 연결하는 중앙 집중식 장소가 없으므로 유지 관리가 다소 어려워집니다.

이 예제에서는 `request.user`가 사용자 인스턴스와 허용된 역할(`roles` 속성 아래)을 포함한다고 가정했습니다. 애플리케이션에서는 [인증](/security/authentication) 장에서 자세히 설명된 사용자 정의 **인증 가드**에서 해당 연결을 수행할 것입니다.

이 예제가 작동하도록 하려면 `User` 클래스가 다음과 같이 보여야 합니다:

```typescript
class User {
  // ...other properties
  roles: Role[];
}
```

마지막으로, `RolesGuard`를 예를 들어 컨트롤러 수준 또는 전역으로 등록해야 합니다:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```

권한이 부족한 사용자가 엔드포인트를 요청하면 Nest는 자동으로 다음 응답을 반환합니다:

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

> info **힌트** 다른 오류 응답을 반환하고 싶다면, 불리언 값을 반환하는 대신 사용자 지정 예외를 던져야 합니다.

<app-banner-courses-auth></app-banner-courses-auth>

#### 클레임 기반 권한 부여

ID가 생성될 때, 신뢰할 수 있는 당사자가 발급한 하나 이상의 클레임이 할당될 수 있습니다. 클레임은 주체가 무엇을 할 수 있는지 나타내는 이름-값 쌍이며, 주체가 무엇인지는 나타내지 않습니다.

Nest에서 클레임 기반 권한 부여를 구현하려면, 위 [RBAC](/security/authorization#basic-rbac-implementation) 섹션에서 보여준 것과 동일한 단계를 따르되 한 가지 중요한 차이점이 있습니다: 특정 역할을 확인하는 대신 **권한**을 비교해야 합니다. 모든 사용자는 일련의 권한을 할당받습니다. 마찬가지로, 각 리소스/엔드포인트는 접근하는 데 필요한 권한이 무엇인지 정의해야 합니다 (예: 전용 `@RequirePermissions()` 데코레이터를 통해).

```typescript
@@filename(cats.controller)
@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@RequirePermissions(Permission.CREATE_CAT)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **힌트** 위 예제에서 `Permission`은 (RBAC 섹션에서 보여준 `Role`과 유사하게) 시스템에서 사용 가능한 모든 권한을 포함하는 TypeScript 열거형입니다.

#### CASL 통합

[CASL](https://casl.js.org/)은 주어진 클라이언트가 어떤 리소스에 접근할 수 있는지 제한하는 아이소모픽(isomorphic) 권한 부여 라이브러리입니다. 이 라이브러리는 점진적으로 채택 가능하도록 설계되었으며, 간단한 클레임 기반에서부터 완전한 주체 및 속성 기반 권한 부여까지 쉽게 확장할 수 있습니다.

시작하려면 먼저 `@casl/ability` 패키지를 설치하세요:

```bash
$ npm i @casl/ability
```

> info **힌트** 이 예제에서는 CASL을 선택했지만, 선호도와 프로젝트 요구 사항에 따라 `accesscontrol` 또는 `acl`과 같은 다른 라이브러리를 사용할 수도 있습니다.

설치가 완료되면, CASL의 메커니즘을 설명하기 위해 두 개의 엔티티 클래스인 `User`와 `Article`을 정의해 보겠습니다.

```typescript
class User {
  id: number;
  isAdmin: boolean;
}
```

`User` 클래스는 두 개의 속성으로 구성됩니다. `id`는 고유한 사용자 식별자이며, `isAdmin`은 사용자가 관리자 권한을 가지고 있는지 나타냅니다.

```typescript
class Article {
  id: number;
  isPublished: boolean;
  authorId: number;
}
```

`Article` 클래스는 각각 `id`, `isPublished`, `authorId`의 세 가지 속성을 가지고 있습니다. `id`는 고유한 아티클 식별자이며, `isPublished`는 아티클이 이미 발행되었는지 여부를 나타내고, `authorId`는 아티클을 작성한 사용자의 ID입니다.

이제 이 예제에 대한 요구 사항을 검토하고 다듬어 보겠습니다:

- 관리자는 모든 엔티티를 관리(생성/읽기/업데이트/삭제)할 수 있습니다.
- 사용자는 모든 항목에 대해 읽기 전용 접근 권한을 가집니다.
- 사용자는 자신의 아티클을 업데이트할 수 있습니다 (`article.authorId === userId`).
- 이미 발행된 아티클은 삭제할 수 없습니다 (`article.isPublished === true`).

이를 염두에 두고, 사용자가 엔티티에 대해 수행할 수 있는 모든 가능한 작업을 나타내는 `Action` 열거형을 생성하는 것부터 시작하겠습니다:

```typescript
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

> warning **주의** `manage`는 CASL의 특별한 키워드이며 "모든" 작업을 나타냅니다.

CASL 라이브러리를 캡슐화하기 위해 `CaslModule`과 `CaslAbilityFactory`를 생성해 보겠습니다.

```bash
$ nest g module casl
$ nest g class casl/casl-ability.factory
```

이를 바탕으로 `CaslAbilityFactory`에 `createForUser()` 메서드를 정의하여 주어진 사용자에 대한 `Ability` 객체를 생성할 수 있습니다:

```typescript
type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Action, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    if (user.isAdmin) {
      can(Action.Manage, 'all'); // 모든 것에 대한 읽기-쓰기 접근 권한
    } else {
      can(Action.Read, 'all'); // 모든 것에 대한 읽기 전용 접근 권한
    }

    can(Action.Update, Article, { authorId: user.id });
    cannot(Action.Delete, Article, { isPublished: true });

    return build({
      // 세부 정보는 https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types 참조
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
```

> warning **주의** `all`은 CASL의 특별한 키워드이며 "모든 주체"를 나타냅니다.

> info **힌트** `Ability`, `AbilityBuilder`, `AbilityClass`, 그리고 `ExtractSubjectType` 클래스는 `@casl/ability` 패키지에서 익스포트됩니다.

> info **힌트** `detectSubjectType` 옵션은 CASL이 객체에서 주체 유형을 가져오는 방법을 이해하게 합니다. 자세한 정보는 [CASL 문서](https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types)를 참조하세요.

위 예제에서는 `AbilityBuilder` 클래스를 사용하여 `Ability` 인스턴스를 생성했습니다. 예상하셨겠지만, `can`과 `cannot`은 동일한 인자를 받지만 의미가 다릅니다. `can`은 지정된 주체에 대한 작업을 허용하고, `cannot`은 금지합니다. 둘 다 최대 4개의 인자를 받을 수 있습니다. 이러한 함수에 대해 더 자세히 알아보려면 공식 [CASL 문서](https://casl.js.org/v6/en/guide/intro)를 방문하세요.

마지막으로, `CaslModule` 모듈 정의의 `providers` 및 `exports` 배열에 `CaslAbilityFactory`를 추가했는지 확인하세요:

```typescript
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
```

이를 바탕으로, `CaslModule`이 호스트 컨텍스트에 임포트되어 있는 한 표준 생성자 주입을 사용하여 `CaslAbilityFactory`를 모든 클래스에 주입할 수 있습니다:

```typescript
constructor(private caslAbilityFactory: CaslAbilityFactory) {}
```

그런 다음 다음과 같이 클래스에서 사용할 수 있습니다.

```typescript
const ability = this.caslAbilityFactory.createForUser(user);
if (ability.can(Action.Read, 'all')) {
  // "user"는 모든 것에 대한 읽기 접근 권한을 가집니다.
}
```

> info **힌트** `Ability` 클래스에 대해 더 자세히 알아보려면 공식 [CASL 문서](https://casl.js.org/v6/en/guide/intro)를 참조하세요.

예를 들어, 관리자가 아닌 사용자가 있다고 가정해 봅시다. 이 경우 사용자는 아티클을 읽을 수 있어야 하지만, 새로운 아티클을 생성하거나 기존 아티클을 삭제하는 것은 금지되어야 합니다.

```typescript
const user = new User();
user.isAdmin = false;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Read, Article); // true
ability.can(Action.Delete, Article); // false
ability.can(Action.Create, Article); // false
```

> info **힌트** `Ability`와 `AbilityBuilder` 클래스 모두 `can`과 `cannot` 메서드를 제공하지만, 용도가 다르며 약간 다른 인자를 받습니다.

또한, 요구 사항에서 지정했듯이 사용자는 자신의 아티클을 업데이트할 수 있어야 합니다:

```typescript
const user = new User();
user.id = 1;

const article = new Article();
article.authorId = user.id;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Update, article); // true

article.authorId = 2;
ability.can(Action.Update, article); // false
```

보시다시피, `Ability` 인스턴스를 사용하면 권한을 매우 읽기 쉬운 방식으로 확인할 수 있습니다. 마찬가지로, `AbilityBuilder`를 사용하면 유사한 방식으로 권한을 정의하고 다양한 조건을 지정할 수 있습니다. 더 많은 예제를 찾으려면 공식 문서를 방문하세요.

#### 고급: `PoliciesGuard` 구현

이 섹션에서는 메서드 수준에서 구성할 수 있는 특정 **권한 부여 정책**을 사용자가 충족하는지 확인하는 약간 더 정교한 가드를 구축하는 방법을 보여줍니다 (클래스 수준에서 구성된 정책도 고려하도록 확장할 수 있습니다). 이 예제에서는 설명을 위해 CASL 패키지를 사용하지만, 이 라이브러리를 사용하는 것은 필수는 아닙니다. 또한 이전 섹션에서 생성한 `CaslAbilityFactory` 프로바이더를 사용할 것입니다.

먼저, 요구 사항을 구체화해 봅시다. 목표는 라우트 핸들러별로 정책 검사를 지정할 수 있는 메커니즘을 제공하는 것입니다. 우리는 객체와 함수(더 간단한 검사와 함수형 스타일 코드를 선호하는 사용자를 위해) 모두 지원할 것입니다.

정책 핸들러에 대한 인터페이스를 정의하는 것부터 시작하겠습니다:

```typescript
import { AppAbility } from '../casl/casl-ability.factory';

interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
```

위에서 언급했듯이, 정책 핸들러를 정의하는 두 가지 가능한 방법인 객체 (`IPolicyHandler` 인터페이스를 구현하는 클래스의 인스턴스)와 함수 (`PolicyHandlerCallback` 타입을 충족하는)를 제공했습니다.

이를 바탕으로 `@CheckPolicies()` 데코레이터를 생성할 수 있습니다. 이 데코레이터는 특정 리소스에 접근하기 위해 충족해야 하는 정책을 지정할 수 있게 해줍니다.

```typescript
export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
```

이제 라우트 핸들러에 바인딩된 모든 정책 핸들러를 추출하고 실행하는 `PoliciesGuard`를 생성해 보겠습니다.

```typescript
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
```

> info **힌트** 이 예제에서는 `request.user`에 사용자 인스턴스가 포함되어 있다고 가정했습니다. 애플리케이션에서는 [인증](/security/authentication) 장에서 자세히 설명된 사용자 정의 **인증 가드**에서 해당 연결을 수행할 것입니다.

이 예제를 분해해 봅시다. `policyHandlers`는 `@CheckPolicies()` 데코레이터를 통해 메서드에 할당된 핸들러 배열입니다. 다음으로, `CaslAbilityFactory#create` 메서드를 사용하여 `Ability` 객체를 구성하는데, 이는 사용자가 특정 작업을 수행할 충분한 권한이 있는지 확인하는 것을 가능하게 합니다. 우리는 이 객체를 함수이거나 `IPolicyHandler`를 구현하는 클래스의 인스턴스인 정책 핸들러로 전달하며, 이 핸들러는 불리언 값을 반환하는 `handle()` 메서드를 노출합니다. 마지막으로, `Array#every` 메서드를 사용하여 모든 핸들러가 `true` 값을 반환했는지 확인합니다.

마지막으로, 이 가드를 테스트하려면 아무 라우트 핸들러에 바인딩하고 인라인 정책 핸들러(함수형 접근 방식)를 다음과 같이 등록합니다:

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
findAll() {
  return this.articlesService.findAll();
}
```

또는 `IPolicyHandler` 인터페이스를 구현하는 클래스를 정의할 수 있습니다:

```typescript
export class ReadArticlePolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, Article);
  }
}
```

그리고 다음과 같이 사용할 수 있습니다:

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies(new ReadArticlePolicyHandler())
findAll() {
  return this.articlesService.findAll();
}
```

> warning **주의** `new` 키워드를 사용하여 정책 핸들러를 인라인으로 인스턴스화해야 하므로, `ReadArticlePolicyHandler` 클래스는 의존성 주입을 사용할 수 없습니다. 이는 `ModuleRef#get` 메서드를 사용하여 해결할 수 있습니다 ([여기](/fundamentals/module-ref)에서 자세히 읽어보세요). 기본적으로, `@CheckPolicies()` 데코레이터를 통해 함수와 인스턴스를 등록하는 대신 `Type<IPolicyHandler>`를 전달할 수 있도록 허용해야 합니다. 그런 다음 가드 내부에서 타입 참조를 사용하여 인스턴스를 검색하거나 (`moduleRef.get(YOUR_HANDLER_TYPE)`) `ModuleRef#create` 메서드를 사용하여 동적으로 인스턴스화할 수 있습니다.
