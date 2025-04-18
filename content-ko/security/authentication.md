### 인증

인증은 대부분 애플리케이션의 **필수적인** 부분입니다. 인증을 처리하는 다양한 접근 방식과 전략이 있습니다. 어떤 프로젝트에서든 채택하는 방식은 해당 애플리케이션의 특정 요구 사항에 따라 달라집니다. 이 챕터에서는 다양한 요구 사항에 맞춰 적용할 수 있는 여러 인증 접근 방식을 제시합니다.

요구 사항을 구체화해 봅시다. 이 사용 사례에서는 클라이언트가 사용자 이름과 비밀번호로 인증하는 것으로 시작합니다. 인증되면 서버는 후속 요청에서 인증을 증명하기 위해 권한 부여 헤더에 [베어러 토큰](https://tools.ietf.org/html/rfc6750)으로 보낼 수 있는 JWT를 발급합니다. 또한 유효한 JWT를 포함하는 요청에만 접근 가능한 보호된 경로를 생성할 것입니다.

첫 번째 요구 사항인 사용자 인증부터 시작하겠습니다. 그런 다음 JWT를 발급하여 이를 확장할 것입니다. 마지막으로 요청에 유효한 JWT가 있는지 확인하는 보호된 경로를 생성할 것입니다.

#### 인증 모듈 생성

먼저 `AuthModule`을 생성하고 그 안에 `AuthService`와 `AuthController`를 생성합니다. 인증 로직을 구현하는 데 `AuthService`를 사용하고, 인증 엔드포인트를 노출하는 데 `AuthController`를 사용할 것입니다.

```bash
$ nest g module auth
$ nest g controller auth
$ nest g service auth
```

`AuthService`를 구현하면서 사용자 작업을 `UsersService`에 캡슐화하는 것이 유용하다는 것을 알게 될 것입니다. 따라서 지금 모듈과 서비스를 생성해 봅시다.

```bash
$ nest g module users
$ nest g service users
```

아래와 같이 생성된 파일의 기본 내용을 바꿉니다. 우리의 샘플 앱에서 `UsersService`는 단순히 하드 코딩된 인메모리 사용자 목록과 사용자 이름으로 하나를 검색하는 찾기 메서드를 유지합니다. 실제 앱에서는 원하는 라이브러리(예: TypeORM, Sequelize, Mongoose 등)를 사용하여 사용자 모델과 영속성 레이어를 구축할 곳입니다.

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

@Injectable()
@Dependencies()
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

`UsersModule`에서는 `@Module` 데코레이터의 exports 배열에 `UsersService`를 추가하여 이 모듈 외부에서 보이도록 하는 것만이 필요한 변경 사항입니다(곧 `AuthService`에서 사용할 것입니다).

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

#### "로그인" 엔드포인트 구현

우리의 `AuthService`는 사용자를 검색하고 비밀번호를 확인하는 작업을 합니다. 이를 위해 `signIn()` 메서드를 생성합니다. 아래 코드에서는 편리한 ES6 스프레드 연산자를 사용하여 반환하기 전에 사용자 객체에서 비밀번호 속성을 제거합니다. 이는 비밀번호나 다른 보안 키와 같은 민감한 필드를 노출하고 싶지 않기 때문에 사용자 객체를 반환할 때 흔히 사용하는 방법입니다.

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
```

> Warning **경고** 물론 실제 애플리케이션에서는 비밀번호를 일반 텍스트로 저장하지 않을 것입니다. 대신 [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme)와 같은 라이브러리를 솔트가 적용된 단방향 해시 알고리즘과 함께 사용할 것입니다. 이 접근 방식을 사용하면 해시된 비밀번호만 저장하고, 저장된 비밀번호를 **들어오는** 비밀번호의 해시된 버전과 비교하여 일반 텍스트로 사용자 비밀번호를 저장하거나 노출하지 않게 됩니다. 샘플 앱을 간단하게 유지하기 위해 이 절대적인 규칙을 위반하고 일반 텍스트를 사용했습니다. **실제 앱에서는 이렇게 하지 마세요!**

이제 `AuthModule`을 업데이트하여 `UsersModule`을 가져옵니다.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

이것을 갖추고 `AuthController`를 열고 `signIn()` 메서드를 추가해 봅시다. 이 메서드는 클라이언트가 사용자를 인증하기 위해 호출할 것입니다. 요청 본문에서 사용자 이름과 비밀번호를 받아 사용자가 인증되면 JWT 토큰을 반환합니다.

```typescript
@@filename(auth/auth.controller)
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
```

> info **힌트** 이상적으로는 `Record<string, any>` 타입 대신 DTO 클래스를 사용하여 요청 본문의 형태를 정의해야 합니다. 자세한 내용은 [유효성 검사](/techniques/validation) 챕터를 참조하십시오.

<app-banner-courses-auth></app-banner-courses-auth>

#### JWT 토큰

이제 인증 시스템의 JWT 부분으로 넘어갈 준비가 되었습니다. 요구 사항을 검토하고 다듬어 봅시다:

- 사용자 이름/비밀번호로 인증하여 보호된 API 엔드포인트에 대한 후속 호출에 사용할 JWT를 반환하도록 허용합니다. 이 요구 사항을 충족하기 위한 준비는 거의 완료되었습니다. 이를 완료하려면 JWT를 발급하는 코드를 작성해야 합니다.
- 유효한 JWT가 베어러 토큰으로 존재하는지에 따라 보호되는 API 경로를 생성합니다.

JWT 요구 사항을 지원하기 위해 하나의 추가 패키지를 설치해야 합니다:

```bash
$ npm install --save @nestjs/jwt
```

> info **힌트** `@nestjs/jwt` 패키지(자세한 내용은 [여기](https://github.com/nestjs/jwt) 참조)는 JWT 조작을 돕는 유틸리티 패키지입니다. 여기에는 JWT 토큰 생성 및 확인이 포함됩니다.

서비스를 깔끔하게 모듈화하기 위해 `authService`에서 JWT 생성을 처리할 것입니다. `auth` 폴더의 `auth.service.ts` 파일을 열고 `JwtService`를 주입한 다음 `signIn` 메서드를 아래와 같이 JWT 토큰을 생성하도록 업데이트합니다:

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
```

우리는 `@nestjs/jwt` 라이브러리를 사용하고 있으며, 이는 `signAsync()` 함수를 제공하여 `user` 객체 속성의 하위 집합으로부터 JWT를 생성하고, 이를 `access_token` 단일 속성을 가진 간단한 객체로 반환합니다. 참고: `userId` 값을 담기 위해 `sub`라는 속성 이름을 선택했습니다. 이는 JWT 표준과 일관성을 유지하기 위함입니다.

이제 `AuthModule`을 업데이트하여 새로운 의존성을 가져오고 `JwtModule`을 구성해야 합니다.

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

JWT 서명 및 확인 단계 간에 키를 공유하는 데 사용할 것입니다.

> Warning **경고** **이 키를 공개적으로 노출하지 마세요**. 코드의 작동 방식을 명확히 보여주기 위해 여기에 포함했지만, 프로덕션 시스템에서는 비밀 저장소, 환경 변수 또는 구성 서비스와 같은 적절한 수단을 사용하여 **이 키를 반드시 보호해야 합니다**.

이제 `auth` 폴더에 있는 `auth.module.ts`를 열고 다음과 같이 업데이트합니다:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

> info **힌트** `JwtModule`을 글로벌로 등록하여 더 쉽게 사용하도록 했습니다. 이는 애플리케이션의 다른 곳에서 `JwtModule`을 가져올 필요가 없음을 의미합니다.

`JwtModule`은 `register()`를 사용하여 구성 객체를 전달하여 구성합니다. Nest `JwtModule`에 대한 자세한 내용은 [여기](https://github.com/nestjs/jwt/blob/master/README.md)를, 사용 가능한 구성 옵션에 대한 자세한 내용은 [여기](https://github.com/auth0/node-jsonwebtoken#usage)를 참조하십시오.

이제 cURL을 사용하여 경로를 다시 테스트해 봅시다. `UsersService`에 하드 코딩된 `user` 객체 중 어느 것으로든 테스트할 수 있습니다.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
```

#### 인증 가드 구현

이제 마지막 요구 사항인 요청에 유효한 JWT가 존재해야만 엔드포인트를 보호하는 것을 처리할 수 있습니다. 경로를 보호하는 데 사용할 수 있는 `AuthGuard`를 생성하여 이를 수행할 것입니다.

```typescript
@@filename(auth/auth.guard)
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

이제 보호된 경로를 구현하고 `AuthGuard`를 등록하여 보호할 수 있습니다.

`auth.controller.ts` 파일을 열고 아래와 같이 업데이트합니다:

```typescript
@@filename(auth.controller)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

방금 생성한 `AuthGuard`를 `GET /profile` 경로에 적용하여 보호되도록 했습니다.

앱이 실행 중인지 확인하고 `cURL`을 사용하여 경로를 테스트합니다.

```bash
$ # GET /profile
$ curl http://localhost:3000/auth/profile
{"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
{"sub":1,"username":"john","iat":...,"exp":...}
```

`AuthModule`에서 JWT 만료 시간을 `60초`로 구성했다는 점에 유의하십시오. 이 만료 시간은 너무 짧으며, 토큰 만료 및 갱신에 대한 세부 사항은 이 문서의 범위를 벗어납니다. 그러나 JWT의 중요한 특징을 시연하기 위해 이렇게 선택했습니다. 인증 후 60초를 기다린 후에 `GET /auth/profile` 요청을 시도하면 `401 Unauthorized` 응답을 받게 될 것입니다. 이는 `@nestjs/jwt`가 JWT의 만료 시간을 자동으로 확인하여 애플리케이션에서 직접 확인할 필요가 없도록 하기 때문입니다.

이제 JWT 인증 구현을 완료했습니다. JavaScript 클라이언트(예: Angular/React/Vue) 및 기타 JavaScript 앱은 이제 API 서버와 안전하게 인증하고 통신할 수 있습니다.

#### 인증을 전역으로 활성화

대부분의 엔드포인트가 기본적으로 보호되어야 한다면, 인증 가드를 [전역 가드](/guards#binding-guards)로 등록하고 각 컨트롤러 상단에 `@UseGuards()` 데코레이터를 사용하는 대신 어떤 경로를 공개할지만 간단히 표시할 수 있습니다.

먼저 다음 구조를 사용하여 `AuthGuard`를 전역 가드로 등록합니다(`AuthModule`과 같이 어떤 모듈에서도 가능합니다):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
],
```

이것을 갖추면 Nest는 `AuthGuard`를 모든 엔드포인트에 자동으로 바인딩합니다.

이제 경로를 공개적으로 선언하는 메커니즘을 제공해야 합니다. 이를 위해 `SetMetadata` 데코레이터 팩토리 함수를 사용하여 사용자 정의 데코레이터를 만들 수 있습니다.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

위 파일에서 두 개의 상수를 내보냈습니다. 하나는 `IS_PUBLIC_KEY`라는 메타데이터 키이고, 다른 하나는 `Public`이라고 부를 새로운 데코레이터 자체입니다(프로젝트에 맞는 이름으로 `SkipAuth` 또는 `AllowAnon`이라고 대체하여 이름을 지정할 수도 있습니다).

이제 사용자 정의 `@Public()` 데코레이터가 있으므로 다음과 같이 모든 메서드를 장식하는 데 사용할 수 있습니다:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

마지막으로 `AuthGuard`가 `"isPublic"` 메타데이터를 찾았을 때 `true`를 반환하도록 해야 합니다. 이를 위해 `Reflector` 클래스를 사용할 것입니다(자세한 내용은 [여기](/guards#putting-it-all-together) 참조).

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### Passport 통합

[Passport](https://github.com/jaredhanson/passport)는 커뮤니티에서 잘 알려져 있고 많은 프로덕션 애플리케이션에서 성공적으로 사용되는 가장 인기 있는 node.js 인증 라이브러리입니다. `@nestjs/passport` 모듈을 사용하면 이 라이브러리를 **Nest** 애플리케이션과 쉽게 통합할 수 있습니다.

Passport를 NestJS와 통합하는 방법을 배우려면 이 [챕터](/recipes/passport)를 확인하십시오.

#### 예제

이 챕터의 전체 코드는 [여기](https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt)에서 찾을 수 있습니다.