### 버전 관리

> info **힌트** 이 장은 HTTP 기반 애플리케이션에만 해당됩니다.

버전 관리를 사용하면 동일한 애플리케이션 내에서 **서로 다른 버전**의 컨트롤러 또는 개별 라우트를 실행할 수 있습니다. 애플리케이션은 매우 자주 변경되며, 이전 버전의 애플리케이션을 계속 지원하면서 호환성을 깨는 변경(breaking changes)을 해야 하는 경우가 흔합니다.

지원되는 버전 관리 유형은 4가지입니다.

<table>
  <tr>
    <td><a href='techniques/versioning#uri-versioning-type'><code>URI 버전 관리</code></a></td>
    <td>버전이 요청 URI 내에 전달됩니다 (기본값)</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#header-versioning-type'><code>헤더 버전 관리</code></a></td>
    <td>커스텀 요청 헤더가 버전을 지정합니다</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#media-type-versioning-type'><code>미디어 타입 버전 관리</code></a></td>
    <td>요청의 <code>Accept</code> 헤더가 버전을 지정합니다</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#custom-versioning-type'><code>커스텀 버전 관리</code></a></td>
    <td>요청의 어떤 측면이든 버전을 지정하는 데 사용될 수 있습니다. 해당 버전을 추출하기 위한 커스텀 함수가 제공됩니다.</td>
  </tr>
</table>

#### URI 버전 관리 타입

URI 버전 관리는 요청 URI 내에 전달된 버전을 사용합니다. 예를 들어 `https://example.com/v1/route` 및 `https://example.com/v2/route`와 같습니다.

> warning **주의** URI 버전 관리를 사용하면 버전이 <a href="faq/global-prefix">전역 경로 접두사</a>(있는 경우) 뒤에 자동으로 URI에 추가되며, 모든 컨트롤러 또는 라우트 경로 앞에 위치합니다.

애플리케이션에 URI 버전 관리를 사용하려면 다음을 수행하십시오:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
// 또는 "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(process.env.PORT ?? 3000);
```

> warning **주의** URI의 버전은 기본적으로 자동으로 `v` 접두사가 붙지만, `prefix` 키를 원하는 접두사로 설정하거나 `false`로 설정하여 비활성화할 수 있습니다.

> info **힌트** `VersioningType` enum은 `type` 속성에 사용할 수 있으며 `@nestjs/common` 패키지에서 임포트됩니다.

#### 헤더 버전 관리 타입

헤더 버전 관리는 사용자 지정 요청 헤더를 사용하여 버전을 지정하며, 헤더의 값이 요청에 사용할 버전이 됩니다.

헤더 버전 관리를 위한 HTTP 요청 예시:

애플리케이션에 **헤더 버전 관리**를 사용하려면 다음을 수행하십시오:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(process.env.PORT ?? 3000);
```

`header` 속성은 요청의 버전을 포함할 헤더의 이름이어야 합니다.

> info **힌트** `VersioningType` enum은 `type` 속성에 사용할 수 있으며 `@nestjs/common` 패키지에서 임포트됩니다.

#### 미디어 타입 버전 관리 타입

미디어 타입 버전 관리는 요청의 `Accept` 헤더를 사용하여 버전을 지정합니다.

`Accept` 헤더 내에서 버전은 세미콜론(`;`)으로 미디어 타입과 구분됩니다. 그런 다음 요청에 사용할 버전을 나타내는 키-값 쌍을 포함해야 합니다. 예를 들어 `Accept: application/json;v=2`와 같습니다. 키는 버전을 결정할 때 접두사로 간주되며, 구성할 때 키와 구분자를 포함해야 합니다.

