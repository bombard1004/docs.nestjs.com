### 커스텀 프로바이더

이전 장에서 **의존성 주입(DI)**과 Nest에서 어떻게 사용되는지에 대해 다양한 측면을 다루었습니다. 한 가지 예로 인스턴스(종종 서비스 프로바이더)를 클래스에 주입하는 데 사용되는 [생성자 기반](https://docs.nestjs.com/providers#dependency-injection) 의존성 주입이 있습니다. 의존성 주입이 Nest 코어에 근본적으로 내장되어 있다는 사실에 놀라지 않을 것입니다. 지금까지는 하나의 주요 패턴만 살펴보았습니다. 애플리케이션이 더 복잡해짐에 따라 DI 시스템의 모든 기능을 활용해야 할 수도 있으므로, 더 자세히 살펴보겠습니다.

#### DI 기본 원리

의존성 주입은 [제어의 역전(IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) 기술입니다. 코드에서 명령적으로 종속성을 인스턴스화하는 대신, IoC 컨테이너(우리의 경우 NestJS 런타임 시스템)에 종속성의 인스턴스화를 위임합니다. [프로바이더 장](https://docs.nestjs.com/providers)에 있는 다음 예제에서 어떤 일이 벌어지는지 살펴보겠습니다.

먼저 프로바이더를 정의합니다. `@Injectable()` 데코레이터는 `CatsService` 클래스를 프로바이더로 표시합니다.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  findAll(): Cat[] {
    return this.cats;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  findAll() {
    return this.cats;
  }
}
```

그런 다음 Nest가 이 프로바이더를 컨트롤러 클래스에 주입하도록 요청합니다.

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

마지막으로 Nest IoC 컨테이너에 프로바이더를 등록합니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

이것이 작동하기 위해 내부적으로 정확히 무슨 일이 일어나고 있을까요? 이 과정에는 세 가지 주요 단계가 있습니다.

1.  `cats.service.ts`에서 `@Injectable()` 데코레이터는 `CatsService` 클래스가 Nest IoC 컨테이너에서 관리될 수 있는 클래스임을 선언합니다.
2.  `cats.controller.ts`에서 `CatsController`는 생성자 주입을 통해 `CatsService` 토큰에 대한 종속성을 선언합니다.

```typescript
  constructor(private catsService: CatsService)
```

3.  `app.module.ts`에서 `CatsService` 토큰을 `cats.service.ts` 파일의 `CatsService` 클래스와 연결합니다. 이 연결(또는 _등록_)이 정확히 어떻게 발생하는지 <a href="/fundamentals/custom-providers#standard-providers">아래</a>에서 확인하겠습니다.

Nest IoC 컨테이너가 `CatsController`의 인스턴스를 인스턴스화할 때, 먼저 모든 종속성*을 찾습니다. `CatsService` 종속성을 찾으면 등록 단계(#3 위)에 따라 `CatsService` 토큰에 대한 조회를 수행하고 `CatsService` 클래스를 반환합니다. 기본 동작인 `SINGLETON` 스코프를 가정할 때, Nest는 `CatsService`의 인스턴스를 생성하고 캐시한 다음 반환하거나, 이미 캐시된 인스턴스가 있으면 기존 인스턴스를 반환합니다.

\*이 설명은 요점을 설명하기 위해 다소 단순화되었습니다. 우리가 간과한 한 가지 중요한 영역은 종속성을 분석하는 과정이 매우 정교하며 애플리케이션 부트스트랩 중에 발생한다는 것입니다. 한 가지 핵심 특징은 종속성 분석(또는 "종속성 그래프 생성")이 **전이적**이라는 것입니다. 위 예제에서 `CatsService` 자체에 종속성이 있다면, 그 종속성들도 해결될 것입니다. 종속성 그래프는 종속성이 올바른 순서로 해결되도록 보장합니다 - 본질적으로 "아래에서 위로". 이 메커니즘은 개발자가 이러한 복잡한 종속성 그래프를 관리해야 하는 부담을 덜어줍니다.

<app-banner-courses></app-banner-courses>

#### 표준 프로바이더

`@Module()` 데코레이터를 자세히 살펴보겠습니다. `app.module`에서 다음과 같이 선언합니다.

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
```

`providers` 속성은 `providers` 배열을 받습니다. 지금까지는 클래스 이름 목록을 통해 프로바이더를 제공했습니다. 사실 `providers: [CatsService]` 구문은 더 완전한 구문의 단축 표현입니다.

```typescript
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
];
```

이 명시적인 구조를 보면 등록 과정을 이해할 수 있습니다. 여기에서 우리는 `CatsService` 토큰을 `CatsService` 클래스와 명확하게 연결하고 있습니다. 단축 표기법은 토큰이 같은 이름의 클래스 인스턴스를 요청하는 데 사용되는 가장 일반적인 사용 사례를 단순화하기 위한 편의 기능일 뿐입니다.

#### 커스텀 프로바이더

_표준 프로바이더_가 제공하는 기능 이상으로 요구 사항이 확장될 경우 어떻게 될까요? 다음은 몇 가지 예입니다.

- Nest가 클래스의 인스턴스를 인스턴스화(또는 캐시된 인스턴스를 반환)하는 대신 커스텀 인스턴스를 생성하고 싶습니다.
- 두 번째 종속성에서 기존 클래스를 재사용하고 싶습니다.
- 테스트를 위해 클래스를 모의(mock) 버전으로 재정의하고 싶습니다.

Nest는 이러한 경우를 처리하기 위해 커스텀 프로바이더를 정의할 수 있도록 합니다. 커스텀 프로바이더를 정의하는 여러 가지 방법을 제공합니다. 하나씩 살펴보겠습니다.

> info **힌트** 의존성 해결에 문제가 있는 경우, `NEST_DEBUG` 환경 변수를 설정하면 시작 시 추가적인 의존성 해결 로그를 얻을 수 있습니다.

#### 값 프로바이더: `useValue`

`useValue` 구문은 상수 값을 주입하거나 외부 라이브러리를 Nest 컨테이너에 넣거나 실제 구현을 모의 객체로 교체하는 데 유용합니다. 예를 들어, 테스트 목적으로 Nest가 모의 `CatsService`를 사용하도록 강제하고 싶다고 가정해 보겠습니다.

```typescript
import { CatsService } from './cats.service';

const mockCatsService = {
  /* mock implementation
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
```

이 예제에서 `CatsService` 토큰은 `mockCatsService` 모의 객체로 해결됩니다. `useValue`는 값을 요구합니다. 이 경우, 대체하는 `CatsService` 클래스와 동일한 인터페이스를 가진 리터럴 객체입니다. TypeScript의 [구조적 타이핑](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) 때문에, 호환 가능한 인터페이스를 가진 모든 객체를 사용할 수 있으며, 여기에는 리터럴 객체 또는 `new`로 인스턴스화된 클래스 인스턴스가 포함됩니다.

#### 클래스 기반이 아닌 프로바이더 토큰

지금까지 프로바이더 토큰으로 클래스 이름(프로바이더 배열의 `providers` 목록에 있는 프로바이더의 `provide` 속성 값)을 사용했습니다. 이는 종속성이 클래스 이름으로 선언되어야 하는 표준 [생성자 기반 주입](https://docs.nestjs.com/providers#dependency-injection) 패턴과 일치합니다. (이 개념이 완전히 명확하지 않다면 <a href="/fundamentals/custom-providers#di-fundamentals">DI 기본 원리</a>를 다시 참조하여 토큰에 대해 다시 살펴보세요). 때로는 DI 토큰으로 문자열이나 심볼을 사용할 유연성이 필요할 수 있습니다. 예를 들면 다음과 같습니다.

```typescript
import { connection } from './connection';

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
})
export class AppModule {}
```

이 예제에서는 문자열 값 토큰(`'CONNECTION'`)을 외부 파일에서 가져온 기존 `connection` 객체와 연결하고 있습니다.

> warning **참고** 토큰 값으로 문자열을 사용하는 것 외에도 JavaScript [심볼](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) 또는 TypeScript [열거형(enums)](https://www.typescriptlang.org/docs/handbook/enums.html)도 사용할 수 있습니다.

이전에 표준 [생성자 기반 주입](https://docs.nestjs.com/providers#dependency-injection) 패턴을 사용하여 프로바이더를 주입하는 방법을 보았습니다. 이 패턴은 종속성이 클래스 이름으로 선언되어야 **합니다**. `'CONNECTION'` 커스텀 프로바이더는 문자열 값 토큰을 사용합니다. 이러한 프로바이더를 주입하는 방법을 살펴보겠습니다. 이를 위해 `@Inject()` 데코레이터를 사용합니다. 이 데코레이터는 하나의 인자(토큰)를 받습니다.

```typescript
@@filename()
@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
@@switch
@Injectable()
@Dependencies('CONNECTION')
export class CatsRepository {
  constructor(connection) {}
}
```

> info **힌트** `@Inject()` 데코레이터는 `@nestjs/common` 패키지에서 가져옵니다.

위 예제에서는 설명을 위해 `'CONNECTION'` 문자열을 직접 사용했지만, 깔끔한 코드 구성을 위해 `constants.ts`와 같은 별도의 파일에 토큰을 정의하는 것이 가장 좋습니다. 심볼이나 열거형(enums)을 별도의 파일에 정의하고 필요에 따라 가져오는 것처럼 다루세요.

#### 클래스 프로바이더: `useClass`

`useClass` 구문을 사용하면 토큰이 해결되어야 하는 클래스를 동적으로 결정할 수 있습니다. 예를 들어, 추상(또는 기본) `ConfigService` 클래스가 있다고 가정해 보겠습니다. 현재 환경에 따라 구성 서비스의 다른 구현을 제공하도록 Nest를 원합니다. 다음 코드는 이러한 전략을 구현합니다.

```typescript
const configServiceProvider = {
  provide: ConfigService,
  useClass:
    process.env.NODE_ENV === 'development'
      ? DevelopmentConfigService
      : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class AppModule {}
```

이 코드 샘플의 몇 가지 세부 사항을 살펴보겠습니다. 먼저 리터럴 객체로 `configServiceProvider`를 정의한 다음 모듈 데코레이터의 `providers` 속성으로 전달한다는 것을 알 수 있습니다. 이것은 코드 구성의 일부일 뿐, 이 장에서 지금까지 사용한 예제와 기능적으로 동일합니다.

또한 `ConfigService` 클래스 이름을 토큰으로 사용했습니다. `ConfigService`에 의존하는 모든 클래스에 대해 Nest는 제공된 클래스(`DevelopmentConfigService` 또는 `ProductionConfigService`)의 인스턴스를 주입하여 다른 곳에서 선언되었을 수 있는 기본 구현(`@Injectable()` 데코레이터로 선언된 `ConfigService` 등)을 재정의합니다.

#### 팩토리 프로바이더: `useFactory`

`useFactory` 구문을 사용하면 프로바이더를 **동적으로** 생성할 수 있습니다. 실제 프로바이더는 팩토리 함수에서 반환된 값에 의해 제공됩니다. 팩토리 함수는 필요에 따라 간단하거나 복잡할 수 있습니다. 간단한 팩토리는 다른 프로바이더에 의존하지 않을 수 있습니다. 더 복잡한 팩토리는 결과를 계산하는 데 필요한 다른 프로바이더를 자체적으로 주입할 수 있습니다. 후자의 경우 팩토리 프로바이더 구문은 관련 메커니즘 쌍을 가집니다.

1.  팩토리 함수는 (선택적) 인자를 받을 수 있습니다.
2.  (선택적) `inject` 속성은 Nest가 인스턴스화 과정에서 해결하여 팩토리 함수의 인자로 전달할 프로바이더 배열을 받습니다. 또한 이러한 프로바이더는 선택 사항으로 표시될 수 있습니다. 두 목록은 상관 관계가 있어야 합니다: Nest는 `inject` 목록의 인스턴스를 팩토리 함수에 동일한 순서로 인자로 전달합니다. 아래 예제는 이를 보여줍니다.

```typescript
@@filename()
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: MyOptionsProvider, optionalProvider?: string) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \______________/             \__________________/
  //        이 프로바이더는               이 토큰을 가진 프로바이더는
  //        필수입니다.                 `undefined`로 해결될 수 있습니다.
};

@Module({
  providers: [
    connectionProvider,
    MyOptionsProvider, // 클래스 기반 프로바이더
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
@@switch
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider, optionalProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \______________/            \__________________/
  //        이 프로바이더는              이 토큰을 가진 프로바이더는
  //        필수입니다.                `undefined`로 해결될 수 있습니다.
};

@Module({
  providers: [
    connectionProvider,
    MyOptionsProvider, // 클래스 기반 프로바이더
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
```

#### 별칭 프로바이더: `useExisting`

`useExisting` 구문은 기존 프로바이더에 대한 별칭을 생성할 수 있도록 합니다. 이를 통해 동일한 프로바이더에 두 가지 방식으로 접근할 수 있습니다. 아래 예제에서 (문자열 기반) 토큰 `'AliasedLoggerService'`는 (클래스 기반) 토큰 `LoggerService`의 별칭입니다. `'AliasedLoggerService'`에 대한 종속성과 `LoggerService`에 대한 종속성, 두 가지 다른 종속성이 있다고 가정해 보겠습니다. 두 종속성 모두 `SINGLETON` 스코프로 지정되면 동일한 인스턴스로 해결됩니다.

```typescript
@Injectable()
class LoggerService {
  /* implementation details */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

#### 서비스 기반이 아닌 프로바이더

프로바이더는 종종 서비스를 제공하지만, 그 용도에만 국한되지 않습니다. 프로바이더는 **어떤** 값이든 제공할 수 있습니다. 예를 들어, 프로바이더는 현재 환경에 따라 구성 객체 배열을 제공할 수 있습니다.

```typescript
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}
```

#### 커스텀 프로바이더 내보내기

다른 프로바이더와 마찬가지로 커스텀 프로바이더는 선언하는 모듈에 범위가 지정됩니다. 다른 모듈에서 볼 수 있도록 내보내야 합니다. 커스텀 프로바이더를 내보내려면 토큰 또는 전체 프로바이더 객체를 사용할 수 있습니다.

다음 예제는 토큰을 사용하여 내보내는 방법을 보여줍니다.

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
```

또는 전체 프로바이더 객체로 내보낼 수 있습니다.

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
```