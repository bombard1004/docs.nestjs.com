### Passport (인증)

[Passport](https://github.com/jaredhanson/passport)는 가장 인기 있는 node.js 인증 라이브러리이며, 커뮤니티에 잘 알려져 있고 많은 프로덕션 애플리케이션에서 성공적으로 사용되고 있습니다. `@nestjs/passport` 모듈을 사용하여 이 라이브러리를 **Nest** 애플리케이션과 쉽게 통합할 수 있습니다. Passport는 높은 수준에서 다음을 위한 일련의 단계를 실행합니다:

- 사용자 "자격 증명"(예: 사용자 이름/비밀번호, JSON 웹 토큰([JWT](https://jwt.io/)), 또는 Identity Provider의 ID 토큰)을 확인하여 사용자 인증
- 인증된 상태 관리 (예: JWT와 같은 휴대용 토큰 발행, 또는 [Express 세션](https://github.com/expressjs/session) 생성)
- 경로 핸들러에서 추가 사용을 위해 인증된 사용자에 대한 정보를 `Request` 객체에 연결

Passport는 다양한 인증 메커니즘을 구현하는 풍부한 [전략(strategies)](http://www.passportjs.org/) 생태계를 가지고 있습니다. 개념적으로는 간단하지만, 선택할 수 있는 Passport 전략 세트는 크고 다양한 종류를 제공합니다. Passport는 이러한 다양한 단계를 표준 패턴으로 추상화하며, `@nestjs/passport` 모듈은 이 패턴을 익숙한 Nest 구성으로 래핑하고 표준화합니다.

이 장에서는 강력하고 유연한 이 모듈들을 사용하여 RESTful API 서버를 위한 완전한 엔드 투 엔드 인증 솔루션을 구현할 것입니다. 여기서 설명하는 개념을 사용하여 모든 Passport 전략을 구현하여 자신만의 인증 스키마를 사용자 지정할 수 있습니다. 이 장의 단계를 따라 이 완전한 예제를 빌드할 수 있습니다.

#### 인증 요구 사항

요구 사항을 구체화해 보겠습니다. 이 사용 사례에서 클라이언트는 사용자 이름과 비밀번호로 인증을 시작합니다. 인증되면 서버는 후속 요청에서 인증을 증명하기 위해 [인증 헤더에 전달자 토큰](https://tools.ietf.org/html/rfc6750)으로 보낼 수 있는 JWT를 발행합니다. 또한 유효한 JWT를 포함하는 요청만 접근할 수 있는 보호된 경로를 생성할 것입니다.

첫 번째 요구 사항인 사용자 인증부터 시작하겠습니다. 그런 다음 JWT 발행을 통해 확장합니다. 마지막으로 요청에 유효한 JWT가 있는지 확인하는 보호된 경로를 생성합니다.

먼저 필요한 패키지를 설치해야 합니다. Passport는 사용자 이름/비밀번호 인증 메커니즘을 구현하는 [passport-local](https://github.com/jaredhanson/passport-local)이라는 전략을 제공하며, 이는 우리 사용 사례의 이 부분에 적합합니다.

```bash
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
```

> warning **주의** 선택하는 **모든** Passport 전략에 대해 항상 `@nestjs/passport` 및 `passport` 패키지가 필요합니다. 그런 다음, 빌드 중인 특정 인증 전략을 구현하는 전략별 패키지(예: `passport-jwt` 또는 `passport-local`)를 설치해야 합니다. 또한 위에서 `@types/passport-local`로 보여지는 것처럼 모든 Passport 전략에 대한 타입 정의를 설치할 수 있으며, 이는 TypeScript 코드를 작성하는 동안 도움을 제공합니다.

#### Passport 전략 구현

이제 인증 기능을 구현할 준비가 되었습니다. **모든** Passport 전략에 사용되는 프로세스 개요부터 시작하겠습니다. Passport를 그 자체로 미니 프레임워크로 생각하는 것이 도움이 됩니다. 프레임워크의 우아함은 인증 프로세스를 구현하는 전략에 따라 사용자 지정하는 몇 가지 기본 단계로 추상화한다는 것입니다. 프레임워크와 유사한 이유는 사용자 지정 매개변수(일반 JSON 객체)와 Passport가 적절한 시기에 호출하는 콜백 함수 형태의 사용자 지정 코드를 제공하여 구성하기 때문입니다. `@nestjs/passport` 모듈은 이 프레임워크를 Nest 스타일 패키지로 래핑하여 Nest 애플리케이션에 쉽게 통합할 수 있도록 합니다. 아래에서 `@nestjs/passport`를 사용하겠지만, 먼저 **바닐라 Passport**가 어떻게 작동하는지 살펴보겠습니다.

바닐라 Passport에서는 두 가지를 제공하여 전략을 구성합니다:

1.  해당 전략에 특정한 옵션 세트입니다. 예를 들어, JWT 전략에서는 토큰을 서명하기 위한 시크릿을 제공할 수 있습니다.
2.  "검증 콜백"입니다. 여기서 Passport에게 사용자 저장소(사용자 계정을 관리하는 곳)와 상호 작용하는 방법을 알려줍니다. 여기서 사용자가 존재하는지 확인(및/또는 새 사용자 생성)하고 자격 증명이 유효한지 확인합니다. Passport 라이브러리는 이 콜백이 유효성 검사에 성공하면 전체 사용자를 반환하고, 실패하면 null을 반환할 것으로 예상합니다 (실패는 사용자를 찾을 수 없거나, passport-local의 경우 비밀번호가 일치하지 않음을 의미합니다).

`@nestjs/passport`를 사용하면 `PassportStrategy` 클래스를 확장하여 Passport 전략을 구성합니다. 서브클래스의 `super()` 메서드를 호출하여 전략 옵션(위의 항목 1)을 전달하고, 선택적으로 옵션 객체를 전달할 수 있습니다. 서브클래스에서 `validate()` 메서드를 구현하여 검증 콜백(위의 항목 2)을 제공합니다.

`AuthModule`과 그 안에 `AuthService`를 생성하는 것부터 시작하겠습니다:

```bash
$ nest g module auth
$ nest g service auth
```

`AuthService`를 구현하면서 사용자 작업을 `UsersService`로 캡슐화하는 것이 유용하다는 것을 알게 될 것이므로, 지금 바로 해당 모듈과 서비스를 생성해 보겠습니다:

```bash
$ nest g module users
$ nest g service users
```

이 생성된 파일들의 기본 내용을 아래와 같이 바꿉니다. 우리의 샘플 앱의 경우, `UsersService`는 단순히 하드코딩된 메모리 내 사용자 목록과 사용자 이름으로 사용자를 검색하는 `find` 메서드를 유지합니다. 실제 앱에서는 선택한 라이브러리(예: TypeORM, Sequelize, Mongoose 등)를 사용하여 사용자 모델과 영속성 레이어를 빌드할 것입니다.

```typescript
@@filename(users/users.service)
import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
```

`UsersModule`에서는 `@Module` 데코레이터의 `exports` 배열에 `UsersService`를 추가하여 이 모듈 외부에서 볼 수 있도록 하는 것만 변경하면 됩니다 (곧 `AuthService`에서 사용할 것입니다).

```typescript
@@filename(users/users.module)
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
@@switch
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

`AuthService`는 사용자를 검색하고 비밀번호를 확인하는 작업을 수행합니다. 이를 위해 `validateUser()` 메서드를 생성합니다. 아래 코드에서는 편리한 ES6 spread 연산자를 사용하여 사용자 객체에서 비밀번호 속성을 제거한 후 반환합니다. 잠시 후 Passport 로컬 전략에서 `validateUser()` 메서드를 호출할 것입니다.

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
```

> Warning **경고** 물론 실제 애플리케이션에서는 비밀번호를 일반 텍스트로 저장하지 않습니다. 대신 [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme)와 같은 라이브러리를 사용하여 솔팅된 단방향 해시 알고리즘을 사용할 것입니다. 이 접근 방식에서는 해시된 비밀번호만 저장하고, 저장된 비밀번호를 **들어오는** 비밀번호의 해시된 버전과 비교하여 사용자 비밀번호를 일반 텍스트로 저장하거나 노출시키지 않습니다. 샘플 앱을 간단하게 유지하기 위해 이 절대적인 의무를 위반하고 일반 텍스트를 사용했습니다. **실제 앱에서는 이렇게 하지 마세요!**

이제 `AuthModule`을 업데이트하여 `UsersModule`을 가져옵니다.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
```

#### Passport 로컬 구현

이제 Passport **로컬 인증 전략**을 구현할 수 있습니다. `auth` 폴더에 `local.strategy.ts` 파일을 생성하고 다음 코드를 추가합니다:

```typescript
@@filename(auth/local.strategy)
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
@@switch
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(username, password) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

우리는 앞서 모든 Passport 전략에 대해 설명된 레시피를 따랐습니다. passport-local을 사용하는 우리의 사용 사례에서는 구성 옵션이 없으므로 생성자는 옵션 객체 없이 `super()`를 호출합니다.

> info **힌트** `super()` 호출에 옵션 객체를 전달하여 passport 전략의 동작을 사용자 지정할 수 있습니다. 이 예제에서 passport-local 전략은 기본적으로 요청 본문에 `username` 및 `password`라는 속성을 예상합니다. 예를 들어 다른 속성 이름을 지정하려면 `super({{ '{' }} usernameField: 'email' {{ '}' }})`과 같이 옵션 객체를 전달합니다. 자세한 내용은 [Passport 문서](http://www.passportjs.org/docs/configure/)를 참조하십시오.

또한 `validate()` 메서드를 구현했습니다. 각 전략에 대해 Passport는 적절한 전략별 매개변수 세트를 사용하여 검증 함수(`@nestjs/passport`에서 `validate()` 메서드로 구현)를 호출합니다. 로컬 전략의 경우 Passport는 다음과 같은 시그니처를 가진 `validate()` 메서드를 예상합니다: `validate(username: string, password:string): any`.

대부분의 유효성 검사 작업은 `AuthService`에서 수행되므로 (`UsersService`의 도움을 받아), 이 메서드는 매우 간단합니다. **모든** Passport 전략의 `validate()` 메서드는 자격 증명이 표현되는 방식만 다른 유사한 패턴을 따릅니다. 사용자가 발견되고 자격 증명이 유효하면 Passport가 작업을 완료할 수 있도록 사용자가 반환되고 (예: `Request` 객체에 `user` 속성 생성), 요청 처리 파이프라인이 계속 진행될 수 있습니다. 발견되지 않으면 예외를 던지고 우리의 <a href="exception-filters">예외 레이어</a>가 처리하도록 합니다.

일반적으로 각 전략의 `validate()` 메서드에서 유일한 중요한 차이점은 사용자가 존재하는지, 유효한지 **어떻게** 판단하는지입니다. 예를 들어, JWT 전략에서는 요구 사항에 따라 디코딩된 토큰에 포함된 `userId`가 사용자 데이터베이스의 레코드와 일치하는지, 또는 폐지된 토큰 목록과 일치하는지 평가할 수 있습니다. 따라서 서브클래싱 및 전략별 유효성 검사를 구현하는 이 패턴은 일관성 있고 우아하며 확장 가능합니다.

우리가 방금 정의한 Passport 기능을 사용하도록 `AuthModule`을 구성해야 합니다. `auth.module.ts`를 다음과 같이 업데이트합니다:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
```

#### 내장 Passport Guards

<a href="guards">Guards</a> 장에서는 Guard의 주요 기능인 요청이 경로 핸들러에 의해 처리될지 여부를 결정하는 것을 설명합니다. 이는 여전히 유효하며, 이 표준 기능을 곧 사용할 것입니다. 그러나 `@nestjs/passport` 모듈을 사용하는 맥락에서 처음에는 혼란스러울 수 있는 약간 새로운 복잡성을 소개할 것입니다. 이에 대해 지금 논의해 봅시다. 인증 관점에서 앱이 두 가지 상태로 존재할 수 있다고 생각하십시오:

1.  사용자/클라이언트가 로그인되지 **않은** 상태 (인증되지 않음)
2.  사용자/클라이언트가 로그인된 **상태** (인증됨)

첫 번째 경우 (사용자가 로그인되지 않음)에는 두 가지 별개의 기능을 수행해야 합니다:

- 인증되지 않은 사용자가 접근할 수 있는 경로를 제한합니다 (즉, 제한된 경로에 대한 접근을 거부합니다). 보호된 경로에 Guard를 배치하여 이 기능을 처리하기 위해 Guard를 익숙한 용량으로 사용할 것입니다. 예상할 수 있듯이, 이 Guard에서 유효한 JWT의 존재를 확인할 것이므로, JWT를 성공적으로 발행한 후 이 Guard를 작업할 것입니다.

- 이전에 인증되지 않은 사용자가 로그인을 시도할 때 **인증 단계** 자체를 시작합니다. 이것은 유효한 사용자에게 JWT를 **발행**하는 단계입니다. 잠시 생각해보면 인증을 시작하기 위해 username/password 자격 증명을 `POST`해야 한다는 것을 알 수 있습니다. 따라서 이를 처리하기 위해 `POST /auth/login` 경로를 설정할 것입니다. 이로 인해 다음과 같은 질문이 제기됩니다: 그 경로에서 passport-local 전략을 정확히 어떻게 호출할까요?

답은 간단합니다: 약간 다른 유형의 Guard를 사용하여. `@nestjs/passport` 모듈은 이를 위해 내장 Guard를 제공합니다. 이 Guard는 Passport 전략을 호출하고 위에서 설명한 단계를 시작합니다 (자격 증명 검색, 검증 함수 실행, `user` 속성 생성 등).

위에서 열거된 두 번째 경우(로그인된 사용자)는 로그인된 사용자에 대해 보호된 경로에 대한 접근을 활성화하기 위해 이미 논의한 표준 유형의 Guard에 의존합니다.

<app-banner-courses-auth></app-banner-courses-auth>

#### 로그인 경로

전략이 준비되었으니, 이제 bare-bones `/auth/login` 경로를 구현하고 내장 Guard를 적용하여 passport-local 흐름을 시작할 수 있습니다.

`app.controller.ts` 파일을 열고 내용을 다음과 같이 바꿉니다:

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return req.user;
  }
}
```

`@UseGuards(AuthGuard('local'))`을 사용하여 `@nestjs/passport`가 passport-local 전략을 확장했을 때 **자동으로 프로비저닝한** `AuthGuard`를 사용합니다. 이를 자세히 살펴보겠습니다. 우리의 Passport 로컬 전략은 기본 이름이 `'local'`입니다. `passport-local` 패키지에서 제공하는 코드와 연결하기 위해 `@UseGuards()` 데코레이터에서 이 이름을 참조합니다. 이는 앱에 여러 Passport 전략이 있는 경우 (각각 전략별 `AuthGuard`를 프로비저닝할 수 있음) 호출할 전략을 명확히 구분하는 데 사용됩니다. 현재는 하나의 전략만 있지만, 곧 두 번째 전략을 추가할 것이므로 명확한 구분이 필요합니다.

경로를 테스트하기 위해 현재 `/auth/login` 경로는 사용자를 단순히 반환하도록 할 것입니다. 이는 또한 또 다른 Passport 기능을 보여줍니다: Passport는 `validate()` 메서드에서 반환하는 값에 따라 자동으로 `user` 객체를 생성하고 이를 `Request` 객체에 `req.user`로 할당합니다. 나중에 이를 JWT를 생성하고 반환하는 코드로 바꿀 것입니다.

이것들은 API 경로이므로 일반적으로 사용 가능한 [cURL](https://curl.haxx.se/) 라이브러리를 사용하여 테스트할 것입니다. `UsersService`에 하드코딩된 `user` 객체 중 하나로 테스트할 수 있습니다.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"userId":1,"username":"john"}
```

이것은 작동하지만, 전략 이름을 `AuthGuard()`에 직접 전달하면 코드베이스에 "마법 문자열"이 도입됩니다. 대신 아래와 같이 자신만의 클래스를 생성하는 것을 권장합니다:

```typescript
@@filename(auth/local-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

이제 `/auth/login` 경로 핸들러를 업데이트하고 대신 `LocalAuthGuard`를 사용할 수 있습니다:

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req) {
  return req.user;
}
```

#### 로그아웃 경로

로그아웃하려면 사용자의 세션을 지우기 위해 `res.logout()`을 호출하는 추가 경로를 생성할 수 있습니다. 이는 세션 기반 인증에서 사용되는 일반적인 접근 방식이지만 JWT에는 적용되지 않습니다.

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/logout')
async logout(@Request() req) {
  return req.logout();
}
```

#### JWT 기능

이제 인증 시스템의 JWT 부분으로 넘어갈 준비가 되었습니다. 요구 사항을 검토하고 다듬어 보겠습니다:

- 사용자가 사용자 이름/비밀번호로 인증하고, 보호된 API 엔드포인트에 대한 후속 호출에 사용할 JWT를 반환하도록 허용합니다. 이 요구 사항을 충족하는 데 거의 다 왔습니다. 이를 완료하려면 JWT를 발행하는 코드를 작성해야 합니다.
- 유효한 JWT의 존재를 전달자 토큰으로 기반으로 보호되는 API 경로를 생성합니다.

JWT 요구 사항을 지원하기 위해 몇 가지 패키지를 더 설치해야 합니다:

```bash
$ npm install --save @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-jwt
```

`@nestjs/jwt` 패키지(자세한 내용은 [여기](https://github.com/nestjs/jwt) 참조)는 JWT 조작에 도움이 되는 유틸리티 패키지입니다. `passport-jwt` 패키지는 JWT 전략을 구현하는 Passport 패키지이며, `@types/passport-jwt`는 TypeScript 타입 정의를 제공합니다.

`POST /auth/login` 요청이 어떻게 처리되는지 자세히 살펴보겠습니다. passport-local 전략에서 제공하는 내장 `AuthGuard`를 사용하여 경로를 데코레이트했습니다. 이는 다음을 의미합니다:

1.  경로 핸들러는 **사용자가 검증된 경우에만 호출됩니다**.
2.  `req` 매개변수에는 `user` 속성이 포함됩니다 (passport-local 인증 흐름 중에 Passport에 의해 채워짐).

이를 염두에 두고, 이제 마침내 실제 JWT를 생성하고 이 경로에서 반환할 수 있습니다. 서비스를 깔끔하게 모듈화하기 위해 `authService`에서 JWT 생성을 처리할 것입니다. `auth` 폴더에 있는 `auth.service.ts` 파일을 열고 `login()` 메서드를 추가하고 아래와 같이 `JwtService`를 가져옵니다:

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

우리는 `@nestjs/jwt` 라이브러리를 사용하고 있으며, 이는 `user` 객체 속성의 하위 집합에서 JWT를 생성하는 `sign()` 함수를 제공하며, 이를 단일 `access_token` 속성을 가진 간단한 객체로 반환합니다. 참고: JWT 표준과 일치하도록 `userId` 값을 보유하기 위해 `sub`라는 속성 이름을 선택합니다. `AuthService`에 JwtService 프로바이더를 주입하는 것을 잊지 마세요.

이제 새 종속성을 가져오고 `JwtModule`을 구성하도록 `AuthModule`을 업데이트해야 합니다.

먼저 `auth` 폴더에 `constants.ts`를 생성하고 다음 코드를 추가합니다:

```typescript
@@filename(auth/constants)
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
@@switch
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
```

이를 사용하여 JWT 서명 및 검증 단계 간에 키를 공유할 것입니다.

> Warning **경고** **이 키를 공개적으로 노출하지 마십시오**. 여기서는 코드가 무엇을 하는지 명확히 보여주기 위해 그렇게 했지만, 프로덕션 시스템에서는 보안 저장소, 환경 변수 또는 구성 서비스와 같은 적절한 조치를 사용하여 **이 키를 보호해야 합니다**.

이제 `auth` 폴더에 있는 `auth.module.ts`를 열고 다음과 같이 업데이트합니다:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

구성 객체를 전달하여 `register()`를 사용하여 `JwtModule`을 구성합니다. Nest `JwtModule`에 대한 자세한 내용은 [여기](https://github.com/nestjs/jwt/blob/master/README.md)를, 사용 가능한 구성 옵션에 대한 자세한 내용은 [여기](https://github.com/auth0/node-jsonwebtoken#usage)를 참조하십시오.

이제 `/auth/login` 경로를 업데이트하여 JWT를 반환할 수 있습니다.

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }
}
```

다시 cURL을 사용하여 경로를 테스트해 보겠습니다. `UsersService`에 하드코딩된 `user` 객체 중 하나로 테스트할 수 있습니다.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # 참고: 위 JWT는 잘린 것입니다.
```

#### Passport JWT 구현

이제 마지막 요구 사항인 요청에 유효한 JWT가 필요하도록 엔드포인트를 보호하는 것을 해결할 수 있습니다. Passport도 여기서 도움이 됩니다. JSON 웹 토큰으로 RESTful 엔드포인트를 보호하기 위한 [passport-jwt](https://github.com/mikenicholson/passport-jwt) 전략을 제공합니다. `auth` 폴더에 `jwt.strategy.ts` 파일을 생성하고 다음 코드를 추가하여 시작합니다:

```typescript
@@filename(auth/jwt.strategy)
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
@@switch
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

`JwtStrategy`를 사용하여 모든 Passport 전략에 대해 앞서 설명한 것과 동일한 레시피를 따랐습니다. 이 전략은 일부 초기화가 필요하므로 `super()` 호출에 옵션 객체를 전달하여 수행합니다. 사용 가능한 옵션에 대한 자세한 내용은 [여기](https://github.com/mikenicholson/passport-jwt#configure-strategy)를 참조할 수 있습니다. 우리의 경우 이러한 옵션은 다음과 같습니다:

-   `jwtFromRequest`: 요청에서 JWT를 추출하는 방법을 제공합니다. API 요청의 Authorization 헤더에 전달자 토큰을 제공하는 표준 접근 방식을 사용할 것입니다. 다른 옵션은 [여기](https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request)에 설명되어 있습니다.
-   `ignoreExpiration`: 명시적으로 하기 위해 기본 `false` 설정을 선택합니다. 이는 JWT가 만료되지 않았는지 확인하는 책임을 Passport 모듈에 위임합니다. 이는 만료된 JWT가 우리의 경로에 제공되면 요청이 거부되고 `401 Unauthorized` 응답이 전송됨을 의미합니다. Passport는 이를 자동으로 편리하게 처리합니다.
-   `secretOrKey`: 토큰 서명을 위한 대칭 비밀 키를 제공하는 편리한 옵션을 사용하고 있습니다. PEM 인코딩된 공개 키와 같은 다른 옵션이 프로덕션 앱에 더 적합할 수 있습니다 (자세한 내용은 [여기](https://github.com/mikenicholson/passport-jwt#configure-strategy) 참조). 어떤 경우든 앞서 경고했듯이 **이 비밀 키를 공개적으로 노출하지 마십시오**.

`validate()` 메서드는 논의할 가치가 있습니다. jwt-strategy의 경우 Passport는 먼저 JWT의 서명을 확인하고 JSON을 디코딩합니다. 그런 다음 디코딩된 JSON을 단일 매개변수로 전달하여 `validate()` 메서드를 호출합니다. JWT 서명 방식 덕분에, **우리가 이전에 서명하고 유효한 사용자에게 발행한 유효한 토큰을 받고 있다는 것이 보장됩니다**.

이 모든 결과로 `validate()` 콜백에 대한 우리의 응답은 간단합니다: `userId` 및 `username` 속성을 포함하는 객체를 단순히 반환합니다. Passport는 `validate()` 메서드의 반환 값을 기반으로 `user` 객체를 구축하고 이를 `Request` 객체의 속성으로 연결한다는 점을 다시 기억하세요.

또한 배열을 반환할 수 있으며, 첫 번째 값은 `user` 객체를 생성하는 데 사용되고 두 번째 값은 `authInfo` 객체를 생성하는 데 사용됩니다.

이 접근 방식이 프로세스에 다른 비즈니스 로직을 주입할 여지('훅')를 남긴다는 점도 지적할 가치가 있습니다. 예를 들어, `validate()` 메서드에서 데이터베이스 조회를 수행하여 사용자에 대한 더 많은 정보를 추출하여 요청에서 더 풍부한 `user` 객체를 사용할 수 있도록 할 수 있습니다. 이는 또한 토큰 폐지를 수행할 수 있도록 폐지된 토큰 목록에서 `userId`를 찾는 것과 같은 추가 토큰 유효성 검사를 결정할 수 있는 곳입니다. 여기서 샘플 코드에 구현한 모델은 빠르고 "무상태 JWT" 모델로, 각 API 호출은 유효한 JWT의 존재에 기반하여 즉시 인증되며, 요청자( `userId` 및 `username`)에 대한 작은 정보가 요청 파이프라인에서 사용할 수 있습니다.

새로운 `JwtStrategy`를 `AuthModule`의 프로바이더로 추가합니다:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

JWT 서명 시 사용한 것과 동일한 비밀 키를 가져옴으로써 Passport가 수행하는 **검증** 단계와 AuthService에서 수행하는 **서명** 단계가 공통 비밀 키를 사용하도록 보장합니다.

마지막으로 내장 `AuthGuard`를 확장하는 `JwtAuthGuard` 클래스를 정의합니다:

```typescript
@@filename(auth/jwt-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### 보호된 경로 및 JWT 전략 가드 구현

이제 보호된 경로와 관련된 Guard를 구현할 수 있습니다.

`app.controller.ts` 파일을 열고 아래와 같이 업데이트합니다:

```typescript
@@filename(app.controller)
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Dependencies, Bind, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}
```

다시 한 번, `@nestjs/passport` 모듈이 passport-jwt 모듈을 구성할 때 자동으로 프로비저닝한 `AuthGuard`를 적용하고 있습니다. 이 Guard는 기본 이름인 `jwt`로 참조됩니다. 우리의 `GET /profile` 경로에 요청이 들어오면 Guard는 자동으로 passport-jwt 사용자 지정 구성 전략을 호출하고, JWT를 검증하며, `user` 속성을 `Request` 객체에 할당합니다.

앱이 실행 중인지 확인하고 `cURL`을 사용하여 경로를 테스트합니다.

```bash
$ # GET /profile
$ curl http://localhost:3000/profile
$ # result -> {"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # result -> {"userId":1,"username":"john"}
```

`AuthModule`에서 JWT의 만료 시간을 `60초`로 구성했습니다. 이는 아마도 너무 짧은 만료 시간이며, 토큰 만료 및 갱신에 대한 세부 사항은 이 기사의 범위를 벗어납니다. 그러나 JWT 및 passport-jwt 전략의 중요한 특성을 보여주기 위해 그렇게 선택했습니다. 인증 후 60초를 기다렸다가 `GET /profile` 요청을 시도하면 `401 Unauthorized` 응답을 받게 됩니다. 이는 Passport가 JWT의 만료 시간을 자동으로 확인하여 애플리케이션에서 직접 확인할 필요가 없도록 하기 때문입니다.

이제 JWT 인증 구현을 완료했습니다. JavaScript 클라이언트(예: Angular/React/Vue) 및 기타 JavaScript 앱은 이제 안전하게 인증하고 API 서버와 통신할 수 있습니다.

#### 가드 확장

대부분의 경우 제공된 `AuthGuard` 클래스를 사용하는 것으로 충분합니다. 그러나 기본 오류 처리 또는 인증 로직을 단순히 확장하고 싶은 사용 사례가 있을 수 있습니다. 이를 위해 내장 클래스를 확장하고 서브클래스 내에서 메서드를 재정의할 수 있습니다.

```typescript
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 여기에 사용자 지정 인증 로직을 추가하세요
    // 예를 들어, 세션을 설정하기 위해 super.logIn(request)을 호출합니다.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // "info" 또는 "err" 인수를 기반으로 예외를 던질 수 있습니다.
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

기본 오류 처리 및 인증 로직을 확장하는 것 외에도, 인증이 일련의 전략을 통과하도록 허용할 수 있습니다. 성공하거나 리디렉션하거나 오류가 발생하는 첫 번째 전략이 체인을 중단합니다. 인증 실패는 각 전략을 순차적으로 진행하며, 모든 전략이 실패하면 궁극적으로 실패합니다.

```typescript
export class JwtAuthGuard extends AuthGuard(['strategy_jwt_1', 'strategy_jwt_2', '...']) { ... }
```

#### 전역적으로 인증 활성화

대다수의 엔드포인트가 기본적으로 보호되어야 하는 경우, 인증 가드를 [전역 가드](/guards#binding-guards)로 등록하고 각 컨트롤러 위에 `@UseGuards()` 데코레이터를 사용하는 대신 어떤 경로를 공개로 할지 단순히 플래그를 지정할 수 있습니다.

먼저 다음 구조를 사용하여 (어떤 모듈에서든) `JwtAuthGuard`를 전역 가드로 등록합니다:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

이렇게 하면 Nest는 모든 엔드포인트에 `JwtAuthGuard`를 자동으로 바인딩합니다.

이제 경로를 공개로 선언하는 메커니즘을 제공해야 합니다. 이를 위해 `SetMetadata` 데코레이터 팩토리 함수를 사용하여 사용자 지정 데코레이터를 생성할 수 있습니다.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

위 파일에서 두 개의 상수를 내보냈습니다. 하나는 `"isPublic"`이라는 메타데이터 키이고, 다른 하나는 `Public`이라고 부를 새 데코레이터입니다 (프로젝트에 맞는 다른 이름, 예를 들어 `SkipAuth` 또는 `AllowAnon`을 사용할 수도 있습니다).

이제 사용자 지정 `@Public()` 데코레이터를 가졌으므로 다음과 같이 모든 메서드에 데코레이트할 수 있습니다:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

마지막으로, `JwtAuthGuard`가 `"isPublic"` 메타데이터가 발견될 때 `true`를 반환하도록 해야 합니다. 이를 위해 `Reflector` 클래스를 사용할 것입니다 ([여기](/guards#putting-it-all-together)에서 자세히 읽어보세요).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

#### Request-scoped strategies

Passport API는 라이브러리의 전역 인스턴스에 전략을 등록하는 것을 기반으로 합니다. 따라서 전략은 요청에 종속적인 옵션을 갖거나 요청별로 동적으로 인스턴스화되도록 설계되지 않았습니다 ([request-scoped](/fundamentals/injection-scopes) 프로바이더에 대해 자세히 읽어보세요). 전략을 request-scoped로 구성하면 Nest는 특정 경로에 연결되지 않으므로 이를 인스턴스화하지 않습니다. 요청별로 어떤 "request-scoped" 전략이 실행되어야 하는지 판단할 물리적인 방법이 없습니다.

그러나 전략 내에서 request-scoped 프로바이더를 동적으로 해결하는 방법이 있습니다. 이를 위해 [모듈 참조](/fundamentals/module-ref) 기능을 활용합니다.

먼저 `local.strategy.ts` 파일을 열고 일반적인 방식으로 `ModuleRef`를 주입합니다:

```typescript
constructor(private moduleRef: ModuleRef) {
  super({
    passReqToCallback: true,
  });
}
```

> info **힌트** `ModuleRef` 클래스는 `@nestjs/core` 패키지에서 가져옵니다.

위에서 보인 것처럼 `passReqToCallback` 구성 속성을 `true`로 설정해야 합니다.

다음 단계에서는 새 컨텍스트 ID를 생성하는 대신 요청 인스턴스를 사용하여 현재 컨텍스트 식별자를 얻습니다 ([여기](/fundamentals/module-ref#getting-current-sub-tree)에서 요청 컨텍스트에 대해 자세히 읽어보세요).

이제 `LocalStrategy` 클래스의 `validate()` 메서드 내에서 `ContextIdFactory` 클래스의 `getByRequest()` 메서드를 사용하여 요청 객체를 기반으로 컨텍스트 ID를 생성하고 이를 `resolve()` 호출에 전달합니다:

```typescript
async validate(
  request: Request,
  username: string,
  password: string,
) {
  const contextId = ContextIdFactory.getByRequest(request);
  // "AuthService"는 request-scoped 프로바이더입니다.
  const authService = await this.moduleRef.resolve(AuthService, contextId);
  ...
}
```

위 예제에서 `resolve()` 메서드는 `AuthService` 프로바이더의 request-scoped 인스턴스를 비동기적으로 반환합니다 (`AuthService`가 request-scoped 프로바이더로 표시되었다고 가정했습니다).

#### Passport 사용자 지정

모든 표준 Passport 사용자 지정 옵션은 `register()` 메서드를 사용하여 동일한 방식으로 전달될 수 있습니다. 사용 가능한 옵션은 구현 중인 전략에 따라 다릅니다. 예를 들어:

```typescript
PassportModule.register({ session: true });
```

전략에 옵션 객체를 생성자에 전달하여 구성할 수도 있습니다.
로컬 전략의 경우 예를 들어 다음을 전달할 수 있습니다:

```typescript
constructor(private authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
```

속성 이름에 대한 자세한 내용은 공식 [Passport 웹사이트](http://www.passportjs.org/docs/oauth/)를 참조하십시오.

#### 이름 지정된 전략

전략을 구현할 때 `PassportStrategy` 함수에 두 번째 인수를 전달하여 이름을 제공할 수 있습니다. 이렇게 하지 않으면 각 전략은 기본 이름(예: jwt-strategy의 경우 'jwt')을 갖게 됩니다:

```typescript
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
```

그런 다음 `@UseGuards(AuthGuard('myjwt'))`와 같은 데코레이터를 통해 이를 참조합니다.

#### GraphQL

[GraphQL](https://nestjs.dokidocs.dev/graphql/quick-start)과 함께 AuthGuard를 사용하려면 내장 `AuthGuard` 클래스를 확장하고 `getRequest()` 메서드를 재정의합니다.

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

graphql resolver에서 현재 인증된 사용자를 얻으려면 `@CurrentUser()` 데코레이터를 정의할 수 있습니다:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

resolver에서 위 데코레이터를 사용하려면 쿼리 또는 뮤테이션의 매개변수로 포함해야 합니다:

```typescript
@Query(() => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.usersService.findById(user.id);
}
```

passport-local 전략의 경우, Passport가 유효성 검사를 위해 액세스할 수 있도록 GraphQL 컨텍스트의 인수를 요청 본문에 추가해야 합니다. 그렇지 않으면 Unauthorized 오류가 발생합니다.

```typescript
@Injectable()
export class GqlLocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    const gqlContext = gqlExecutionContext.getContext();
    const gqlArgs = gqlExecutionContext.getArgs();

    gqlContext.req.body = { ...gqlContext.req.body, ...gqlArgs };
    return gqlContext.req;
  }
}
```