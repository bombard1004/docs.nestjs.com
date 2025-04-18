### 서버리스

서버리스 컴퓨팅은 클라우드 공급자가 고객을 대신하여 서버를 관리하며 온디맨드로 머신 리소스를 할당하는 클라우드 컴퓨팅 실행 모델입니다. 앱이 사용되지 않을 때는 앱에 할당된 컴퓨팅 리소스가 없습니다. 가격은 애플리케이션에서 소비하는 실제 리소스 양을 기반으로 합니다 ([출처](https://en.wikipedia.org/wiki/Serverless_computing)).

**서버리스 아키텍처**를 사용하면 애플리케이션 코드의 개별 함수에만 집중할 수 있습니다. AWS Lambda, Google Cloud Functions, Microsoft Azure Functions와 같은 서비스가 모든 물리적 하드웨어, 가상 머신 운영 체제 및 웹 서버 소프트웨어 관리를 담당합니다.

> info **힌트** 이 챕터에서는 서버리스 함수의 장단점을 다루지 않으며 특정 클라우드 공급자의 세부 사항에 대해 자세히 설명하지 않습니다.

#### 콜드 스타트

콜드 스타트란 코드가 한동안 실행되지 않다가 처음으로 실행될 때를 의미합니다. 사용하는 클라우드 공급자에 따라 코드를 다운로드하고 런타임을 부트스트랩하는 것부터 실제로 코드를 실행하는 것까지 여러 작업에 걸쳐 발생할 수 있습니다.
이 과정은 애플리케이션이 요구하는 언어, 패키지 수 등 여러 요인에 따라 **상당한 지연 시간**을 추가합니다.

콜드 스타트는 중요하며, 우리가 통제할 수 없는 부분도 있지만, 최대한 짧게 만들기 위해 우리 쪽에서 할 수 있는 일도 많습니다.

Nest는 복잡한 엔터프라이즈 애플리케이션에 사용되도록 설계된 완전한 프레임워크로 생각할 수 있지만,
또한 **훨씬 "단순한" 애플리케이션(또는 스크립트)에도 적합**합니다. 예를 들어, [독립 실행형 애플리케이션](/standalone-applications) 기능을 사용하여 간단한 워커, CRON 작업, CLI 또는 서버리스 함수에서 Nest의 DI 시스템을 활용할 수 있습니다.

#### 벤치마크

서버리스 함수의 컨텍스트에서 Nest 또는 다른 잘 알려진 라이브러리(예: `express`)를 사용하는 데 드는 비용을 더 잘 이해하기 위해 Node 런타임이 다음 스크립트를 실행하는 데 걸리는 시간을 비교해 보겠습니다.

```typescript
// #1 Express
import * as express from 'express';

async function bootstrap() {
  const app = express();
  app.get('/', (req, res) => res.send('Hello world!'));
  await new Promise<void>((resolve) => app.listen(3000, resolve));
}
bootstrap();

// #2 Nest (with @nestjs/platform-express)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

// #3 Nest as a Standalone application (no HTTP server)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  console.log(app.get(AppService).getHello());
}
bootstrap();

// #4 Raw Node.js script
async function bootstrap() {
  console.log('Hello world!');
}
bootstrap();
```

이 모든 스크립트에서 `tsc` (TypeScript) 컴파일러를 사용했기 때문에 코드는 번들링되지 않았습니다(`webpack`은 사용되지 않음).

|                                      |                   |
| ------------------------------------ | ----------------- |
| Express                              | 0.0079s (7.9ms)   |
| Nest with `@nestjs/platform-express` | 0.1974s (197.4ms) |
| Nest (standalone application)        | 0.1117s (111.7ms) |
| Raw Node.js script                   | 0.0071s (7.1ms)   |

> info **참고** 머신: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

이제 모든 벤치마크를 반복하되, 이번에는 `webpack`을 사용하여 애플리케이션을 단일 실행 가능한 JavaScript 파일로 번들링하겠습니다 (Nest CLI가 설치되어 있다면 `nest build --webpack`을 실행할 수 있습니다).
하지만 Nest CLI와 함께 제공되는 기본 `webpack` 구성 대신 모든 의존성(`node_modules`)을 다음과 같이 함께 번들링하도록 하겠습니다.

```javascript
module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
```

> info **힌트** Nest CLI가 이 구성을 사용하도록 지시하려면 프로젝트 루트 디렉토리에 새로운 `webpack.config.js` 파일을 생성하세요.

이 구성으로 다음과 같은 결과를 얻었습니다.

|                                      |                  |
| ------------------------------------ | ---------------- |
| Express                              | 0.0068s (6.8ms)  |
| Nest with `@nestjs/platform-express` | 0.0815s (81.5ms) |
| Nest (standalone application)        | 0.0319s (31.9ms) |
| Raw Node.js script                   | 0.0066s (6.6ms)  |

> info **참고** 머신: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

> info **힌트** 추가적인 코드 최소화 및 최적화 기법(webpack 플러그인 사용 등)을 적용하여 더욱 최적화할 수 있습니다.

보시다시피, 코드를 컴파일하는 방식(및 번들링 여부)은 중요하며 전체 시작 시간에 상당한 영향을 미칩니다. `webpack`을 사용하면 독립 실행형 Nest 애플리케이션(하나의 모듈, 컨트롤러, 서비스가 있는 스타터 프로젝트)의 부트스트랩 시간을 평균 약 32ms까지, 일반 HTTP, express 기반 NestJS 앱의 경우 약 81.5ms까지 단축할 수 있습니다.

더 복잡한 Nest 애플리케이션의 경우, 예를 들어 10개의 리소스(`$ nest g resource` 스키마틱으로 생성 = 10개의 모듈, 10개의 컨트롤러, 10개의 서비스, 20개의 DTO 클래스, 50개의 HTTP 엔드포인트 + `AppModule`)를 가진 애플리케이션의 경우, MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD에서 전체 시작 시간은 약 0.1298초(129.8ms)입니다. 모놀리식 애플리케이션을 서버리스 함수로 실행하는 것은 어쨌든 그다지 의미가 없으므로, 이 벤치마크는 애플리케이션이 커짐에 따라 부트스트랩 시간이 잠재적으로 어떻게 증가할 수 있는지에 대한 예시로 생각하세요.

#### 런타임 최적화

지금까지 컴파일 타임 최적화에 대해 다뤘습니다. 이는 애플리케이션에서 프로바이더를 정의하고 Nest 모듈을 로드하는 방식과는 관련이 없으며, 이는 애플리케이션이 커짐에 따라 필수적인 역할을 합니다.

예를 들어, 데이터베이스 연결을 [비동기 프로바이더](/fundamentals/async-providers)로 정의했다고 상상해 보세요. 비동기 프로바이더는 하나 이상의 비동기 작업이 완료될 때까지 애플리케이션 시작을 지연시키도록 설계되었습니다.
이는 서버리스 함수가 데이터베이스에 연결하는 데 평균적으로 2초(부트스트랩 시)가 걸린다면, 엔드포인트는 응답을 보내는 데 최소 2초의 추가 시간이 필요하다는 의미입니다(콜드 스타트이고 애플리케이션이 이미 실행 중이 아니었던 경우).

보시다시피, 부트스트랩 시간이 중요한 **서버리스 환경**에서는 프로바이더를 구성하는 방식이 다소 다릅니다.
또 다른 좋은 예는 캐싱을 위해 Redis를 사용하지만 특정 시나리오에서만 사용하는 경우입니다. 아마도 이 경우에는 Redis 연결을 비동기 프로바이더로 정의해서는 안 될 것입니다. 이렇게 하면 이 특정 함수 호출에 필요하지 않더라도 부트스트랩 시간이 느려지기 때문입니다.

또한, 때로는 `LazyModuleLoader` 클래스를 사용하여 전체 모듈을 지연 로딩할 수 있습니다. [이 챕터](/fundamentals/lazy-loading-modules)에 설명된 대로입니다. 캐싱 또한 여기서 좋은 예입니다.
애플리케이션에 `CacheModule`이 있다고 상상해 보세요. 이 모듈은 내부적으로 Redis에 연결하고 Redis 스토리지와 상호 작용하기 위한 `CacheService`를 내보냅니다. 모든 잠재적인 함수 호출에 필요하지 않다면,
요청 시에만 지연하여 로드할 수 있습니다. 이렇게 하면 캐싱이 필요하지 않은 모든 호출에 대해 더 빠른 시작 시간(콜드 스타트 발생 시)을 얻을 수 있습니다.

```typescript
if (request.method === RequestMethod[RequestMethod.GET]) {
  const { CacheModule } = await import('./cache.module');
  const moduleRef = await this.lazyModuleLoader.load(() => CacheModule);

  const { CacheService } = await import('./cache.service');
  const cacheService = moduleRef.get(CacheService);

  return cacheService.get(ENDPOINT_KEY);
}
```

또 다른 좋은 예는 웹훅 또는 워커입니다. 특정 조건(예: 입력 인자)에 따라 다른 작업을 수행할 수 있습니다.
이러한 경우, 라우트 핸들러 내부에 특정 함수 호출에 적합한 모듈을 지연 로드하는 조건을 지정하고 다른 모든 모듈은 지연 로드할 수 있습니다.

```typescript
if (workerType === WorkerType.A) {
  const { WorkerAModule } = await import('./worker-a.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerAModule);
  // ...
} else if (workerType === WorkerType.B) {
  const { WorkerBModule } = await import('./worker-b.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerBModule);
  // ...
}
```

#### 예제 통합

애플리케이션의 진입 파일(일반적으로 `main.ts` 파일)이 어떻게 보여야 하는지는 **여러 요인에 따라 달라지므로** 모든 시나리오에 맞는 **단일 템플릿은 없습니다**.
예를 들어, 서버리스 함수를 실행하는 데 필요한 초기화 파일은 클라우드 공급자(AWS, Azure, GCP 등)에 따라 다릅니다.
또한 여러 라우트/엔드포인트를 가진 일반적인 HTTP 애플리케이션을 실행할 것인지, 아니면 단일 라우트만 제공할 것인지(또는 특정 코드 부분만 실행할 것인지)에 따라
애플리케이션 코드는 다르게 보일 것입니다(예: 엔드포인트별 함수 접근 방식을 위해서는 HTTP 서버를 부팅하고 미들웨어를 설정하는 대신 `NestFactory.createApplicationContext`를 사용할 수 있습니다).

단지 예시 목적으로, Nest(`@nestjs/platform-express` 사용 및 전체 기능의 HTTP 라우터 실행)를 [Serverless](https://www.serverless.com/) 프레임워크(이 경우 AWS Lambda 대상)와 통합하겠습니다. 앞에서 언급했듯이, 선택하는 클라우드 공급자 및 기타 여러 요인에 따라 코드는 달라질 것입니다.

먼저 필요한 패키지를 설치해 보겠습니다.

```bash
$ npm i @codegenie/serverless-express aws-lambda
$ npm i -D @types/aws-lambda serverless-offline
```

> info **힌트** 개발 주기를 가속화하기 위해 AWS λ 및 API Gateway를 에뮬레이트하는 `serverless-offline` 플러그인을 설치합니다.

설치 프로세스가 완료되면 `serverless.yml` 파일을 생성하여 Serverless 프레임워크를 구성해 보겠습니다.

```yaml
service: serverless-example

plugins:
  - serverless-offline

provider:
  name: aws
  runtime: nodejs14.x

functions:
  main:
    handler: dist/main.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
```

> info **힌트** Serverless 프레임워크에 대해 더 자세히 알아보려면 [공식 문서](https://www.serverless.com/framework/docs/)를 방문하세요.

이것이 준비되면 이제 `main.ts` 파일로 이동하여 필요한 보일러플레이트로 부트스트랩 코드를 업데이트할 수 있습니다.

```typescript
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

> info **힌트** 여러 서버리스 함수를 생성하고 공통 모듈을 공유하기 위해서는 [CLI 모노레포 모드](/cli/monorepo#monorepo-mode)를 사용하는 것을 권장합니다.

> warning **경고** `@nestjs/swagger` 패키지를 사용하는 경우, 서버리스 함수의 컨텍스트에서 제대로 작동시키기 위해 몇 가지 추가 단계가 필요합니다. 자세한 내용은 [이 스레드](https://github.com/nestjs/swagger/issues/199)를 확인하세요.

다음으로 `tsconfig.json` 파일을 열고 `@codegenie/serverless-express` 패키지가 제대로 로드되도록 `esModuleInterop` 옵션을 활성화하세요.

```json
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  }
}
```

이제 애플리케이션을 빌드(`nest build` 또는 `tsc` 사용)하고 `serverless` CLI를 사용하여 로컬에서 람다 함수를 시작할 수 있습니다.

```bash
$ npm run build
$ npx serverless offline
```

애플리케이션이 실행되면 브라우저를 열고 `http://localhost:3000/dev/[ANY_ROUTE]`로 이동하세요(`[ANY_ROUTE]`는 애플리케이션에 등록된 모든 엔드포인트입니다).

위 섹션에서 `webpack`을 사용하고 앱을 번들링하면 전체 부트스트랩 시간에 상당한 영향을 미칠 수 있음을 보여드렸습니다.
그러나 예제에서 작동시키려면 `webpack.config.js` 파일에 몇 가지 추가 구성을 추가해야 합니다. 일반적으로,
핸들러 함수가 선택되도록 하려면 `output.libraryTarget` 속성을 `commonjs2`로 변경해야 합니다.

```javascript
return {
  ...options,
  externals: [],
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
```

이렇게 설정하면 이제 `$ nest build --webpack`을 사용하여 함수의 코드를 컴파일할 수 있습니다(그리고 `$ npx serverless offline`으로 테스트).

또한 `terser-webpack-plugin` 패키지를 설치하고 프로덕션 빌드를 최소화할 때 클래스 이름을 유지하도록 구성을 재정의하는 것이 권장됩니다(**필수는 아니며** 빌드 프로세스를 느리게 만듭니다). 이렇게 하지 않으면 애플리케이션 내에서 `class-validator`를 사용할 때 잘못된 동작이 발생할 수 있습니다.

```javascript
const TerserPlugin = require('terser-webpack-plugin');

return {
  ...options,
  externals: [],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
```

#### 독립 실행형 애플리케이션 기능 사용

또는 함수를 매우 경량으로 유지하고 HTTP 관련 기능(라우팅뿐만 아니라 가드, 인터셉터, 파이프 등)이 필요하지 않은 경우,
전체 HTTP 서버(`express` 포함)를 실행하는 대신 (앞에서 언급한 대로) `NestFactory.createApplicationContext`만 사용할 수 있습니다. 방법은 다음과 같습니다.

```typescript
@@filename(main)
import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);

  return {
    body: appService.getHello(),
    statusCode: HttpStatus.OK,
  };
};
```

> info **힌트** `NestFactory.createApplicationContext`는 컨트롤러 메서드를 인핸서(가드, 인터셉터 등)로 감싸지 않는다는 점에 유의하세요. 이를 위해서는 `NestFactory.create` 메서드를 사용해야 합니다.

또한 `event` 객체를 `EventsService`와 같은 프로바이더에게 전달하여 이를 처리하고 해당하는 값을 반환하도록 할 수도 있습니다 (입력 값 및 비즈니스 로직에 따라 다름).

```typescript
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const eventsService = appContext.get(EventsService);
  return eventsService.process(event);
};
```