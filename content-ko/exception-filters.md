### 예외 필터 (Exception filters)

Nest는 애플리케이션 전체의 처리되지 않은 모든 예외를 담당하는 내장된 **예외 계층(exceptions layer)**을 제공합니다. 애플리케이션 코드가 예외를 처리하지 않으면 이 계층에서 예외를 포착하여 자동으로 적절하고 사용자 친화적인 응답을 보냅니다.

<figure>
  <img class="illustrative-image" src="/assets/Filter_1.png" />
</figure>

기본적으로 이 동작은 `HttpException` 타입(및 그 하위 클래스)의 예외를 처리하는 내장된 **전역 예외 필터(global exception filter)**에 의해 수행됩니다. 예외가 **인식되지 않으면** (`HttpException` 또는 `HttpException`을 상속하는 클래스가 아닌 경우), 내장된 예외 필터는 다음과 같은 기본 JSON 응답을 생성합니다.

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

> info **힌트** 전역 예외 필터는 `http-errors` 라이브러리를 부분적으로 지원합니다. 기본적으로 `statusCode` 및 `message` 속성을 포함하는 모든 발생된 예외는 적절히 채워져 응답으로 다시 전송됩니다 (인식되지 않은 예외에 대한 기본 `InternalServerErrorException` 대신).

#### 표준 예외 발생시키기

Nest는 `@nestjs/common` 패키지에서 노출되는 내장된 `HttpException` 클래스를 제공합니다. 일반적인 HTTP REST/GraphQL API 기반 애플리케이션의 경우, 특정 오류 조건이 발생했을 때 표준 HTTP 응답 객체를 보내는 것이 가장 좋습니다.

예를 들어, `CatsController`에는 `findAll()` 메소드(`GET` 경로 핸들러)가 있습니다. 이 경로 핸들러가 어떤 이유로 예외를 발생시킨다고 가정해 봅시다. 이를 시연하기 위해 다음과 같이 하드 코딩합니다.

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

> info **힌트** 여기서 `HttpStatus`를 사용했습니다. 이것은 `@nestjs/common` 패키지에서 임포트되는 헬퍼 열거형입니다.

클라이언트가 이 엔드포인트를 호출하면 응답은 다음과 같습니다.

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

`HttpException` 생성자는 응답을 결정하는 두 개의 필수 인수를 받습니다.

- `response` 인수는 JSON 응답 본문을 정의합니다. 아래 설명과 같이 `string` 또는 `object`일 수 있습니다.
- `status` 인수는 [HTTP 상태 코드](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)를 정의합니다.

기본적으로 JSON 응답 본문은 두 개의 속성을 포함합니다.

- `statusCode`: `status` 인수에 제공된 HTTP 상태 코드로 기본 설정됩니다.
- `message`: `status`에 기반한 HTTP 오류에 대한 간단한 설명입니다.

JSON 응답 본문의 메시지 부분만 오버라이드하려면 `response` 인수에 문자열을 제공하십시오. JSON 응답 본문 전체를 오버라이드하려면 `response` 인수에 객체를 전달하십시오. Nest는 객체를 직렬화하여 JSON 응답 본문으로 반환합니다.

두 번째 생성자 인수 - `status` -는 유효한 HTTP 상태 코드여야 합니다. 가장 좋은 방법은 `@nestjs/common`에서 임포트된 `HttpStatus` 열거형을 사용하는 것입니다.

