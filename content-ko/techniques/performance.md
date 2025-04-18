### 성능 (Fastify)

기본적으로 Nest는 [Express](https://expressjs.com/) 프레임워크를 사용합니다. 앞서 언급했듯이 Nest는 예를 들어 [Fastify](https://github.com/fastify/fastify)와 같은 다른 라이브러리와의 호환성도 제공합니다. Nest는 프레임워크 어댑터를 구현하여 이러한 프레임워크 독립성을 달성하며, 이 어댑터의 주요 기능은 미들웨어와 핸들러를 해당 라이브러리별 구현으로 프록시하는 것입니다.

> info **힌트** 프레임워크 어댑터가 구현되려면 대상 라이브러리가 Express에서 볼 수 있는 것과 유사한 요청/응답 파이프라인 처리를 제공해야 합니다.

[Fastify](https://github.com/fastify/fastify)는 Nest를 위한 훌륭한 대체 프레임워크를 제공하는데, 그 이유는 Express와 유사한 방식으로 설계 문제를 해결하기 때문입니다. 하지만 Fastify는 Express보다 훨씬 **빠르며**, 거의 두 배 더 나은 벤치마크 결과를 달성합니다. Nest가 Express를 기본 HTTP 프로바이더로 사용하는 이유는 무엇일까요? 그 이유는 Express가 널리 사용되고 잘 알려져 있으며, Nest 사용자들이 별도의 작업 없이 바로 사용할 수 있는 엄청난 수의 호환 미들웨어가 있기 때문입니다.

하지만 Nest는 프레임워크 독립성을 제공하므로 프레임워크 간에 쉽게 마이그레이션할 수 있습니다. 매우 빠른 성능을 중요하게 생각한다면 Fastify가 더 나은 선택일 수 있습니다. Fastify를 사용하려면 이 장에서 보여주는 것처럼 내장된 `FastifyAdapter`를 선택하기만 하면 됩니다.

#### 설치

먼저 필요한 패키지를 설치해야 합니다.

```bash
$ npm i --save @nestjs/platform-fastify
```

#### 어댑터

Fastify 플랫폼이 설치되면 `FastifyAdapter`를 사용할 수 있습니다.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

기본적으로 Fastify는 `localhost 127.0.0.1` 인터페이스에서만 수신합니다 ([더 읽어보기](https://www.fastify.io/docs/latest/Guides/Getting-Started/#your-first-server)). 다른 호스트에서의 연결을 허용하려면 `listen()` 호출에 `'0.0.0.0'`을 지정해야 합니다.

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
```

#### 플랫폼별 패키지

`FastifyAdapter`를 사용할 때 Nest는 Fastify를 **HTTP 프로바이더**로 사용한다는 점을 염두에 두세요. 이는 Express에 의존하는 각 레시피가 더 이상 작동하지 않을 수 있음을 의미합니다. 대신 Fastify와 동등한 패키지를 사용해야 합니다.

#### 리다이렉트 응답

Fastify는 Express와 약간 다르게 리다이렉트 응답을 처리합니다. Fastify를 사용하여 올바르게 리다이렉트하려면 다음과 같이 상태 코드와 URL을 모두 반환합니다.

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

#### Fastify 옵션

`FastifyAdapter` 생성자를 통해 Fastify 생성자에 옵션을 전달할 수 있습니다. 예를 들어:

```typescript
new FastifyAdapter({ logger: true });
```

#### 미들웨어

미들웨어 함수는 Fastify의 래퍼 대신 원시 `req` 및 `res` 객체를 검색합니다. 이것이 `middie` 패키지(내부적으로 사용됨)와 `fastify`가 작동하는 방식입니다 - 자세한 내용은 이 [페이지](https://www.fastify.io/docs/latest/Reference/Middleware/)를 확인하세요.

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
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

#### 라우트 구성 (Route Config)

`@RouteConfig()` 데코레이터를 사용하여 Fastify의 [라우트 구성](https://fastify.dev/docs/latest/Reference/Routes/#config) 기능을 사용할 수 있습니다.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

#### 라우트 제약 조건 (Route Constraints)

v10.3.0부터 `@nestjs/platform-fastify`는 `@RouteConstraints` 데코레이터를 사용하여 Fastify의 [라우트 제약 조건](https://fastify.dev/docs/latest/Reference/Routes/#constraints) 기능을 지원합니다.

```typescript
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
```

> info **힌트** `@RouteConfig()` 및 `@RouteConstraints`는 `@nestjs/platform-fastify`에서 가져옵니다.

#### 예제

작동 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/10-fastify)에서 확인할 수 있습니다.