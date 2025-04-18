### 원시 본문

원시 요청 본문에 접근하는 가장 일반적인 사용 사례 중 하나는 웹훅 서명 검증을 수행하는 것입니다. 일반적으로 웹훅 서명 유효성 검사를 수행하려면 HMAC 해시를 계산하기 위해 직렬화되지 않은 요청 본문이 필요합니다.

> warning **경고** 이 기능은 내장된 전역 본문 파서 미들웨어가 활성화된 경우에만 사용할 수 있습니다. 즉, 애플리케이션을 생성할 때 `bodyParser: false`를 전달해서는 안 됩니다.

#### Express와 함께 사용하기

먼저 Nest Express 애플리케이션을 생성할 때 옵션을 활성화합니다.

```typescript
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

// in the "bootstrap" function
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  rawBody: true,
});
await app.listen(process.env.PORT ?? 3000);
```

컨트롤러에서 원시 요청 본문에 접근하기 위해, 요청에 `rawBody` 필드를 노출하는 편의 인터페이스 `RawBodyRequest`가 제공됩니다: `RawBodyRequest` 타입 인터페이스를 사용합니다.

```typescript
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody; // returns a `Buffer`.
  }
}
```

#### 다른 파서 등록하기

기본적으로 `json` 및 `urlencoded` 파서만 등록됩니다. 즉시 다른 파서를 등록하려면 명시적으로 등록해야 합니다.

예를 들어, `text` 파서를 등록하려면 다음 코드를 사용할 수 있습니다.

```typescript
app.useBodyParser('text');
```

> warning **경고** `NestFactory.create` 호출에 올바른 애플리케이션 타입을 제공했는지 확인하십시오. Express 애플리케이션의 경우 올바른 타입은 `NestExpressApplication`입니다. 그렇지 않으면 `.useBodyParser` 메서드를 찾을 수 없습니다.

#### 본문 파서 크기 제한

애플리케이션이 Express의 기본 `100kb`보다 큰 본문을 구문 분석해야 하는 경우 다음을 사용하십시오.

```typescript
app.useBodyParser('json', { limit: '10mb' });
```

`.useBodyParser` 메서드는 애플리케이션 옵션으로 전달된 `rawBody` 옵션을 따릅니다.

#### Fastify와 함께 사용하기

먼저 Nest Fastify 애플리케이션을 생성할 때 옵션을 활성화합니다.

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

// in the "bootstrap" function
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  {
    rawBody: true,
  },
);
await app.listen(process.env.PORT ?? 3000);
```

컨트롤러에서 원시 요청 본문에 접근하기 위해, 요청에 `rawBody` 필드를 노출하는 편의 인터페이스 `RawBodyRequest`가 제공됩니다: `RawBodyRequest` 타입 인터페이스를 사용합니다.

```typescript
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<FastifyRequest>) {
    const raw = req.rawBody; // returns a `Buffer`.
  }
}
```

#### 다른 파서 등록하기

기본적으로 `application/json` 및 `application/x-www-form-urlencoded` 파서만 등록됩니다. 즉시 다른 파서를 등록하려면 명시적으로 등록해야 합니다.

예를 들어, `text/plain` 파서를 등록하려면 다음 코드를 사용할 수 있습니다.

```typescript
app.useBodyParser('text/plain');
```

> warning **경고** `NestFactory.create` 호출에 올바른 애플리케이션 타입을 제공했는지 확인하십시오. Fastify 애플리케이션의 경우 올바른 타입은 `NestFastifyApplication`입니다. 그렇지 않으면 `.useBodyParser` 메서드를 찾을 수 없습니다.

#### 본문 파서 크기 제한

애플리케이션이 Fastify의 기본 1MiB보다 큰 본문을 구문 분석해야 하는 경우 다음을 사용하십시오.

```typescript
const bodyLimit = 10_485_760; // 10MiB
app.useBodyParser('application/json', { bodyLimit });
```

`.useBodyParser` 메서드는 애플리케이션 옵션으로 전달된 `rawBody` 옵션을 따릅니다.