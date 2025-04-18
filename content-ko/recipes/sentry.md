### Sentry

[Sentry](https://sentry.io)는 개발자가 실시간으로 문제를 식별하고 해결하도록 돕는 오류 추적 및 성능 모니터링 플랫폼입니다. 이 레시피는 Sentry의 [NestJS SDK](https://docs.sentry.io/platforms/javascript/guides/nestjs/)를 NestJS 애플리케이션과 통합하는 방법을 보여줍니다.

#### 설치

먼저 필요한 의존성을 설치합니다:

```bash
$ npm install --save @sentry/nestjs @sentry/profiling-node
```

> info **팁** `@sentry/profiling-node`는 선택 사항이지만, 성능 프로파일링에 권장됩니다.

#### 기본 설정

Sentry를 시작하려면 애플리케이션의 다른 모듈보다 먼저 임포트해야 하는 `instrument.ts`라는 파일을 생성해야 합니다:

```typescript
@@filename(instrument)
const Sentry = require("@sentry/nestjs");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
```

다른 임포트보다 먼저 `instrument.ts`를 임포트하도록 `main.ts` 파일을 업데이트합니다:

```typescript
@@filename(main)
// Import this first!
import "./instrument";

// Now import other modules
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

그 후, 메인 모듈에 `SentryModule`을 루트 모듈로 추가합니다:

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SentryModule.forRoot(),
    // ...other modules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### 예외 처리

전역 catch-all 예외 필터(`app.useGlobalFilters()`로 등록된 필터이거나, 인자 없이 `@Catch()` 데코레이터로 어노테이션된 앱 모듈 프로바이더에 등록된 필터)를 사용하고 있다면, 해당 필터의 `catch()` 메서드에 `@SentryExceptionCaptured()` 데코레이터를 추가하세요. 이 데코레이터는 전역 오류 필터가 받는 예상치 못한 모든 오류를 Sentry에 보고합니다:

```typescript
import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception, host): void {
    // your implementation here
  }
}
```

기본적으로 오류 필터에 의해 잡히지 않은 처리되지 않은 예외만 Sentry에 보고됩니다. `HttpExceptions`([파생](https://nestjs.dokidocs.dev/exception-filters#built-in-http-exceptions) 예외 포함)도 대부분 제어 흐름 수단으로 작용하기 때문에 기본적으로 캡처되지 않습니다.

전역 catch-all 예외 필터가 없다면, 메인 모듈의 프로바이더에 `SentryGlobalFilter`를 추가하세요. 이 필터는 다른 오류 필터에 의해 잡히지 않은 모든 처리되지 않은 오류를 Sentry에 보고합니다.

> warning **경고** `SentryGlobalFilter`는 다른 어떤 예외 필터보다 먼저 등록되어야 합니다.

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // ..other providers
  ],
})
export class AppModule {}
```

#### 가독성 있는 스택 트레이스

프로젝트 설정 방식에 따라 Sentry 오류의 스택 트레이스가 실제 코드와 다르게 보일 수 있습니다.

이 문제를 해결하려면 소스 맵을 Sentry에 업로드하세요. 가장 쉬운 방법은 Sentry Wizard를 사용하는 것입니다:

```bash
npx @sentry/wizard@latest -i sourcemaps
```

#### 통합 테스트

Sentry 통합이 제대로 작동하는지 확인하려면 오류를 발생시키는 테스트 엔드포인트를 추가할 수 있습니다:

```typescript
@Get("debug-sentry")
getError() {
  throw new Error("My first Sentry error!");
}
```

애플리케이션에서 `/debug-sentry`를 방문하면 Sentry 대시보드에 오류가 나타나는 것을 확인할 수 있습니다.

### 요약

Sentry NestJS SDK에 대한 고급 구성 옵션 및 기능을 포함한 전체 문서는 [공식 Sentry 문서](https://docs.sentry.io/platforms/javascript/guides/nestjs/)를 참조하세요.

소프트웨어 버그는 Sentry의 전문 분야이지만, 여전히 버그는 발생합니다. 저희 SDK 설치 중에 문제가 발생하면 [GitHub 이슈](https://github.com/getsentry/sentry-javascript/issues)를 열거나 [Discord](https://discord.com/invite/sentry)로 연락 주시기 바랍니다.