**세 번째** 선택적 생성자 인수 - `options` -는 오류 [cause](https://nodejs.org/en/blog/release/v16.9.0/#error-cause)를 제공하는 데 사용할 수 있습니다. 이 `cause` 객체는 응답 객체로 직렬화되지 않지만, 로깅 목적으로 유용하며 `HttpException`이 발생하게 된 내부 오류에 대한 가치 있는 정보를 제공합니다.

다음은 응답 본문 전체를 오버라이드하고 오류 cause를 제공하는 예입니다.

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  try {
    await this.service.findAll()
  } catch (error) {
    throw new HttpException({
      status: HttpStatus.FORBIDDEN,
      error: 'This is a custom message',
    }, HttpStatus.FORBIDDEN, {
      cause: error
    });
  }
}
```

위의 코드를 사용하면 응답은 다음과 같이 보입니다.

```json
{
  "status": 403,
  "error": "This is a custom message"
}
```

#### 예외 로깅 (Exceptions logging)

기본적으로 예외 필터는 `HttpException`(및 이를 상속하는 모든 예외)과 같은 내장 예외를 로깅하지 않습니다. 이러한 예외가 발생하면 정상적인 애플리케이션 흐름의 일부로 취급되므로 콘솔에 나타나지 않습니다. `WsException` 및 `RpcException`과 같은 다른 내장 예외에도 동일한 동작이 적용됩니다.

이러한 예외는 모두 `@nestjs/common` 패키지에서 내보내지는 기본 `IntrinsicException` 클래스를 상속합니다. 이 클래스는 정상적인 애플리케이션 작동의 일부인 예외와 그렇지 않은 예외를 구분하는 데 도움이 됩니다.

이러한 예외를 로깅하려면 사용자 지정 예외 필터를 생성할 수 있습니다. 다음 섹션에서 이 방법을 설명합니다.

#### 사용자 지정 예외 (Custom exceptions)

대부분의 경우 사용자 지정 예외를 작성할 필요가 없으며 다음 섹션에서 설명하는 내장 Nest HTTP 예외를 사용할 수 있습니다. 사용자 지정 예외를 생성해야 하는 경우, 사용자 지정 예외가 기본 `HttpException` 클래스를 상속하는 자신만의 **예외 계층**을 생성하는 것이 좋습니다. 이 접근 방식을 사용하면 Nest가 예외를 인식하고 오류 응답을 자동으로 처리합니다. 다음은 사용자 지정 예외를 구현하는 방법입니다.

```typescript
@@filename(forbidden.exception)
export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}
```

`ForbiddenException`은 기본 `HttpException`을 확장하므로 내장 예외 핸들러와 원활하게 작동하며, 따라서 `findAll()` 메소드 내에서 사용할 수 있습니다.

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  throw new ForbiddenException();
}
```

#### 내장 HTTP 예외 (Built-in HTTP exceptions)

Nest는 기본 `HttpException`을 상속하는 일련의 표준 예외를 제공합니다. 이들은 `@nestjs/common` 패키지에서 노출되며, 가장 일반적인 많은 HTTP 예외를 나타냅니다.

- `BadRequestException`
- `UnauthorizedException`
- `NotFoundException`
- `ForbiddenException`
- `NotAcceptableException`
- `RequestTimeoutException`
- `ConflictException`
- `GoneException`
- `HttpVersionNotSupportedException`
- `PayloadTooLargeException`
- `UnsupportedMediaTypeException`
- `UnprocessableEntityException`
- `InternalServerErrorException`
- `NotImplementedException`
- `ImATeapotException`
- `MethodNotAllowedException`
- `BadGatewayException`
- `ServiceUnavailableException`
- `GatewayTimeoutException`
- `PreconditionFailedException`

모든 내장 예외는 `options` 매개변수를 사용하여 오류 `cause`와 오류 설명 모두를 제공할 수 있습니다.

```typescript
throw new BadRequestException('Something bad happened', {
  cause: new Error(),
  description: 'Some error description',
});
```

위의 코드를 사용하면 응답은 다음과 같이 보입니다.

```json
{
  "message": "Something bad happened",
  "error": "Some error description",
  "statusCode": 400
}
```

#### 예외 필터 (Exception filters)

기본(내장) 예외 필터는 많은 경우를 자동으로 처리할 수 있지만, 예외 계층에 대해 **완전한 제어**를 원할 수 있습니다. 예를 들어, 로깅을 추가하거나 일부 동적 요소에 기반하여 다른 JSON 스키마를 사용하고 싶을 수 있습니다. **예외 필터**는 바로 이 목적을 위해 설계되었습니다. 이를 통해 정확한 제어 흐름과 클라이언트로 다시 보내지는 응답의 내용을 제어할 수 있습니다.

`HttpException` 클래스의 인스턴스인 예외를 포착하고 이에 대한 사용자 지정 응답 로직을 구현하는 예외 필터를 만들어 봅시다. 이를 위해 기본 플랫폼 `Request` 및 `Response` 객체에 접근해야 합니다. 원래 `url`을 가져와서 로깅 정보에 포함시키기 위해 `Request` 객체에 접근할 것입니다. `response.json()` 메소드를 사용하여 보내지는 응답을 직접 제어하기 위해 `Response` 객체를 사용할 것입니다.

