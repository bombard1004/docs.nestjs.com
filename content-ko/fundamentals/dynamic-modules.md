### 동적 모듈

[모듈 챕터](/modules)는 Nest 모듈의 기본 사항을 다루며, [동적 모듈](https://nestjs.dokidocs.dev/modules#dynamic-modules)에 대한 간략한 소개를 포함합니다. 이 챕터는 동적 모듈에 대한 내용을 확장합니다. 이 챕터를 완료하면 동적 모듈이 무엇이며 언제 어떻게 사용해야 하는지에 대한 충분한 이해를 갖게 될 것입니다.

#### 소개

문서의 **개요** 섹션에 있는 대부분의 애플리케이션 코드 예제는 일반 또는 정적 모듈을 사용합니다. 모듈은 전반적인 애플리케이션의 모듈식 부분으로 함께 어울리는 [프로바이더](/providers) 및 [컨트롤러](/controllers)와 같은 구성 요소 그룹을 정의합니다. 이 구성 요소에 대한 실행 컨텍스트 또는 스코프를 제공합니다. 예를 들어, 모듈에 정의된 프로바이더는 내보낼 필요 없이 모듈의 다른 멤버에게 표시됩니다. 프로바이더가 모듈 외부에서 표시되어야 하는 경우, 먼저 호스트 모듈에서 내보내지고 소비하는 모듈로 가져와집니다.

친숙한 예제를 살펴보겠습니다.

먼저, `UsersService`를 제공하고 내보내기 위해 `UsersModule`을 정의합니다. `UsersModule`은 `UsersService`의 **호스트** 모듈입니다.

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

다음으로, `UsersModule`을 가져오는 `AuthModule`을 정의하여 `UsersModule`의 내보낸 프로바이더가 `AuthModule` 내에서 사용 가능하도록 합니다.

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

이러한 구성은 예를 들어 `AuthModule`에 호스트된 `AuthService`에 `UsersService`를 주입할 수 있게 합니다.

```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  /*
    this.usersService를 사용하는 구현
  */
}
```

이를 **정적** 모듈 바인딩이라고 부릅니다. Nest가 모듈을 함께 연결하는 데 필요한 모든 정보는 이미 호스트 모듈과 소비하는 모듈에 선언되어 있습니다. 이 과정에서 어떤 일이 일어나는지 살펴보겠습니다. Nest는 `UsersService`를 `AuthModule` 내에서 다음과 같이 사용 가능하게 합니다.

1. `UsersModule` 인스턴스화 - `UsersModule` 자체가 소비하는 다른 모듈을 전이적으로 가져오고 모든 의존성을 전이적으로 해결합니다( [사용자 지정 프로바이더](https://nestjs.dokidocs.dev/fundamentals/custom-providers) 참조).
2. `AuthModule` 인스턴스화 - `UsersModule`의 내보낸 프로바이더를 `AuthModule`의 구성 요소가 사용할 수 있도록 합니다(마치 `AuthModule`에 선언된 것처럼).
3. `AuthService`에 `UsersService` 인스턴스 주입.

#### 동적 모듈 사용 사례

정적 모듈 바인딩의 경우, 소비하는 모듈이 호스트 모듈의 프로바이더가 구성되는 방식에 **영향**을 미칠 기회가 없습니다. 왜 이것이 중요할까요? 다양한 사용 사례에서 다르게 동작해야 하는 범용 모듈이 있는 경우를 고려해 보십시오. 이는 많은 시스템에서 "플러그인"의 개념과 유사하며, 일반 기능이 소비자에 의해 사용되기 전에 일부 구성이 필요합니다.

Nest의 좋은 예는 **구성 모듈**입니다. 많은 애플리케이션에서는 구성 모듈을 사용하여 구성 세부 정보를 외부화하는 것이 유용하다는 것을 알 수 있습니다. 이렇게 하면 다양한 배포 환경에서 애플리케이션 설정을 동적으로 쉽게 변경할 수 있습니다. 예를 들어, 개발자용 개발 데이터베이스, 스테이징/테스트 환경용 스테이징 데이터베이스 등이 있습니다. 구성 매개변수 관리를 구성 모듈에 위임함으로써 애플리케이션 소스 코드는 구성 매개변수와 독립적으로 유지됩니다.

어려운 점은 구성 모듈 자체가 일반적이므로("플러그인"과 유사) 소비하는 모듈에 의해 사용자 지정되어야 한다는 것입니다. 여기서 _동적 모듈_이 등장합니다. 동적 모듈 기능을 사용하면 구성 모듈을 **동적**으로 만들어 소비하는 모듈이 가져오는 시점에 구성 모듈을 사용자 지정하는 방법을 제어할 수 있는 API를 사용할 수 있습니다.

즉, 동적 모듈은 다른 모듈을 가져오는 API를 제공하며, 지금까지 본 정적 바인딩을 사용하는 것과 달리 가져올 때 해당 모듈의 속성 및 동작을 사용자 지정할 수 있습니다.

<app-banner-devtools></app-banner-devtools>

#### Config 모듈 예제

이 섹션에서는 [구성 챕터](https://nestjs.dokidocs.dev/techniques/configuration#service)의 예제 코드 기본 버전을 사용합니다. 이 챕터 끝 부분의 완성된 버전은 작동하는 [여기 예제](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules)로 제공됩니다.

우리의 요구 사항은 `ConfigModule`이 사용자 지정을 위해 `options` 객체를 받아들이도록 만드는 것입니다. 지원하려는 기능은 다음과 같습니다. 기본 샘플은 `.env` 파일의 위치를 프로젝트 루트 폴더에 하드코딩합니다. 원하는 폴더에서 `.env` 파일을 관리할 수 있도록 구성 가능하게 만들고 싶다고 가정해 보겠습니다. 예를 들어, 프로젝트 루트 아래 `config`라는 폴더에 다양한 `.env` 파일을 저장하고 싶다고 상상해 보십시오(`src`의 형제 폴더). 다른 프로젝트에서 `ConfigModule`을 사용할 때 다른 폴더를 선택할 수 있도록 하고 싶습니다.

동적 모듈은 가져오는 모듈에 매개변수를 전달하여 동작을 변경할 수 있는 기능을 제공합니다. 어떻게 작동하는지 살펴보겠습니다. 소비 모듈의 관점에서 어떤 모습일지 최종 목표부터 시작하여 역방향으로 작업하는 것이 도움이 됩니다. 먼저, `ConfigModule`을 _정적으로_ 가져오는 예제를 빠르게 검토해 보겠습니다(즉, 가져온 모듈의 동작에 영향을 미칠 수 없는 접근 방식). `@Module()` 데코레이터의 `imports` 배열에 주의하십시오.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

구성 객체를 전달하는 _동적 모듈_ 가져오기가 어떤 모습일지 고려해 보겠습니다. 이 두 예제의 `imports` 배열의 차이점을 비교하십시오.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

위의 동적 예제에서 어떤 일이 일어나고 있는지 살펴보겠습니다. 어떤 부분들이 움직이고 있나요?

1. `ConfigModule`은 일반 클래스이므로, `register()`라는 **정적 메서드**가 있어야 함을 유추할 수 있습니다. 클래스의 **인스턴스**가 아닌 `ConfigModule` 클래스에서 호출하고 있기 때문에 정적임을 알 수 있습니다. 참고: 곧 생성할 이 메서드는 어떤 임의의 이름이든 가질 수 있지만, 규칙적으로 `forRoot()` 또는 `register()`라고 부르는 것이 좋습니다.
2. `register()` 메서드는 우리가 정의하므로, 원하는 모든 입력 인수를 받을 수 있습니다. 이 경우, 간단한 `options` 객체를 적절한 속성과 함께 받을 것입니다. 이는 일반적인 경우입니다.
3. `register()` 메서드는 익숙한 `imports` 목록에 해당 반환 값이 나타나기 때문에 `module`과 유사한 것을 반환해야 함을 유추할 수 있습니다. 지금까지 `imports` 목록은 모듈 목록을 포함하는 것을 보았습니다.

사실, `register()` 메서드가 반환하는 것은 `DynamicModule`입니다. 동적 모듈은 런타임에 생성된 모듈이며, 정적 모듈과 정확히 동일한 속성과 `module`이라는 추가 속성을 가집니다. 데코레이터에 전달된 모듈 옵션에 주의하면서 샘플 정적 모듈 선언을 빠르게 검토해 보겠습니다.

```typescript
@Module({
  imports: [DogsModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
```

동적 모듈은 `module`이라는 하나의 추가 속성을 포함하여 정확히 동일한 인터페이스를 가진 객체를 반환해야 합니다. `module` 속성은 모듈의 이름 역할을 하며, 아래 예제와 같이 모듈의 클래스 이름과 같아야 합니다.

> info **힌트** 동적 모듈의 경우, 모듈 옵션 객체의 모든 속성은 `module`을 제외하고는 선택 사항입니다.

정적 `register()` 메서드는 어떨까요? 이제 그 역할이 `DynamicModule` 인터페이스를 가진 객체를 반환하는 것임을 알 수 있습니다. 이 메서드를 호출하면 `@Module` 데코레이터에서 속성을 고정하는 대신 프로그래밍 방식으로 지정하는 것과 유사하게 `imports` 목록에 모듈을 효과적으로 제공하는 것입니다. 즉, 동적 모듈 API는 단순히 모듈을 반환하지만, `@Module` 데코레이터에 속성을 고정하는 대신 프로그래밍 방식으로 지정합니다.

그림을 완성하는 데 도움이 되는 몇 가지 세부 사항이 아직 남아 있습니다.

1. `@Module()` 데코레이터의 `imports` 속성은 모듈 클래스 이름(`imports: [UsersModule]`과 같이)뿐만 아니라 동적 모듈을 **반환하는** 함수(`imports: [ConfigModule.register(...)]`과 같이)도 사용할 수 있다고 말할 수 있습니다.
2. 동적 모듈은 다른 모듈을 자체적으로 가져올 수 있습니다. 이 예제에서는 그렇게 하지 않겠지만, 동적 모듈이 다른 모듈의 프로바이더에 의존하는 경우 선택적 `imports` 속성을 사용하여 가져올 수 있습니다. 다시 말하지만, 이는 `@Module()` 데코레이터를 사용하여 정적 모듈의 메타데이터를 선언하는 방식과 정확히 유사합니다.

이러한 이해를 바탕으로 이제 동적 `ConfigModule` 선언이 어떻게 보여야 하는지 살펴볼 수 있습니다. 한번 시도해 봅시다.

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(): DynamicModule {
    return {
      module: ConfigModule,
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
```

이제 각 부분이 어떻게 연결되는지 명확해졌을 것입니다. `ConfigModule.register(...)`를 호출하면 `DynamicModule` 객체가 반환되며, 이 객체의 속성은 지금까지 `@Module()` 데코레이터를 통해 메타데이터로 제공했던 속성과 기본적으로 동일합니다.

> info **힌트** `@nestjs/common`에서 `DynamicModule`를 가져오세요.

하지만 동적 모듈은 우리가 원하는 대로 **구성**하는 기능을 아직 도입하지 않았기 때문에 그다지 흥미롭지 않습니다. 다음으로 이것을 해결해 봅시다.

#### 모듈 구성

`ConfigModule`의 동작을 사용자 정의하는 명백한 해결책은 위에서 예상한 대로 정적 `register()` 메서드에 `options` 객체를 전달하는 것입니다. 소비 모듈의 `imports` 속성을 다시 한번 살펴보겠습니다.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

이것은 우리 동적 모듈에 `options` 객체를 전달하는 것을 잘 처리합니다. 그렇다면 `ConfigModule`에서 그 `options` 객체를 어떻게 사용합니까? 잠시 생각해보겠습니다. 우리 `ConfigModule`이 기본적으로 다른 프로바이더가 사용할 수 있도록 주입 가능한 서비스인 `ConfigService`를 제공하고 내보내기 위한 호스트라는 것을 알고 있습니다. 실제로 동작을 사용자 정의하기 위해 `options` 객체를 읽어야 하는 것은 `ConfigService`입니다. 현재 `register()` 메서드에서 `options`를 `ConfigService`로 어떻게든 가져오는 방법을 알고 있다고 가정해 봅시다. 이 가정을 통해 `options` 객체의 속성을 기반으로 동작을 사용자 정의하기 위해 서비스에 몇 가지 변경을 가할 수 있습니다. (**참고**: 현재는 실제로 전달하는 방법을 _결정하지 않았기_ 때문에 `options`를 하드코딩할 것입니다. 잠시 후에 이것을 수정할 것입니다).

```typescript
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    const options = { folder: './config' };

    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
```

이제 우리 `ConfigService`는 `options`에 지정한 폴더에서 `.env` 파일을 찾는 방법을 알고 있습니다.

남은 작업은 `register()` 단계에서 얻은 `options` 객체를 `ConfigService`에 어떤 식으로든 주입하는 것입니다. 그리고 물론, 이를 위해 _의존성 주입_을 사용할 것입니다. 이것은 핵심 포인트이므로 반드시 이해해야 합니다. 우리 `ConfigModule`은 `ConfigService`를 제공하고 있습니다. `ConfigService`는 런타임에만 제공되는 `options` 객체에 의존합니다. 따라서 런타임에 먼저 Nest IoC 컨테이너에 `options` 객체를 바인딩하고, Nest가 이를 `ConfigService`에 주입하도록 해야 합니다. **사용자 지정 프로바이더** 챕터에서 프로바이더가 서비스뿐만 아니라 [어떤 값이라도 포함할 수 있음](https://nestjs.dokidocs.dev/fundamentals/custom-providers#non-service-based-providers)을 기억하세요. 따라서 간단한 `options` 객체를 처리하기 위해 의존성 주입을 사용하는 것은 문제 없습니다.

먼저 options 객체를 IoC 컨테이너에 바인딩하는 작업을 해봅시다. 이는 정적 `register()` 메서드에서 수행합니다. 우리가 동적으로 모듈을 구성하고 있으며, 모듈의 속성 중 하나는 프로바이더 목록임을 기억하십시오. 따라서 우리가 해야 할 일은 options 객체를 프로바이더로 정의하는 것입니다. 이렇게 하면 ConfigService에 주입 가능하게 되며, 다음 단계에서 이를 활용할 것입니다. 아래 코드에서 `providers` 배열에 주의하십시오.

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
```

이제 비 클래스 토큰을 사용하여 프로바이더를 정의할 때 [@Inject() 데코레이터를 사용해야 함](https://nestjs.dokidocs.dev/fundamentals/custom-providers#non-class-based-provider-tokens)을 상기하면서 `'CONFIG_OPTIONS'` 프로바이더를 `ConfigService`에 주입하여 프로세스를 완료할 수 있습니다.

```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Inject } from '@nestjs/common';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {
    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
```

마지막으로 한 가지 더: 위에서는 간단하게 문자열 기반 주입 토큰 (`'CONFIG_OPTIONS'`)을 사용했지만, 모범 사례는 별도의 파일에 상수로 (또는 `Symbol`) 정의하고 해당 파일을 가져오는 것입니다. 예:

```typescript
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
```

#### 예제

이 챕터의 코드 전체 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules)에서 찾을 수 있습니다.

#### 커뮤니티 가이드라인

일부 `@nestjs/` 패키지에서 `forRoot`, `register`, `forFeature`와 같은 메서드의 사용을 보았을 수 있으며 이러한 메서드의 차이점이 무엇인지 궁금할 수 있습니다. 이에 대한 엄격한 규칙은 없지만, `@nestjs/` 패키지는 다음 가이드라인을 따르려고 노력합니다:

모듈을 생성할 때:

- `register`는 호출 모듈만 사용하도록 특정 구성으로 동적 모듈을 구성할 것으로 예상합니다. 예를 들어, Nest의 `@nestjs/axios`를 사용할 때: `HttpModule.register({{ '{' }} baseUrl: 'someUrl' {{ '}' }})`. 다른 모듈에서 `HttpModule.register({{ '{' }} baseUrl: 'somewhere else' {{ '}' }})`를 사용하면 다른 구성을 갖게 됩니다. 원하는 만큼 많은 모듈에 대해 이 작업을 수행할 수 있습니다.

- `forRoot`는 동적 모듈을 한 번 구성하고 해당 구성을 여러 곳에서 재사용할 것으로 예상합니다 (비록 추상화되어 무의식적으로 일어날 수 있습니다). 이것이 하나의 `GraphQLModule.forRoot()`, 하나의 `TypeOrmModule.forRoot()` 등이 있는 이유입니다.

- `forFeature`는 동적 모듈의 `forRoot` 구성을 사용할 것으로 예상하지만, 호출 모듈의 특정 요구 사항에 맞게 일부 구성을 수정해야 합니다 (예: 이 모듈이 액세스해야 하는 리포지토리 또는 로거가 사용해야 하는 컨텍스트).

이들 모두는 일반적으로 `async` 대응 메서드인 `registerAsync`, `forRootAsync`, `forFeatureAsync`도 가지고 있으며, 이는 동일한 의미를 가지지만 Nest의 의존성 주입을 구성에도 사용합니다.

#### 구성 가능한 모듈 빌더

특히 초보자에게 고도로 구성 가능한 동적 모듈을 수동으로 생성하고 `async` 메서드(`registerAsync`, `forRootAsync` 등)를 노출하는 것은 매우 복잡하므로, Nest는 이 프로세스를 용이하게 하고 몇 줄의 코드로 모듈 "청사진"을 구성할 수 있는 `ConfigurableModuleBuilder` 클래스를 노출합니다.

예를 들어, 위에서 사용한 예제(`ConfigModule`)를 가져와 `ConfigurableModuleBuilder`를 사용하도록 변환해 보겠습니다. 시작하기 전에 `ConfigModule`이 받아들이는 옵션을 나타내는 전용 인터페이스를 생성해야 합니다.

```typescript
export interface ConfigModuleOptions {
  folder: string;
}
```

이것이 준비되었으면, 기존 `config.module.ts` 파일과 나란히 새 전용 파일을 생성하고 `config.module-definition.ts` 이름을 지정합니다. 이 파일에서 `ConfigurableModuleBuilder`를 활용하여 `ConfigModule` 정의를 구성해 보겠습니다.

```typescript
@@filename(config.module-definition)
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConfigModuleOptions } from './interfaces/config-module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
@@switch
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().build();
```

이제 `config.module.ts` 파일을 열고 자동 생성된 `ConfigurableModuleClass`를 활용하도록 구현을 수정해 보겠습니다.

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {}
```

`ConfigurableModuleClass`를 확장한다는 것은 `ConfigModule`이 이제 `register` 메서드(이전의 사용자 지정 구현과 마찬가지로)뿐만 아니라 소비자가 비동기적으로 해당 모듈을 구성할 수 있도록 하는 `registerAsync` 메서드도 제공한다는 의미입니다. 예를 들어 비동기 팩토리를 제공함으로써 가능합니다.

```typescript
@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    // 또는 대안으로:
    // ConfigModule.registerAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...any extra dependencies...]
    // }),
  ],
})
export class AppModule {}
```

마지막으로, `ConfigService` 클래스를 업데이트하여 지금까지 사용한 `'CONFIG_OPTIONS'` 대신 생성된 모듈 옵션 프로바이더를 주입하도록 합시다.

```typescript
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) { ... }
}
```

#### 사용자 지정 메서드 키

`ConfigurableModuleClass`는 기본적으로 `register` 및 해당 대응 메서드인 `registerAsync`를 제공합니다. 다른 메서드 이름을 사용하려면 다음과 같이 `ConfigurableModuleBuilder#setClassMethodName` 메서드를 사용하십시오.

```typescript
@@filename(config.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setClassMethodName('forRoot').build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setClassMethodName('forRoot').build();
```

이 구성은 `ConfigurableModuleBuilder`에게 `forRoot` 및 `forRootAsync`를 노출하는 클래스를 생성하도록 지시합니다. 예:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ folder: './config' }), // <-- "register" 대신 "forRoot" 사용에 주목
    // 또는 대안으로:
    // ConfigModule.forRootAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...any extra dependencies...]
    // }),
  ],
})
export class AppModule {}
```

#### 사용자 지정 옵션 팩토리 클래스

`registerAsync` 메서드 (또는 구성에 따라 `forRootAsync` 또는 다른 이름)는 소비자가 모듈 구성으로 해결되는 프로바이더 정의를 전달하도록 허용하므로, 라이브러리 소비자는 구성 객체를 구성하는 데 사용될 클래스를 잠재적으로 제공할 수 있습니다.

```typescript
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory,
    }),
  ],
})
export class AppModule {}
```

이 클래스는 기본적으로 모듈 구성 객체를 반환하는 `create()` 메서드를 제공해야 합니다. 그러나 라이브러리가 다른 명명 규칙을 따르는 경우, 이 동작을 변경하고 `ConfigurableModuleBuilder`에게 `ConfigurableModuleBuilder#setFactoryMethodName` 메서드를 사용하여 예를 들어 `createConfigOptions`와 같은 다른 메서드를 예상하도록 지시할 수 있습니다.

