### 미들웨어

미들웨어는 라우트 핸들러가 호출되기 **전**에 호출되는 함수입니다. 미들웨어 함수는 애플리케이션의 요청-응답 주기에서 [요청](https://expressjs.com/en/4x/api.html#req) 및 [응답](https://expressjs.com/en/4x/api.html#res) 객체와 `next()` 미들웨어 함수에 접근할 수 있습니다. **다음** 미들웨어 함수는 일반적으로 `next`라는 변수로 표시됩니다.

<figure><img class="illustrative-image" src="/assets/Middlewares_1.png" /></figure>

Nest 미들웨어는 기본적으로 [Express](https://expressjs.com/en/guide/using-middleware.html) 미들웨어와 동일합니다. 공식 Express 문서의 다음 설명은 미들웨어의 기능을 설명합니다.

<blockquote class="external">
  미들웨어 함수는 다음 작업을 수행할 수 있습니다:
  <ul>
    <li>모든 코드를 실행합니다.</li>
    <li>요청 및 응답 객체를 변경합니다.</li>
    <li>요청-응답 주기를 종료합니다.</li>
    <li>스택에 있는 다음 미들웨어 함수를 호출합니다.</li>
    <li>현재 미들웨어 함수가 요청-응답 주기를 종료하지 않는 경우, 다음 미들웨어 함수로 제어를 넘기려면 `next()`를 호출해야 합니다. 그렇지 않으면 요청이 중단된 상태로 남게 됩니다.</li>
  </ul>
</blockquote>

사용자 지정 Nest 미들웨어는 함수 또는 `@Injectable()` 데코레이터가 있는 클래스로 구현할 수 있습니다. 클래스는 `NestMiddleware` 인터페이스를 구현해야 하는 반면, 함수는 특별한 요구 사항이 없습니다. 클래스 방식을 사용하여 간단한 미들웨어 기능을 구현하는 것부터 시작하겠습니다.

> warning **경고** `Express`와 `fastify`는 미들웨어를 다르게 처리하며 다른 메서드 시그니처를 제공합니다. 자세한 내용은 [여기](/techniques/performance#middleware)에서 읽어보세요.

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...');
    next();
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

#### 의존성 주입

Nest 미들웨어는 의존성 주입을 완벽하게 지원합니다. 프로바이더 및 컨트롤러와 마찬가지로, 동일한 모듈 내에서 사용 가능한 **의존성을 주입**할 수 있습니다. 평소와 같이 이는 `constructor`를 통해 이루어집니다.

#### 미들웨어 적용

`@Module()` 데코레이터에는 미들웨어를 위한 자리가 없습니다. 대신 모듈 클래스의 `configure()` 메서드를 사용하여 설정합니다. 미들웨어를 포함하는 모듈은 `NestModule` 인터페이스를 구현해야 합니다. `AppModule` 레벨에서 `LoggerMiddleware`를 설정해 보겠습니다.

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
```

위 예제에서는 이전에 `CatsController` 내에 정의된 `/cats` 라우트 핸들러에 대해 `LoggerMiddleware`를 설정했습니다. 미들웨어 구성 시 라우트 `path`와 요청 `method`를 포함하는 객체를 `forRoutes()` 메서드에 전달하여 특정 요청 메서드로 미들웨어를 더 제한할 수도 있습니다. 아래 예제에서는 원하는 요청 메서드 유형을 참조하기 위해 `RequestMethod` enum을 가져오는 것을 주목하십시오.

```typescript
@@filename(app.module)
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
@@switch
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
```

> info **팁** `configure()` 메서드는 `async/await`를 사용하여 비동기로 만들 수 있습니다 (예: `configure()` 메서드 본문 내에서 비동기 작업 완료를 `await`할 수 있습니다).

> warning **경고** `express` 어댑터를 사용할 때 NestJS 앱은 기본적으로 패키지 `body-parser`에서 `json` 및 `urlencoded`를 등록합니다. 즉, `MiddlewareConsumer`를 통해 해당 미들웨어를 사용자 지정하려면 `NestFactory.create()`로 애플리케이션을 생성할 때 `bodyParser` 플래그를 `false`로 설정하여 전역 미들웨어를 꺼야 합니다.

#### 라우트 와일드카드

패턴 기반 라우트도 NestJS 미들웨어에서 지원됩니다. 예를 들어, 명명된 와일드카드 (`*splat`)는 라우트에서 모든 문자 조합을 일치시키는 와일드카드로 사용할 수 있습니다. 다음 예제에서 미들웨어는 `abcd/`로 시작하는 모든 라우트에 대해 실행되며, 뒤에 오는 문자 수에 관계없습니다.

```typescript
forRoutes({
  path: 'abcd/*splat',
  method: RequestMethod.ALL,
});
```

> info **팁** `splat`은 단순히 와일드카드 매개변수의 이름일 뿐이며 특별한 의미는 없습니다. 원하는 이름으로 지정할 수 있습니다 (예: `*wildcard`).

`'abcd/*'` 라우트 경로는 `abcd/1`, `abcd/123`, `abcd/abc` 등과 일치합니다. 하이픈 (`-`)과 점 (`.`)은 문자열 기반 경로에서 리터럴로 해석됩니다. 그러나 추가 문자 없이 `abcd/`는 이 라우트와 일치하지 않습니다. 이를 위해 와일드카드를 중괄호로 묶어 선택 사항으로 만들어야 합니다.

```typescript
forRoutes({
  path: 'abcd/{*splat}',
  method: RequestMethod.ALL,
});
```

#### 미들웨어 소비자

`MiddlewareConsumer`는 헬퍼 클래스입니다. 미들웨어를 관리하기 위한 여러 내장 메서드를 제공합니다. 이들 모두 [플루언트 스타일](https://en.wikipedia.org/wiki/Fluent_interface)로 간단하게 **체이닝**할 수 있습니다. `forRoutes()` 메서드는 단일 문자열, 여러 문자열, `RouteInfo` 객체, 컨트롤러 클래스 및 심지어 여러 컨트롤러 클래스를 사용할 수 있습니다. 대부분의 경우 쉼표로 구분된 **컨트롤러** 목록을 전달할 것입니다. 아래는 단일 컨트롤러의 예입니다.

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
```

> info **팁** `apply()` 메서드는 단일 미들웨어를 사용하거나 <a href="/middleware#multiple-middleware">여러 미들웨어</a>를 지정하기 위해 여러 인수를 사용할 수 있습니다.

#### 라우트 제외

때로는 특정 라우트에 미들웨어가 적용되는 것을 **제외**하고 싶을 수 있습니다. 이는 `exclude()` 메서드를 사용하여 쉽게 달성할 수 있습니다. `exclude()` 메서드는 제외할 라우트를 식별하기 위해 단일 문자열, 여러 문자열 또는 `RouteInfo` 객체를 허용합니다.

다음은 사용 방법의 예입니다.

```typescript
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },
    { path: 'cats', method: RequestMethod.POST },
    'cats/{*splat}',
  )
  .forRoutes(CatsController);
```

> info **팁** `exclude()` 메서드는 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) 패키지를 사용하여 와일드카드 매개변수를 지원합니다.

위 예제와 함께, `LoggerMiddleware`는 `exclude()` 메서드에 전달된 세 가지 라우트를 **제외하고** `CatsController` 내에 정의된 모든 라우트에 바인딩됩니다.

이 접근 방식은 특정 라우트 또는 라우트 패턴에 기반하여 미들웨어를 적용하거나 제외하는 데 유연성을 제공합니다.

#### 함수형 미들웨어

우리가 사용해 온 `LoggerMiddleware` 클래스는 매우 간단합니다. 멤버도 없고, 추가 메서드도 없으며, 의존성도 없습니다. 왜 클래스 대신 간단한 함수로 정의할 수 없을까요? 사실, 가능합니다. 이러한 유형의 미들웨어를 **함수형 미들웨어**라고 합니다. 차이점을 보여주기 위해 로거 미들웨어를 클래스 기반에서 함수형 미들웨어로 바꿔봅시다.

```typescript
@@filename(logger.middleware)
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
};
@@switch
export function logger(req, res, next) {
  console.log(`Request...`);
  next();
};
```

그리고 `AppModule` 내에서 사용합니다.

```typescript
@@filename(app.module)
consumer
  .apply(logger)
  .forRoutes(CatsController);
```

> info **팁** 미들웨어에 의존성이 필요하지 않은 경우에는 더 간단한 **함수형 미들웨어** 대안을 사용하는 것을 고려하십시오.

#### 여러 미들웨어

위에 언급된 바와 같이, 순차적으로 실행되는 여러 미들웨어를 바인딩하려면 `apply()` 메서드 내에 쉼표로 구분된 목록을 제공하면 됩니다.

```typescript
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

#### 전역 미들웨어

모든 등록된 라우트에 미들웨어를 한 번에 바인딩하려면 `INestApplication` 인스턴스가 제공하는 `use()` 메서드를 사용할 수 있습니다.

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(process.env.PORT ?? 3000);
```

> info **팁** 전역 미들웨어에서는 DI 컨테이너에 접근할 수 없습니다. `app.use()`를 사용할 때는 대신 [함수형 미들웨어](middleware#functional-middleware)를 사용할 수 있습니다. 또는 클래스 미들웨어를 사용하고 `AppModule`(또는 다른 모듈) 내에서 `.forRoutes('*')`로 사용할 수 있습니다.