```typescript
@@filename(http-exception.filter)
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
@@switch
import { Catch, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
```

> info **힌트** 모든 예외 필터는 제네릭 `ExceptionFilter<T>` 인터페이스를 구현해야 합니다. 이를 위해서는 지정된 시그니처를 가진 `catch(exception: T, host: ArgumentsHost)` 메소드를 제공해야 합니다. `T`는 예외의 타입을 나타냅니다.

> warning **경고** `@nestjs/platform-fastify`를 사용하는 경우 `response.json()` 대신 `response.send()`를 사용할 수 있습니다. `fastify`에서 올바른 타입을 임포트하는 것을 잊지 마십시오.

`@Catch(HttpException)` 데코레이터는 예외 필터에 필요한 메타데이터를 바인딩하여 Nest에 이 특정 필터가 `HttpException` 타입의 예외만 찾고 있다는 것을 알려줍니다. `@Catch()` 데코레이터는 단일 매개변수 또는 쉼표로 구분된 목록을 받을 수 있습니다. 이를 통해 여러 타입의 예외에 대해 한 번에 필터를 설정할 수 있습니다.

#### Arguments host

`catch()` 메소드의 매개변수를 살펴봅시다. `exception` 매개변수는 현재 처리 중인 예외 객체입니다. `host` 매개변수는 `ArgumentsHost` 객체입니다. `ArgumentsHost`는 [실행 컨텍스트 챕터](/fundamentals/execution-context)에서 더 자세히 살펴볼 강력한 유틸리티 객체입니다*. 이 코드 샘플에서는 예외가 발생하는 원래 요청 핸들러(컨트롤러)로 전달되는 `Request` 및 `Response` 객체에 대한 참조를 얻기 위해 사용합니다. 이 코드 샘플에서는 `ArgumentsHost`의 헬퍼 메소드를 사용하여 원하는 `Request` 및 `Response` 객체를 가져왔습니다. `ArgumentsHost`에 대해 자세히 알아보려면 [여기](/fundamentals/execution-context)를 참조하십시오.

\*이러한 추상화 수준의 이유는 `ArgumentsHost`가 모든 컨텍스트(예: 지금 작업 중인 HTTP 서버 컨텍스트뿐만 아니라 마이크로서비스 및 WebSockets)에서 작동하기 때문입니다. 실행 컨텍스트 챕터에서는 `ArgumentsHost`와 그 헬퍼 함수의 힘을 사용하여 **모든** 실행 컨텍스트에 대해 적절한 <a href="https://nestjs.dokidocs.dev/fundamentals/execution-context#host-methods">기본 인수</a>에 접근하는 방법을 볼 수 있습니다. 이를 통해 모든 컨텍스트에서 작동하는 제네릭 예외 필터를 작성할 수 있습니다.

<app-banner-courses></app-banner-courses>

#### 필터 바인딩 (Binding filters)

새로운 `HttpExceptionFilter`를 `CatsController`의 `create()` 메소드에 연결해 봅시다.

```typescript
@@filename(cats.controller)
@Post()
@UseFilters(new HttpExceptionFilter())
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
@@switch
@Post()
@UseFilters(new HttpExceptionFilter())
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
```

> info **힌트** `@UseFilters()` 데코레이터는 `@nestjs/common` 패키지에서 임포트됩니다.

여기서 `@UseFilters()` 데코레이터를 사용했습니다. `@Catch()` 데코레이터와 유사하게 단일 필터 인스턴스 또는 쉼표로 구분된 필터 인스턴스 목록을 받을 수 있습니다. 여기서 `HttpExceptionFilter`의 인스턴스를 바로 생성했습니다. 또는 (인스턴스 대신) 클래스를 전달하여 인스턴스화 책임을 프레임워크에 맡기고 **의존성 주입**을 활성화할 수 있습니다.

```typescript
@@filename(cats.controller)
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
@@switch
@Post()
@UseFilters(HttpExceptionFilter)
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
```

> info **힌트** 가능한 경우 인스턴스 대신 클래스를 사용하여 필터를 적용하는 것을 선호하십시오. Nest가 애플리케이션 전체에서 동일한 클래스의 인스턴스를 쉽게 재사용할 수 있으므로 **메모리 사용량**이 줄어듭니다.

