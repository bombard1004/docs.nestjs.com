### 모듈

모듈은 `@Module()` 데코레이터로 주석이 달린 클래스입니다. 이 데코레이터는 **Nest**가 애플리케이션 구조를 효율적으로 구성하고 관리하는 데 사용하는 메타데이터를 제공합니다.

<figure><img class="illustrative-image" src="/assets/Modules_1.png" /></figure>

모든 Nest 애플리케이션에는 Nest가 **애플리케이션 그래프**를 구축하는 시작점 역할을 하는 최소 하나의 모듈인 **루트 모듈**이 있습니다. 이 그래프는 Nest가 모듈과 프로바이더 간의 관계 및 종속성을 해결하는 데 사용하는 내부 구조입니다. 소규모 애플리케이션에는 루트 모듈만 있을 수 있지만, 일반적으로는 그렇지 않습니다. 모듈은 컴포넌트를 구성하는 효과적인 방법으로 **강력히 권장됩니다**. 대부분의 애플리케이션에서는 밀접하게 관련된 **기능**을 캡슐화하는 여러 모듈을 갖게 될 것입니다.

`@Module()` 데코레이터는 모듈을 설명하는 속성을 가진 단일 객체를 받습니다:

|               |                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers`   | Nest 인젝터에 의해 인스턴스화되고 최소한 이 모듈 내에서 공유될 수 있는 프로바이더                                                                                                                        |
| `controllers` | 이 모듈에서 정의되고 인스턴스화되어야 하는 컨트롤러 세트                                                                                                                                                     |
| `imports`     | 이 모듈에 필요한 프로바이더를 내보내는 임포트된 모듈 목록                                                                                                                                                   |
| `exports`     | 이 모듈에서 제공되고 이 모듈을 임포트하는 다른 모듈에서 사용할 수 있어야 하는 `providers`의 하위 집합입니다. 프로바이더 자체 또는 해당 토큰(`provide` 값)만 사용할 수 있습니다 |

모듈은 기본적으로 프로바이더를 **캡슐화**합니다. 즉, 현재 모듈의 일부이거나 임포트된 다른 모듈에서 명시적으로 내보낸 프로바이더만 주입할 수 있습니다. 모듈에서 내보낸 프로바이더는 기본적으로 모듈의 공개 인터페이스 또는 API 역할을 합니다.

#### 기능 모듈

예제에서 `CatsController`와 `CatsService`는 밀접하게 관련되어 있으며 동일한 애플리케이션 도메인을 지원합니다. 이들을 기능 모듈로 그룹화하는 것이 합리적입니다. 기능 모듈은 특정 기능과 관련된 코드를 구성하여 명확한 경계를 유지하고 더 나은 구성을 돕습니다. 이는 애플리케이션이나 팀이 성장함에 따라 특히 중요하며, [SOLID](https://en.wikipedia.org/wiki/SOLID) 원칙과도 일치합니다.

다음으로 컨트롤러와 서비스를 그룹화하는 방법을 보여주기 위해 `CatsModule`을 생성합니다.

```typescript
@@filename(cats/cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

> info **팁** CLI를 사용하여 모듈을 생성하려면 `$ nest g module cats` 명령어를 실행하기만 하면 됩니다.

위에서 우리는 `cats.module.ts` 파일에 `CatsModule`을 정의하고 이 모듈과 관련된 모든 것을 `cats` 디렉토리로 옮겼습니다. 마지막으로 이 모듈을 루트 모듈( `app.module.ts` 파일에 정의된 `AppModule`)로 임포트해야 합니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

현재 디렉토리 구조는 다음과 같습니다:

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">cats</div>
    <div class="children">
      <div class="item">dto</div>
      <div class="children">
        <div class="item">create-cat.dto.ts</div>
      </div>
      <div class="item">interfaces</div>
      <div class="children">
        <div class="item">cat.interface.ts</div>
      </div>
      <div class="item">cats.controller.ts</div>
      <div class="item">cats.module.ts</div>
      <div class="item">cats.service.ts</div>
    </div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

#### 공유 모듈

Nest에서 모듈은 기본적으로 **싱글톤**이므로 여러 모듈 간에 프로바이더의 동일한 인스턴스를 쉽게 공유할 수 있습니다.

<figure><img class="illustrative-image" src="/assets/Shared_Module_1.png" /></figure>

모든 모듈은 자동으로 **공유 모듈**이 됩니다. 일단 생성되면 어떤 모듈에서도 재사용할 수 있습니다. 이제 여러 다른 모듈 간에 `CatsService` 인스턴스를 공유하고 싶다고 가정해 봅시다. 그렇게 하려면 먼저 아래와 같이 모듈의 `exports` 배열에 추가하여 `CatsService` 프로바이더를 **내보내야** 합니다:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
export class CatsModule {}
```

이제 `CatsModule`을 임포트하는 모든 모듈은 `CatsService`에 접근할 수 있으며, 이를 임포트하는 다른 모든 모듈과 동일한 인스턴스를 공유하게 됩니다.

`CatsService`가 필요한 모든 모듈에 직접 `CatsService`를 등록한다면 작동은 하겠지만, 각 모듈이 `CatsService`의 자체적인 별도 인스턴스를 갖게 될 것입니다. 이는 동일한 서비스의 여러 인스턴스가 생성되어 메모리 사용량을 증가시킬 수 있으며, 서비스가 내부 상태를 유지하는 경우 상태 불일치와 같은 예기치 않은 동작을 유발할 수도 있습니다.

`CatsModule`과 같은 모듈 내부에 `CatsService`를 캡슐화하고 내보냄으로써, `CatsModule`을 임포트하는 모든 모듈에서 `CatsService`의 동일한 인스턴스가 재사용되도록 보장합니다. 이는 메모리 소비를 줄일 뿐만 아니라 모든 모듈이 동일한 인스턴스를 공유하여 공유 상태나 리소스를 더 쉽게 관리할 수 있으므로 더 예측 가능한 동작을 가능하게 합니다. 이는 NestJS와 같은 프레임워크에서 모듈성 및 의존성 주입의 주요 이점 중 하나이며, 애플리케이션 전체에서 서비스를 효율적으로 공유할 수 있도록 합니다.

<app-banner-devtools></app-banner-devtools>

#### 모듈 재내보내기

위에서 보았듯이 모듈은 내부 프로바이더를 내보낼 수 있습니다. 또한 임포트한 모듈을 다시 내보낼 수 있습니다. 아래 예제에서 `CommonModule`은 `CoreModule`로 임포트됨과 **동시에** 내보내지므로, 이 모듈을 임포트하는 다른 모듈에서 사용할 수 있습니다.

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

#### 의존성 주입

모듈 클래스도 프로바이더를 **주입**할 수 있습니다 (예: 설정을 위해):

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
@@switch
import { Module, Dependencies } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
@Dependencies(CatsService)
export class CatsModule {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

하지만 모듈 클래스 자체는 [순환 종속성](/fundamentals/circular-dependency) 때문에 프로바이더로 주입될 수 없습니다.

#### 전역 모듈

동일한 모듈 세트를 모든 곳에서 임포트해야 한다면 지루할 수 있습니다. Nest와 달리 [Angular](https://angular.dev)의 `providers`는 전역 범위에 등록됩니다. 일단 정의되면 모든 곳에서 사용할 수 있습니다. 하지만 Nest는 프로바이더를 모듈 범위 내에 캡슐화합니다. 캡슐화하는 모듈을 먼저 임포트하지 않고서는 다른 곳에서 모듈의 프로바이더를 사용할 수 없습니다.

어디서든 바로 사용할 수 있어야 하는 프로바이더 세트(예: 헬퍼, 데이터베이스 연결 등)를 제공하고 싶을 때, `@Global()` 데코레이터를 사용하여 모듈을 **전역**으로 만드세요.

```typescript
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

`@Global()` 데코레이터는 모듈을 전역 범위로 만듭니다. 전역 모듈은 **한 번만** 등록해야 하며, 일반적으로 루트 또는 코어 모듈에 의해 등록됩니다. 위 예제에서 `CatsService` 프로바이더는 어디서든 사용할 수 있으며, 서비스를 주입하려는 모듈은 imports 배열에 `CatsModule`을 임포트할 필요가 없습니다.

> info **팁** 모든 것을 전역으로 만드는 것은 설계 관행으로 권장되지 않습니다. 전역 모듈이 상용구 코드를 줄이는 데 도움이 될 수 있지만, 일반적으로는 `imports` 배열을 사용하여 제어되고 명확한 방식으로 다른 모듈에 모듈의 API를 사용할 수 있도록 하는 것이 더 좋습니다. 이 접근 방식은 더 나은 구조와 유지보수성을 제공하며, 애플리케이션의 관련 없는 부분 간의 불필요한 결합을 피하면서 모듈의 필요한 부분만 다른 모듈과 공유되도록 보장합니다.

#### 동적 모듈

Nest의 동적 모듈을 사용하면 런타임에 구성할 수 있는 모듈을 생성할 수 있습니다. 이는 특정 옵션이나 구성을 기반으로 프로바이더를 생성할 수 있는 유연하고 사용자 정의 가능한 모듈을 제공해야 할 때 특히 유용합니다. **동적 모듈**이 작동하는 방식에 대한 간략한 개요입니다.

```typescript
@@filename()
import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
@@switch
import { Module } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options) {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

> info **팁** `forRoot()` 메소드는 동적 모듈을 동기적으로 또는 비동기적으로(`Promise`를 통해) 반환할 수 있습니다.

이 모듈은 기본적으로 (`@Module()` 데코레이터 메타데이터에서) `Connection` 프로바이더를 정의하지만, 추가적으로 - `forRoot()` 메소드에 전달된 `entities` 및 `options` 객체에 따라 - 예를 들어 리포지토리와 같은 프로바이더 컬렉션을 노출합니다. 동적 모듈이 반환하는 속성은 `@Module()` 데코레이터에 정의된 기본 모듈 메타데이터를 **확장**한다는 점에 유의하세요 (재정의하지 않고). 이것이 정적으로 선언된 `Connection` 프로바이더와 동적으로 생성된 리포지토리 프로바이더 모두 모듈에서 내보내지는 방식입니다.

동적 모듈을 전역 범위에 등록하려면 `global` 속성을 `true`로 설정하세요.

```typescript
{
  global: true,
  module: DatabaseModule,
  providers: providers,
  exports: providers,
}
```

> warning **경고** 위에서 언급했듯이 모든 것을 전역으로 만드는 것은 **좋은 설계 결정이 아닙니다**.

`DatabaseModule`은 다음과 같이 임포트하고 구성할 수 있습니다:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

동적 모듈을 다시 내보내려면 exports 배열에서 `forRoot()` 메소드 호출을 생략할 수 있습니다:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
  exports: [DatabaseModule],
})
export class AppModule {}
```

[동적 모듈](/fundamentals/dynamic-modules) 챕터에서 이 주제를 더 자세히 다루며, [실행 예제](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules)도 포함되어 있습니다.

> info **팁** [이 챕터](/fundamentals/dynamic-modules#configurable-module-builder)에서 `ConfigurableModuleBuilder`를 사용하여 고도로 사용자 정의 가능한 동적 모듈을 구축하는 방법을 알아보세요.
