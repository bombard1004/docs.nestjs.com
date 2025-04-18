### 컨트롤러

컨트롤러는 들어오는 **요청**을 처리하고 클라이언트로 **응답**을 다시 보내는 역할을 합니다.

<figure><img class="illustrative-image" src="/assets/Controllers_1.png" /></figure>

컨트롤러의 목적은 애플리케이션의 특정 요청을 처리하는 것입니다. **라우팅** 메커니즘은 각 요청을 처리할 컨트롤러를 결정합니다. 종종 컨트롤러에는 여러 개의 라우트가 있으며, 각 라우트는 다른 액션을 수행할 수 있습니다.

기본 컨트롤러를 생성하기 위해 클래스와 **데코레이터**를 사용합니다. 데코레이터는 클래스를 필요한 메타데이터와 연결하여 Nest가 요청을 해당 컨트롤러에 연결하는 라우팅 맵을 생성할 수 있도록 합니다.

> info **힌트** 내장된 [유효성 검사](https://nestjs.dokidocs.dev/techniques/validation) 기능을 갖춘 CRUD 컨트롤러를 빠르게 생성하려면 CLI의 [CRUD 생성기](https://nestjs.dokidocs.dev/recipes/crud-generator#crud-generator)를 사용할 수 있습니다: `nest g resource [name]`.

#### 라우팅

다음 예제에서는 기본 컨트롤러를 정의하는 데 **필수적인** `@Controller()` 데코레이터를 사용할 것입니다. 선택적 라우트 경로 접두사로 `cats`를 지정할 것입니다. `@Controller()` 데코레이터에 경로 접두사를 사용하면 관련 라우트를 함께 그룹화하고 반복적인 코드를 줄이는 데 도움이 됩니다. 예를 들어, `/cats` 경로 아래에서 고양이 엔티티와의 상호 작용을 관리하는 라우트들을 그룹화하려면 `@Controller()` 데코레이터에 `cats` 경로 접두사를 지정하면 됩니다. 이렇게 하면 파일 내의 각 라우트마다 해당 경로 부분을 반복할 필요가 없습니다.

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}
```

> info **힌트** CLI를 사용하여 컨트롤러를 생성하려면 `$ nest g controller [name]` 명령을 실행하면 됩니다.

`findAll()` 메서드 앞에 위치한 `@Get()` HTTP 요청 메서드 데코레이터는 Nest에게 HTTP 요청을 위한 특정 엔드포인트 핸들러를 생성하도록 지시합니다. 이 엔드포인트는 HTTP 요청 메서드(이 경우 GET)와 라우트 경로에 의해 정의됩니다. 그럼 라우트 경로는 무엇일까요? 핸들러의 라우트 경로는 컨트롤러에 선언된 (선택적) 접두사와 메서드의 데코레이터에 지정된 모든 경로를 결합하여 결정됩니다. 모든 라우트에 대해 접두사(`cats`)를 설정했고 메서드 데코레이터에 특정 경로를 추가하지 않았으므로, Nest는 `GET /cats` 요청을 이 핸들러에 매핑합니다.

앞서 언급했듯이, 라우트 경로에는 선택적인 컨트롤러 경로 접두사 **와** 메서드의 데코레이터에 지정된 모든 경로 문자열이 포함됩니다. 예를 들어, 컨트롤러 접두사가 `cats`이고 메서드 데코레이터가 `@Get('breed')`라면, 결과 라우트는 `GET /cats/breed`가 됩니다.

위 예제에서 이 엔드포인트로 GET 요청이 이루어지면 Nest는 요청을 사용자 정의 `findAll()` 메서드로 라우팅합니다. 여기서 우리가 선택한 메서드 이름은 전적으로 임의적이라는 점에 유의하십시오. 라우트를 바인딩하기 위해 메서드를 선언해야 하지만, Nest는 메서드 이름에 어떤 특별한 의미도 부여하지 않습니다.

이 메서드는 200 상태 코드와 관련된 응답을 반환합니다. 이 경우 단순히 문자열입니다. 왜 이런 일이 일어날까요? 설명하기 위해 먼저 Nest가 응답 조작을 위해 **두 가지** 다른 옵션을 사용한다는 개념을 도입해야 합니다.

<table>
  <tr>
    <td>표준 (권장)</td>
    <td>
      이 내장된 메서드를 사용하면 요청 핸들러가 JavaScript 객체나 배열을 반환할 때 <strong>자동으로</strong>
      JSON으로 직렬화됩니다. 하지만 JavaScript 기본 유형 (예: <code>string</code>, <code>number</code>, <code>boolean</code>)을 반환하면 Nest는 직렬화 시도 없이 값만 전송합니다. 이렇게 하면 응답 처리가 간단해집니다: 그냥 값을 반환하면 Nest가 나머지를 처리합니다.
      <br />
      <br /> 또한, 응답의 <strong>상태 코드</strong>는 POST를 사용하는 201을 제외하고 기본적으로 항상 200입니다.
      핸들러 수준에서 <code>@HttpCode(...)</code>
      데코레이터를 추가하여 이 동작을 쉽게 변경할 수 있습니다 (<a href='controllers#status-code'>상태 코드</a> 참조).
    </td>
  </tr>
  <tr>
    <td>라이브러리별</td>
    <td>
      메서드 핸들러 시그니처에서 <code>@Res()</code> 데코레이터를 사용하여 주입할 수 있는 라이브러리별 (예: Express) <a href="https://expressjs.com/en/api.html#res" rel="nofollow" target="_blank">응답 객체</a>를 사용할 수 있습니다 (예: <code>findAll(@Res() response)</code>). 이 접근 방식을 사용하면 해당 객체에 의해 노출되는 네이티브 응답 처리 메서드를 사용할 수 있습니다. 예를 들어, Express에서는 <code>response.status(200).send()</code>와 같은 코드를 사용하여 응답을 구성할 수 있습니다.
    </td>
  </tr>
</table>

> warning **경고** Nest는 핸들러가 `@Res()` 또는 `@Next()` 중 하나를 사용하고 있음을 감지하여 라이브러리별 옵션을 선택했음을 나타냅니다. 두 접근 방식이 동시에 사용되면 이 단일 라우트에 대해 표준 접근 방식이 **자동으로 비활성화**되며 예상대로 작동하지 않습니다. 두 접근 방식을 동시에 사용하려면 (예를 들어, 쿠키/헤더 설정만 위해 응답 객체를 주입하고 나머지는 프레임워크에 맡기는 경우), `@Res({{ '{' }} passthrough: true {{ '}' }})` 데코레이터에서 `passthrough` 옵션을 `true`로 설정해야 합니다.

<app-banner-devtools></app-banner-devtools>

#### 요청 객체

핸들러는 종종 클라이언트의 **요청** 세부 정보에 접근해야 합니다. Nest는 기본 플랫폼 (기본값은 Express)에서 [요청 객체](https://expressjs.com/en/api.html#req)에 대한 접근을 제공합니다. 핸들러의 시그니처에 `@Req()` 데코레이터를 사용하여 Nest에게 이를 주입하도록 지시함으로써 요청 객체에 접근할 수 있습니다.

```typescript
@@filename(cats.controller)
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Bind, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  @Bind(Req())
  findAll(request) {
    return 'This action returns all cats';
  }
}
```

> info **힌트** `express` 타입 정의 (위의 `request: Request` 매개변수 예제와 같이)를 활용하려면 `@types/express` 패키지를 설치했는지 확인하십시오.

요청 객체는 HTTP 요청을 나타내며 쿼리 문자열, 매개변수, HTTP 헤더 및 본문에 대한 속성을 포함합니다 ([여기](https://expressjs.com/en/api.html#req)에서 더 자세히 읽어보십시오). 대부분의 경우 이러한 속성에 수동으로 접근할 필요가 없습니다. 대신 `@Body()` 또는 `@Query()`와 같이 기본으로 제공되는 전용 데코레이터를 사용할 수 있습니다. 아래는 제공되는 데코레이터 목록과 해당 플랫폼별 객체입니다.

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td></tr>
    <tr>
      <td><code>@Response(), @Res()</code><span class="table-code-asterisk">*</span></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(key?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[key]</code></td>
    </tr>
    <tr>
      <td><code>@Body(key?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[key]</code></td>
    </tr>
    <tr>
      <td><code>@Query(key?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[key]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(name?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[name]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam()</code></td>
      <td><code>req.hosts</code></td>
    </tr>
  </tbody>
</table>

<sup>\* </sup>기저 HTTP 플랫폼 (예: Express 및 Fastify) 간의 타입 정의 호환성을 위해 Nest는 `@Res()` 및 `@Response()` 데코레이터를 제공합니다. `@Res()`는 단순히 `@Response()`의 별칭입니다. 둘 다 기저 네이티브 플랫폼의 `response` 객체 인터페이스를 직접 노출합니다. 이들을 사용할 때는 전체 기능을 활용하기 위해 기저 라이브러리의 타입 정의 (예: `@types/express`)도 가져와야 합니다. 메서드 핸들러에 `@Res()` 또는 `@Response()`를 주입하면 해당 핸들러에 대해 Nest가 **라이브러리별 모드**로 전환되며, 응답 관리에 대한 책임은 사용자에게 있습니다. 이렇게 할 때는 `response` 객체에 대한 호출(예: `res.json(...)` 또는 `res.send(...)`)을 통해 어떤 종류의 응답을 발행해야 하며, 그렇지 않으면 HTTP 서버가 응답 대기 상태가 됩니다.

> info **힌트** 자신만의 커스텀 데코레이터를 만드는 방법은 [이](/custom-decorators) 챕터를 방문하십시오.

#### 리소스

앞서 고양이 리소스를 가져오는 엔드포인트 ( **GET** 라우트)를 정의했습니다. 일반적으로 새 레코드를 생성하는 엔드포인트도 제공하고 싶을 것입니다. 이를 위해 **POST** 핸들러를 생성해 보겠습니다.

```typescript
@@filename(cats.controller)
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create() {
    return 'This action adds a new cat';
  }

  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}