애플리케이션에 **미디어 타입 버전 관리**를 사용하려면 다음을 수행하십시오:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(process.env.PORT ?? 3000);
```

`key` 속성은 버전을 포함하는 키-값 쌍의 키와 구분자여야 합니다. 예를 들어 `Accept: application/json;v=2`의 경우 `key` 속성은 `v=`로 설정됩니다.

> info **힌트** `VersioningType` enum은 `type` 속성에 사용할 수 있으며 `@nestjs/common` 패키지에서 임포트됩니다.

#### 커스텀 버전 관리 타입

커스텀 버전 관리는 요청의 어떤 측면이든 버전을 지정하는 데 사용합니다. 들어오는 요청은 버전을 추출하는 `extractor` 함수를 사용하여 분석되며, 이 함수는 문자열 또는 문자열 배열을 반환합니다.

요청자가 여러 버전을 제공하는 경우, 추출 함수는 가장 높은/최신 버전부터 가장 낮은/가장 오래된 버전 순서로 정렬된 문자열 배열을 반환할 수 있습니다. 버전은 가장 높은 버전부터 가장 낮은 버전 순서로 라우트와 일치됩니다.

`extractor`에서 빈 문자열 또는 배열이 반환되면 라우트가 일치되지 않고 404가 반환됩니다.

예를 들어, 들어오는 요청이 버전 `1`, `2`, `3`을 지원한다고 지정하면 `extractor`는 **반드시** `[3, 2, 1]`을 반환해야 합니다. 이렇게 하면 가능한 가장 높은 라우트 버전이 먼저 선택됩니다.

`[3, 2, 1]` 버전이 추출되었지만 버전 `2` 및 `1`에 대해서만 라우트가 존재하는 경우, 버전 `2`와 일치하는 라우트가 선택됩니다 (버전 `3`은 자동으로 무시됩니다).

> warning **주의** `extractor`에서 반환된 배열을 기반으로 가장 높은 일치 버전을 선택하는 것은 Express 어댑터에서는 디자인 한계로 인해 **안정적으로 작동하지 않습니다**. 단일 버전(문자열 또는 1개 요소의 배열)은 Express에서 잘 작동합니다. Fastify는 가장 높은 일치 버전 선택과 단일 버전 선택 모두를 올바르게 지원합니다.

애플리케이션에 **커스텀 버전 관리**를 사용하려면 `extractor` 함수를 생성하고 다음과 같이 애플리케이션에 전달하십시오:

```typescript
@@filename(main)
// 커스텀 헤더에서 버전 목록을 추출하여 정렬된 배열로 만드는 추출 함수 예시.
// 이 예시는 Fastify를 사용하지만, Express 요청도 유사한 방식으로 처리할 수 있습니다.
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(process.env.PORT ?? 3000);
```

#### 사용법

버전 관리를 사용하면 컨트롤러, 개별 라우트에 버전을 지정할 수 있으며, 특정 리소스가 버전 관리에서 제외될 수 있는 방법도 제공합니다. 버전 관리 사용법은 애플리케이션이 어떤 버전 관리 타입을 사용하든 동일합니다.

> warning **주의** 애플리케이션에 버전 관리가 활성화되었지만 컨트롤러 또는 라우트가 버전을 지정하지 않으면 해당 컨트롤러/라우트에 대한 모든 요청은 `404` 응답 상태가 반환됩니다. 마찬가지로, 해당 컨트롤러 또는 라우트가 없는 버전이 포함된 요청이 수신되면 `404` 응답 상태가 반환됩니다.

#### 컨트롤러 버전

버전은 컨트롤러에 적용되어 컨트롤러 내의 모든 라우트에 대한 버전을 설정할 수 있습니다.

컨트롤러에 버전을 추가하려면 다음을 수행하십시오:

```typescript
@@filename(cats.controller)
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1';
  }
}
@@switch
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1';
  }
}
```

#### 라우트 버전

버전은 개별 라우트에 적용될 수 있습니다. 이 버전은 컨트롤러 버전과 같이 해당 라우트에 영향을 미치는 다른 모든 버전을 재정의합니다.

개별 라우트에 버전을 추가하려면 다음을 수행하십시오:

```typescript
@@filename(cats.controller)
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'This action returns all cats for version 2';
  }
}
@@switch
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1() {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2() {
    return 'This action returns all cats for version 2';
  }
}
```

#### 다중 버전

여러 버전이 컨트롤러 또는 라우트에 적용될 수 있습니다. 다중 버전을 사용하려면 버전을 배열로 설정해야 합니다.

다중 버전을 추가하려면 다음을 수행하십시오:

```typescript
@@filename(cats.controller)
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1 or 2';
  }
}
@@switch
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1 or 2';
  }
}
```

#### "버전 중립"

일부 컨트롤러 또는 라우트는 버전에 상관없이 동일한 기능을 가질 수 있습니다. 이를 위해 버전을 `VERSION_NEUTRAL` 심볼로 설정할 수 있습니다.

들어오는 요청은 요청에 버전이 전혀 포함되지 않은 경우뿐만 아니라 요청에 전송된 버전에 상관없이 `VERSION_NEUTRAL` 컨트롤러 또는 라우트에 매핑됩니다.

> warning **주의** URI 버전 관리의 경우 `VERSION_NEUTRAL` 리소스는 URI에 버전이 표시되지 않습니다.

버전 중립 컨트롤러 또는 라우트를 추가하려면 다음을 수행하십시오:

```typescript
@@filename(cats.controller)
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats regardless of version';
  }
}
@@switch
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats regardless of version';
  }
}
```

#### 전역 기본 버전

각 컨트롤러 또는 개별 라우트에 버전을 제공하고 싶지 않거나, 버전이 지정되지 않은 모든 컨트롤러/라우트에 대해 특정 버전을 기본 버전으로 설정하고 싶다면 다음과 같이 `defaultVersion`을 설정할 수 있습니다:

```typescript
@@filename(main)
app.enableVersioning({
  // ...
  defaultVersion: '1'
  // 또는
  defaultVersion: ['1', '2']
  // 또는
  defaultVersion: VERSION_NEUTRAL
});
```

#### 미들웨어 버전 관리

[미들웨어](https://docs.nestjs.com/middleware)도 버전 관리 메타데이터를 사용하여 특정 라우트의 버전에 대해 미들웨어를 구성할 수 있습니다. 이를 위해 `MiddlewareConsumer.forRoutes()` 메서드의 매개변수 중 하나로 버전 번호를 제공합니다:

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
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

위의 코드를 사용하면 `LoggerMiddleware`는 `/cats` 엔드포인트의 버전 '2'에만 적용됩니다.

> info **주의** 미들웨어는 이 섹션에 설명된 모든 버전 관리 타입(`URI`, `Header`, `Media Type` 또는 `Custom`)과 함께 작동합니다.