```typescript
@@filename(config.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setFactoryMethodName('createConfigOptions').build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setFactoryMethodName('createConfigOptions').build();
```

이제 `ConfigModuleOptionsFactory` 클래스는 `create` 대신 `createConfigOptions` 메서드를 노출해야 합니다.

```typescript
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory, // <-- 이 클래스는 "createConfigOptions" 메서드를 제공해야 합니다.
    }),
  ],
})
export class AppModule {}
```

#### 추가 옵션

모듈이 어떻게 동작해야 하는지를 결정하는 추가 옵션을 받아야 하는 예외적인 경우가 있습니다 (이러한 옵션의 좋은 예는 `isGlobal` 플래그 또는 단순히 `global`입니다). 동시에 이러한 옵션은 `MODULE_OPTIONS_TOKEN` 프로바이더에 포함되어서는 안 됩니다 (예: `ConfigService`는 호스트 모듈이 전역 모듈로 등록되었는지 여부를 알 필요가 없습니다).

이러한 경우 `ConfigurableModuleBuilder#setExtras` 메서드를 사용할 수 있습니다. 다음 예제를 참조하십시오.

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<ConfigModuleOptions>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();
```

위 예제에서 `setExtras` 메서드에 전달된 첫 번째 인수는 "추가" 속성에 대한 기본값을 포함하는 객체입니다. 두 번째 인수는 자동 생성된 모듈 정의(`provider`, `exports` 등 포함)와 "추가" 속성(소비자가 지정했거나 기본값)을 나타내는 `extras` 객체를 받는 함수입니다. 이 함수의 반환 값은 수정된 모듈 정의입니다. 이 특정 예제에서는 `extras.isGlobal` 속성을 모듈 정의의 `global` 속성에 할당하고 있습니다 (이는 차례로 모듈이 전역인지 여부를 결정합니다. 자세한 내용은 [여기](/modules#dynamic-modules)를 참조하십시오).

이제 이 모듈을 소비할 때 다음과 같이 추가 `isGlobal` 플래그를 전달할 수 있습니다.

```typescript
@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      folder: './config',
    }),
  ],
})
export class AppModule {}
```

하지만 `isGlobal`은 "추가" 속성으로 선언되었기 때문에 `MODULE_OPTIONS_TOKEN` 프로바이더에서는 사용할 수 없습니다.

```typescript
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) {
    // "options" 객체는 "isGlobal" 속성을 가지지 않습니다.
    // ...
  }
}
```

#### 자동 생성된 메서드 확장

필요한 경우 자동 생성된 정적 메서드(`register`, `registerAsync` 등)를 다음과 같이 확장할 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE, OPTIONS_TYPE } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      // 여기에 사용자 지정 로직 추가
      ...super.register(options),
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      // 여기에 사용자 지정 로직 추가
      ...super.registerAsync(options),
    };
  }
}
```

`OPTIONS_TYPE` 및 `ASYNC_OPTIONS_TYPE` 유형은 모듈 정의 파일에서 내보내야 한다는 점에 유의하십시오.

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
```