```

이렇게 간단합니다. Nest는 모든 표준 HTTP 메서드에 대한 데코레이터를 제공합니다: `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`, `@Options()`, 그리고 `@Head()`. 또한 `@All()`은 이 모든 것을 처리하는 엔드포인트를 정의합니다.

#### 라우트 와일드카드

NestJS에서는 패턴 기반 라우트도 지원합니다. 예를 들어, 별표(`*`)는 경로 끝에서 라우트의 모든 문자 조합과 일치하는 와일드카드로 사용될 수 있습니다. 다음 예제에서 `findAll()` 메서드는 뒤따르는 문자 수에 관계없이 `abcd/`로 시작하는 모든 라우트에 대해 실행됩니다.

```typescript
@Get('abcd/*')
findAll() {
  return 'This route uses a wildcard';
}
```

`'abcd/*'` 라우트 경로는 `abcd/`, `abcd/123`, `abcd/abc` 등과 일치합니다. 하이픈(`-`)과 점(`.`)은 문자열 기반 경로에서 리터럴로 해석됩니다.

이 접근 방식은 Express와 Fastify 모두에서 작동합니다. 하지만 최신 Express 릴리스(v5)에서는 라우팅 시스템이 더 엄격해졌습니다. 순수 Express에서는 라우트를 작동시키기 위해 명명된 와일드카드(예: `abcd/*splat`, 여기서 `splat`은 단순히 와일드카드 매개변수의 이름이며 특별한 의미는 없습니다. 원하는 대로 이름을 지정할 수 있습니다)를 사용해야 합니다. 하지만 Nest는 Express에 대한 호환성 레이어를 제공하므로 별표(`*`)를 와일드카드로 계속 사용할 수 있습니다.

**라우트 중간**에 사용되는 별표의 경우 Express는 명명된 와일드카드(예: `ab{{ '{' }}*splat&#125;cd`)를 요구하는 반면, Fastify는 아예 지원하지 않습니다.

#### 상태 코드

앞서 언급했듯이 응답의 기본 **상태 코드**는 POST 요청의 기본값인 **201**을 제외하고 항상 **200**입니다. 핸들러 수준에서 `@HttpCode(...)` 데코레이터를 사용하여 이 동작을 쉽게 변경할 수 있습니다.

```typescript
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
```

> info **힌트** `@nestjs/common` 패키지에서 `HttpCode`를 가져오십시오.

종종 상태 코드가 정적이 아니라 다양한 요인에 따라 달라집니다. 그런 경우 라이브러리별 **응답** (`@Res()`를 사용하여 주입) 객체를 사용하거나 (오류의 경우) 예외를 throw할 수 있습니다.

#### 응답 헤더

커스텀 응답 헤더를 지정하려면 `@Header()` 데코레이터를 사용하거나 라이브러리별 응답 객체(및 `res.header()` 직접 호출)를 사용할 수 있습니다.

```typescript
@Post()
@Header('Cache-Control', 'no-store')
create() {
  return 'This action adds a new cat';
}
```

> info **힌트** `@nestjs/common` 패키지에서 `Header`를 가져오십시오.

#### 리다이렉션

응답을 특정 URL로 리다이렉션하려면 `@Redirect()` 데코레이터를 사용하거나 라이브러리별 응답 객체(및 `res.redirect()` 직접 호출)를 사용할 수 있습니다.

`@Redirect()`는 `url`과 `statusCode` 두 개의 인자를 받으며, 둘 다 선택 사항입니다. `statusCode`의 기본값은 생략 시 `302` (`Found`)입니다.

```typescript
@Get()
@Redirect('https://nestjs.com', 301)
```

> info **힌트** 때로는 HTTP 상태 코드나 리다이렉트 URL을 동적으로 결정하고 싶을 수 있습니다. `@nestjs/common`의 `HttpRedirectResponse` 인터페이스를 따르는 객체를 반환하여 이를 수행하십시오.

반환된 값은 `@Redirect()` 데코레이터에 전달된 모든 인자를 오버라이드합니다. 예를 들어:

```typescript
@Get('docs')
@Redirect('https://docs.nestjs.com', 302)
getDocs(@Query('version') version) {
  if (version && version === '5') {
    return { url: 'https://docs.nestjs.com/v5/' };
  }
}
```

#### 라우트 파라미터

**동적 데이터**를 요청의 일부로 받아들여야 할 때(예: ID가 `1`인 고양이를 가져오는 `GET /cats/1`)는 정적 경로를 가진 라우트가 작동하지 않습니다. 매개변수가 있는 라우트를 정의하려면 URL에서 동적 값을 캡처하기 위해 라우트 경로에 라우트 매개변수 **토큰**을 추가할 수 있습니다. 아래 `@Get()` 데코레이터 예제에서 라우트 매개변수 토큰은 이 접근 방식을 보여줍니다. 이러한 라우트 매개변수는 메서드 시그니처에 추가되어야 하는 `@Param()` 데코레이터를 사용하여 접근할 수 있습니다.

> info **힌트** 매개변수가 있는 라우트는 모든 정적 경로 뒤에 선언해야 합니다. 이렇게 하면 매개변수화된 경로가 정적 경로로 향하는 트래픽을 가로채는 것을 방지합니다.

```typescript
@@filename()
@Get(':id')
findOne(@Param() params: any): string {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
@@switch
@Get(':id')
@Bind(Param())
findOne(params) {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
```

`@Param()` 데코레이터는 메서드 매개변수(위 예제에서는 `params`)를 데코레이트하는 데 사용되어, **라우트** 매개변수를 메서드 내에서 해당 데코레이트된 메서드 매개변수의 속성으로 접근할 수 있게 합니다. 코드에 표시된 것처럼 `params.id`를 참조하여 `id` 매개변수에 접근할 수 있습니다. 또는 데코레이터에 특정 매개변수 토큰을 전달하고 메서드 본문 내에서 라우트 매개변수를 이름으로 직접 참조할 수도 있습니다.

> info **힌트** `@nestjs/common` 패키지에서 `Param`을 가져오십시오.

```typescript
@@filename()
@Get(':id')
findOne(@Param('id') id: string): string {
  return `This action returns a #${id} cat`;
}
@@switch
@Get(':id')
@Bind(Param('id'))
findOne(id) {
  return `This action returns a #${id} cat`;
}
```

#### 서브도메인 라우팅

`@Controller` 데코레이터는 들어오는 요청의 HTTP 호스트가 특정 값과 일치하도록 요구하는 `host` 옵션을 가질 수 있습니다.

```typescript
@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get()
  index(): string {
    return 'Admin page';
  }
}
```

> warning **경고** **Fastify**는 중첩 라우터를 지원하지 않으므로 서브도메인 라우팅을 사용하는 경우 기본 Express 어댑터를 사용하는 것이 좋습니다.

라우트 `path`와 유사하게 `hosts` 옵션은 호스트 이름의 해당 위치에 있는 동적 값을 캡처하기 위해 토큰을 사용할 수 있습니다. 아래 `@Controller()` 데코레이터 예제에서 호스트 매개변수 토큰은 이러한 사용법을 보여줍니다. 이런 방식으로 선언된 호스트 매개변수는 메서드 시그니처에 추가되어야 하는 `@HostParam()` 데코레이터를 사용하여 접근할 수 있습니다.

```typescript
@Controller({ host: ':account.example.com' })
export class AccountController {
  @Get()
  getInfo(@HostParam('account') account: string) {
    return account;
  }
}
```

#### 상태 공유

다른 프로그래밍 언어에서 온 개발자들에게는 Nest에서 거의 모든 것이 들어오는 요청 간에 공유된다는 사실이 놀라울 수 있습니다. 여기에는 데이터베이스 연결 풀, 전역 상태를 가진 싱글턴 서비스 등이 포함됩니다. Node.js는 각 요청이 별도의 스레드에 의해 처리되는 요청/응답 멀티스레드 무상태 모델을 사용하지 않는다는 점을 이해하는 것이 중요합니다. 결과적으로 Nest에서 싱글턴 인스턴스를 사용하는 것은 애플리케이션에 대해 완전히 **안전**합니다.

그렇긴 하지만, 컨트롤러에 대한 요청 기반 라이프사이클이 필요한 특정 예외적인 경우가 있습니다. 예를 들어 GraphQL 애플리케이션에서의 요청별 캐싱, 요청 추적 또는 멀티테넌시 구현 등이 있습니다. 주입 스코프를 제어하는 방법에 대해 [여기](/fundamentals/injection-scopes)에서 더 자세히 알아볼 수 있습니다.

#### 비동기성

우리는 현대 JavaScript, 특히 **비동기** 데이터 처리에 대한 강조를 좋아합니다. 그렇기 때문에 Nest는 `async` 함수를 완전히 지원합니다. 모든 `async` 함수는 Nest가 자동으로 해결할 수 있는 지연된 값을 반환할 수 있도록 `Promise`를 반환해야 합니다. 예는 다음과 같습니다:

```typescript
@@filename(cats.controller)
@Get()
async findAll(): Promise<any[]> {
  return [];
}
@@switch
@Get()
async findAll() {
  return [];
}
```

이 코드는 완전히 유효합니다. 하지만 Nest는 여기서 한 단계 더 나아가 라우트 핸들러가 RxJS [옵저버블 스트림](https://rxjs-dev.firebaseapp.com/guide/observable)도 반환할 수 있도록 허용합니다. Nest는 내부적으로 구독을 처리하고 스트림이 완료되면 최종 방출 값을 해결합니다.

```typescript
@@filename(cats.controller)
@Get()
findAll(): Observable<any[]> {
  return of([]);
}
@@switch
@Get()
findAll() {
  return of([]);
}
```

두 접근 방식 모두 유효하며 필요에 가장 적합한 것을 선택할 수 있습니다.

#### 요청 페이로드

이전 예제에서 POST 라우트 핸들러는 클라이언트 매개변수를 전혀 받아들이지 않았습니다. `@Body()` 데코레이터를 추가하여 이를 수정해 보겠습니다.

진행하기 전에 (TypeScript를 사용하는 경우) **DTO**(Data Transfer Object) 스키마를 정의해야 합니다. DTO는 네트워크를 통해 데이터가 전송되는 방식을 지정하는 객체입니다. **TypeScript** 인터페이스나 간단한 클래스를 사용하여 DTO 스키마를 정의할 수 있습니다. 하지만 여기서는 **클래스**를 사용하는 것이 좋습니다. 왜냐하면 클래스는 JavaScript ES6 표준의 일부이므로 컴파일된 JavaScript에서 실제 엔티티로 유지됩니다. 대조적으로 TypeScript 인터페이스는 트랜스파일 중에 제거되어 Nest가 런타임에 이들을 참조할 수 없게 됩니다. 이는 **파이프**와 같은 기능이 런타임에 변수의 메타타입에 접근해야 하며, 이는 클래스에서만 가능하기 때문에 중요합니다.

`CreateCatDto` 클래스를 생성해 보겠습니다:

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

세 가지 기본 속성만 있습니다. 그런 다음 새로 생성된 DTO를 `CatsController` 내에서 사용할 수 있습니다:

```typescript
@@filename(cats.controller)
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'This action adds a new cat';
}
@@switch
@Post()
@Bind(Body())
async create(createCatDto) {
  return 'This action adds a new cat';
}
```

> info **힌트** 우리의 `ValidationPipe`는 메서드 핸들러에서 받으면 안 되는 속성을 필터링할 수 있습니다. 이 경우 허용 가능한 속성을 화이트리스트에 추가할 수 있으며, 화이트리스트에 포함되지 않은 속성은 결과 객체에서 자동으로 제거됩니다. `CreateCatDto` 예제에서 우리의 화이트리스트는 `name`, `age`, `breed` 속성입니다. [여기](https://nestjs.dokidocs.dev/techniques/validation#stripping-properties)에서 더 자세히 알아보십시오.

#### 쿼리 파라미터

라우트에서 쿼리 파라미터를 처리할 때, `@Query()` 데코레이터를 사용하여 들어오는 요청에서 쿼리 파라미터를 추출할 수 있습니다. 이것이 실제로 어떻게 작동하는지 살펴봅시다.

`age` 및 `breed`와 같은 쿼리 파라미터를 기반으로 고양이 목록을 필터링하려는 라우트를 고려해 보겠습니다. 먼저 `CatsController`에서 쿼리 파라미터를 정의합니다:

```typescript
@@filename(cats.controller)
@Get()
async findAll(@Query('age') age: number, @Query('breed') breed: string) {
  return `This action returns all cats filtered by age: ${age} and breed: ${breed}`;
}
```

이 예제에서 `@Query()` 데코레이터는 쿼리 문자열에서 `age` 및 `breed`의 값을 추출하는 데 사용됩니다. 예를 들어:

```plaintext
GET /cats?age=2&breed=Persian
```

로 요청하면 `age`는 `2`가 되고 `breed`는 `Persian`이 됩니다.

중첩 객체 또는 배열과 같은 더 복잡한 쿼리 매개변수 처리가 필요한 경우:

```plaintext
?filter[where][name]=John&filter[where][age]=30
?item[]=1&item[]=2
```

적절한 쿼리 파서를 사용하도록 HTTP 어댑터(Express 또는 Fastify)를 구성해야 합니다. Express에서는 풍부한 쿼리 객체를 허용하는 `extended` 파서를 사용할 수 있습니다:

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.set('query parser', 'extended');
```

Fastify에서는 `querystringParser` 옵션을 사용할 수 있습니다:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    querystringParser: (str) => qs.parse(str),
  }),
);
```

> info **힌트** `qs`는 중첩 및 배열을 지원하는 쿼리 문자열 파서입니다. `npm install qs`를 사용하여 설치할 수 있습니다.

#### 오류 처리

오류 처리(즉, 예외 작업)에 대한 별도의 챕터가 [여기](/exception-filters)에 있습니다.

#### 전체 리소스 샘플

아래는 여러 사용 가능한 데코레이터를 사용하여 기본 컨트롤러를 생성하는 것을 보여주는 예제입니다. 이 컨트롤러는 내부 데이터에 접근하고 조작하는 몇 가지 메서드를 제공합니다.

```typescript
@@filename(cats.controller)
import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, ListAllEntities } from './dto';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return 'This action removes a #${id} cat';
  }
}
@@switch
import { Controller, Get, Query, Post, Body, Put, Param, Delete, Bind } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Body())
  create(createCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  @Bind(Query())
  findAll(query) {
    console.log(query);
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  @Bind(Param('id'))
  findOne(id) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  @Bind(Param('id'), Body())
  update(id, updateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  @Bind(Param('id'))
  remove(id) {
    return `This action removes a #${id} cat`;
  }
}
```

> info **힌트** Nest CLI는 자동으로 **모든 상용구 코드**를 생성하여 수동으로 작업하는 번거로움을 줄이고 전반적인 개발자 경험을 향상시키는 생성기(schematic)를 제공합니다. 이 기능에 대해 [여기](/recipes/crud-generator)에서 더 자세히 알아보십시오.

#### 시작하기

`CatsController`가 완전히 정의되었더라도 Nest는 아직 이에 대해 알지 못하며 자동으로 클래스의 인스턴스를 생성하지 않습니다.

컨트롤러는 항상 모듈의 일부여야 하므로 `@Module()` 데코레이터 내에 `controllers` 배열을 포함합니다. 루트 `AppModule` 외에 다른 모듈을 정의하지 않았으므로 이를 사용하여 `CatsController`를 등록합니다:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class AppModule {}
```

우리는 `@Module()` 데코레이터를 사용하여 모듈 클래스에 메타데이터를 첨부했으며, 이제 Nest는 어떤 컨트롤러가 마운트되어야 하는지 쉽게 결정할 수 있습니다.

#### 라이브러리별 접근 방식

지금까지 응답을 조작하는 표준 Nest 방식을 다루었습니다. 다른 접근 방식은 라이브러리별 [응답 객체](https://expressjs.com/en/api.html#res)를 사용하는 것입니다. 특정 응답 객체를 주입하기 위해 `@Res()` 데코레이터를 사용할 수 있습니다. 차이점을 강조하기 위해 `CatsController`를 다음과 같이 다시 작성해 보겠습니다:

```typescript
@@filename()
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
@@switch
import { Controller, Get, Post, Bind, Res, Body, HttpStatus } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Res(), Body())
  create(res, createCatDto) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  @Bind(Res())
  findAll(res) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

이 접근 방식은 작동하며 응답 객체에 대한 완전한 제어(예: 헤더 조작 및 라이브러리별 기능 접근)를 제공하여 더 많은 유연성을 제공하지만 주의해서 사용해야 합니다. 일반적으로 이 메서드는 덜 명확하며 몇 가지 단점이 있습니다. 주요 단점은 코드의 플랫폼 종속성이 발생한다는 점입니다. 다른 기저 라이브러리는 응답 객체에 대해 다른 API를 가질 수 있기 때문입니다. 또한 테스트하기가 더 어려워질 수 있으며, 응답 객체 등을 모킹해야 할 수 있습니다.

더 나아가 이 접근 방식을 사용하면 인터셉터 및 `@HttpCode()` / `@Header()` 데코레이터와 같이 표준 응답 처리에 의존하는 Nest 기능과의 호환성을 잃게 됩니다. 이를 해결하기 위해 다음과 같이 `passthrough` 옵션을 활성화할 수 있습니다:

```typescript
@@filename()
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.status(HttpStatus.OK);
  return [];
}
@@switch
@Get()
@Bind(Res({ passthrough: true }))
findAll(res) {
  res.status(HttpStatus.OK);
  return [];
}
```

이 접근 방식을 사용하면 네이티브 응답 객체와 상호 작용하면서 (예: 특정 조건에 따라 쿠키 또는 헤더 설정) 나머지 처리는 프레임워크에 맡길 수 있습니다.