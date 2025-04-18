### 쿠키

**HTTP 쿠키**는 사용자의 브라우저에 저장되는 작은 데이터 조각입니다. 쿠키는 웹사이트가 상태 정보(stateful information)를 기억하기 위한 안정적인 메커니즘으로 설계되었습니다. 사용자가 웹사이트를 다시 방문할 때, 쿠키는 요청과 함께 자동으로 전송됩니다.

#### Express와 함께 사용하기 (기본)

먼저 [필요한 패키지](https://github.com/expressjs/cookie-parser)를 설치하세요 (TypeScript 사용자는 해당 타입도 설치해야 합니다):

```shell
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
```

설치가 완료되면, `cookie-parser` 미들웨어를 전역 미들웨어로 적용하세요 (예를 들어, `main.ts` 파일에서).

```typescript
import * as cookieParser from 'cookie-parser';
// 초기화 파일의 어딘가
app.use(cookieParser());
```

`cookieParser` 미들웨어에 여러 옵션을 전달할 수 있습니다:

*   `secret` 쿠키 서명에 사용되는 문자열 또는 배열입니다. 이것은 선택 사항이며, 지정되지 않으면 서명된 쿠키를 파싱하지 않습니다. 문자열이 제공되면 이것이 시크릿으로 사용됩니다. 배열이 제공되면 순서대로 각 시크릿으로 쿠키의 서명을 해제하려는 시도가 이루어집니다.
*   `options` 두 번째 옵션으로 `cookie.parse`에 전달되는 객체입니다. 더 자세한 정보는 [cookie](https://www.npmjs.org/package/cookie)를 참조하세요.

미들웨어는 요청의 `Cookie` 헤더를 파싱하고, 쿠키 데이터를 `req.cookies` 속성으로 노출하며, 시크릿이 제공된 경우 `req.signedCookies` 속성으로 노출합니다. 이 속성들은 쿠키 이름과 쿠키 값의 이름-값 쌍입니다.

시크릿이 제공되면, 이 모듈은 서명된 쿠키 값의 서명을 해제하고 유효성을 검사하며, 해당 이름-값 쌍을 `req.cookies`에서 `req.signedCookies`로 이동합니다. 서명된 쿠키는 `s:`가 접두사로 붙은 값을 가진 쿠키입니다. 서명 유효성 검사에 실패한 서명된 쿠키는 변조된 값 대신 `false` 값을 갖습니다.

이 설정이 완료되면 이제 다음과 같이 라우트 핸들러 내에서 쿠키를 읽을 수 있습니다:

```typescript
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // 또는 "request.cookies['cookieKey']"
  // 또는 console.log(request.signedCookies);
}
```

> info **힌트** `@Req()` 데코레이터는 `@nestjs/common`에서 임포트되고, `Request`는 `express` 패키지에서 임포트됩니다.

나가는 응답에 쿠키를 첨부하려면 `Response#cookie()` 메서드를 사용하세요:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value')
}
```

> warning **경고** 응답 처리 로직을 프레임워크에 맡기고 싶다면, 위에 표시된 것처럼 `passthrough` 옵션을 `true`로 설정해야 합니다. 자세한 내용은 [여기](/controllers#library-specific-approach)에서 읽어보세요.

> info **힌트** `@Res()` 데코레이터는 `@nestjs/common`에서 임포트되고, `Response`는 `express` 패키지에서 임포트됩니다.

#### Fastify와 함께 사용하기

먼저 필요한 패키지를 설치하세요:

```shell
$ npm i @fastify/cookie
```

설치가 완료되면, `@fastify/cookie` 플러그인을 등록하세요:

```typescript
import fastifyCookie from '@fastify/cookie';

// 초기화 파일의 어딘가
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(fastifyCookie, {
  secret: 'my-secret', // 쿠키 서명을 위해
});
```

이 설정이 완료되면 이제 다음과 같이 라우트 핸들러 내에서 쿠키를 읽을 수 있습니다:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // 또는 "request.cookies['cookieKey']"
}
```

> info **힌트** `@Req()` 데코레이터는 `@nestjs/common`에서 임포트되고, `FastifyRequest`는 `fastify` 패키지에서 임포트됩니다.

나가는 응답에 쿠키를 첨부하려면 `FastifyReply#setCookie()` 메서드를 사용하세요:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value')
}
```

`FastifyReply#setCookie()` 메서드에 대해 더 자세히 알아보려면 이 [페이지](https://github.com/fastify/fastify-cookie#sending)를 확인하세요.

> warning **경고** 응답 처리 로직을 프레임워크에 맡기고 싶다면, 위에 표시된 것처럼 `passthrough` 옵션을 `true`로 설정해야 합니다. 자세한 내용은 [여기](/controllers#library-specific-approach)에서 읽어보세요.

> info **힌트** `@Res()` 데코레이터는 `@nestjs/common`에서 임포트되고, `FastifyReply`는 `fastify` 패키지에서 임포트됩니다.

#### 커스텀 데코레이터 생성하기 (크로스 플랫폼)

들어오는 쿠키에 접근하는 편리하고 선언적인 방법을 제공하기 위해 [커스텀 데코레이터](/custom-decorators)를 생성할 수 있습니다.

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});
```

`@Cookies()` 데코레이터는 `req.cookies` 객체에서 모든 쿠키 또는 지정된 이름의 쿠키를 추출하여 데코레이트된 매개변수에 해당 값을 채웁니다.

이 설정이 완료되면 이제 다음과 같이 라우트 핸들러 시그니처에서 데코레이터를 사용할 수 있습니다:

```typescript
@Get()
findAll(@Cookies('name') name: string) {}
```