위 예에서 `HttpExceptionFilter`는 단일 `create()` 경로 핸들러에만 적용되므로 메소드 스코프(method-scoped)가 됩니다. 예외 필터는 메소드 스코프(컨트롤러/리졸버/게이트웨이), 컨트롤러 스코프, 또는 글로벌 스코프 등 다양한 수준으로 지정될 수 있습니다.
예를 들어, 컨트롤러 스코프로 필터를 설정하려면 다음과 같이 합니다.

```typescript
@@filename(cats.controller)
@Controller()
@UseFilters(new HttpExceptionFilter())
export class CatsController {}
```

이 구조는 `CatsController` 내에 정의된 모든 경로 핸들러에 대해 `HttpExceptionFilter`를 설정합니다.

글로벌 스코프 필터를 생성하려면 다음과 같이 합니다.

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> warning **경고** `useGlobalFilters()` 메소드는 게이트웨이 또는 하이브리드 애플리케이션에 필터를 설정하지 않습니다.

글로벌 스코프 필터는 전체 애플리케이션, 즉 모든 컨트롤러 및 모든 경로 핸들러에 걸쳐 사용됩니다. 의존성 주입 측면에서 볼 때, 어떤 모듈 외부에서 (위 예처럼 `useGlobalFilters()`로) 등록된 글로벌 필터는 어떤 모듈의 컨텍스트 외부에서 수행되므로 의존성을 주입할 수 없습니다. 이 문제를 해결하기 위해 다음 구조를 사용하여 **어떤 모듈에서든 직접** 글로벌 스코프 필터를 등록할 수 있습니다.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

> info **힌트** 필터에 대한 의존성 주입을 수행하기 위해 이 접근 방식을 사용할 때, 이 구조가 사용되는 모듈에 관계없이 필터는 실제로 전역(global)이라는 점에 유의하십시오. 어디에서 수행해야 할까요? 예제에서 `HttpExceptionFilter`가 정의된 모듈을 선택하십시오. 또한 `useClass`는 사용자 지정 프로바이더 등록을 처리하는 유일한 방법이 아닙니다. [여기](/fundamentals/custom-providers)에서 더 자세히 알아보십시오.

이 기술을 사용하여 필요한 만큼 필터를 추가할 수 있습니다. 각 필터를 프로바이더 배열에 추가하기만 하면 됩니다.

#### 모든 것 포착 (Catch everything)

**모든** 처리되지 않은 예외(예외 타입에 관계없이)를 포착하려면 `@Catch()` 데코레이터의 매개변수 목록을 비워 둡니다(예: `@Catch()`).

아래 예에는 응답을 전달하기 위해 [HTTP 어댑터](./faq/http-adapter)를 사용하고 플랫폼별 객체(`Request` 및 `Response`)를 직접 사용하지 않는 플랫폼 독립적인 코드가 있습니다.

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
```

> warning **경고** 모든 것을 포착하는 예외 필터를 특정 타입에 바인딩된 필터와 결합하는 경우, 특정 필터가 바인딩된 타입을 올바르게 처리하도록 하기 위해 "모든 것 포착" 필터를 먼저 선언해야 합니다.

#### 상속 (Inheritance)

일반적으로 애플리케이션 요구 사항을 충족하도록 제작된 완전히 사용자 지정된 예외 필터를 생성할 것입니다. 그러나 특정 요인에 따라 동작을 오버라이드하기 위해 기본 내장 **전역 예외 필터**를 단순히 확장하려는 사용 사례가 있을 수 있습니다.

예외 처리를 기본 필터에 위임하려면 `BaseExceptionFilter`를 확장하고 상속된 `catch()` 메소드를 호출해야 합니다.

```typescript
@@filename(all-exceptions.filter)
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
```

> warning **경고** `BaseExceptionFilter`를 확장하는 메소드 스코프 및 컨트롤러 스코프 필터는 `new`를 사용하여 인스턴스화해서는 안 됩니다. 대신 프레임워크가 자동으로 인스턴스화하도록 두십시오.

글로벌 필터는 기본 필터를 확장할 수 있습니다. 이는 다음 두 가지 방법 중 하나로 수행할 수 있습니다.

첫 번째 방법은 사용자 지정 글로벌 필터를 인스턴스화할 때 `HttpAdapter` 참조를 주입하는 것입니다.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

두 번째 방법은 <a href="exception-filters#binding-filters">여기에 표시된 대로</a> `APP_FILTER` 토큰을 사용하는 것입니다.
