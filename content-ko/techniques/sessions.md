### 세션

**HTTP 세션**은 여러 요청에 걸쳐 사용자 정보를 저장하는 방법을 제공하며, 이는 특히 [MVC](/techniques/mvc) 애플리케이션에 유용합니다.

#### Express와 함께 사용 (기본값)

먼저 [필수 패키지](https://github.com/expressjs/session)를 설치합니다 (TypeScript 사용자는 타입 정의도 함께 설치):

```shell
$ npm i express-session
$ npm i -D @types/express-session
```

설치가 완료되면, `express-session` 미들웨어를 전역 미들웨어로 적용합니다 (예: `main.ts` 파일).

```typescript
import * as session from 'express-session';
// somewhere in your initialization file
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
  }),
);
```

> warning **주의** 기본 서버 측 세션 저장은 프로덕션 환경을 위해 설계되지 않았습니다. 대부분의 조건에서 메모리가 누수되고, 단일 프로세스 이상으로 확장되지 않으며, 디버깅 및 개발을 위한 용도입니다. [공식 저장소](https://github.com/expressjs/session)에서 더 자세히 읽어보세요.

`secret`은 세션 ID 쿠키에 서명하는 데 사용됩니다. 단일 시크릿에 대한 문자열이 될 수도 있고, 여러 시크릿의 배열이 될 수도 있습니다. 시크릿 배열이 제공되면 첫 번째 요소만 세션 ID 쿠키에 서명하는 데 사용되며, 모든 요소는 요청에서 서명을 확인할 때 고려됩니다. 시크릿 자체는 사람이 쉽게 파싱할 수 없어야 하며 무작위 문자 집합이 가장 좋습니다.

`resave` 옵션을 활성화하면 요청 중에 세션이 수정되지 않았더라도 세션을 세션 저장소에 다시 저장하도록 강제합니다. 기본값은 `true`이지만, 기본값은 향후 변경될 예정이므로 기본값 사용은 더 이상 권장되지 않습니다.

마찬가지로, `saveUninitialized` 옵션을 활성화하면 "초기화되지 않은" 세션이 저장소에 저장되도록 강제합니다. 세션은 새로 생성되었지만 수정되지 않았을 때 초기화되지 않은 상태입니다. `false`를 선택하는 것은 로그인 세션을 구현하거나, 서버 저장소 사용량을 줄이거나, 쿠키 설정 전에 권한이 필요한 법규를 준수하는 데 유용합니다. `false`를 선택하면 클라이언트가 세션 없이 여러 병렬 요청을 할 때 발생하는 경쟁 상태 문제에도 도움이 됩니다 ([출처](https://github.com/expressjs/session#saveUninitialized)).

`session` 미들웨어에 다른 여러 옵션을 전달할 수 있습니다. [API 문서](https://github.com/expressjs/session#options)에서 자세히 읽어보세요.

> info **팁** `secure: true`는 권장되는 옵션입니다. 하지만 이 옵션은 HTTPS가 활성화된 웹사이트가 필요합니다. 즉, 보안 쿠키를 위해서는 HTTPS가 필수입니다. `secure`가 설정된 상태에서 HTTP로 사이트에 접근하면 쿠키가 설정되지 않습니다. Node.js 서버가 프록시 뒤에 있고 `secure: true`를 사용하는 경우, Express에서 `"trust proxy"`를 설정해야 합니다.

위 설정이 완료되면 이제 라우트 핸들러 내에서 다음과 같이 세션 값을 설정하고 읽을 수 있습니다.

```typescript
@Get()
findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
```

> info **팁** `@Req()` 데코레이터는 `@nestjs/common`에서 가져오고, `Request`는 `express` 패키지에서 가져옵니다.

대신 `@Session()` 데코레이터를 사용하여 요청에서 세션 객체를 추출할 수 있습니다. 방법은 다음과 같습니다.

```typescript
@Get()
findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
```

> info **팁** `@Session()` 데코레이터는 `@nestjs/common` 패키지에서 가져옵니다.

#### Fastify와 함께 사용

먼저 필수 패키지를 설치합니다:

```shell
$ npm i @fastify/secure-session
```

설치가 완료되면 `fastify-secure-session` 플러그인을 등록합니다:

```typescript
import secureSession from '@fastify/secure-session';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(secureSession, {
  secret: 'averylogphrasebiggerthanthirtytwochars',
  salt: 'mq9hDxBVDbspDR6n',
});
```

> info **팁** 키를 미리 생성하거나 ([지침 보기](https://github.com/fastify/fastify-secure-session)) [키 순환](https://github.com/fastify/fastify-secure-session#using-keys-with-key-rotation)을 사용할 수도 있습니다.

[공식 저장소](https://github.com/fastify/fastify-secure-session)에서 사용 가능한 옵션에 대해 자세히 읽어보세요.

위 설정이 완료되면 이제 라우트 핸들러 내에서 다음과 같이 세션 값을 설정하고 읽을 수 있습니다.

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
```

대신 `@Session()` 데코레이터를 사용하여 요청에서 세션 객체를 추출할 수 있습니다. 방법은 다음과 같습니다.

```typescript
@Get()
findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
```

> info **팁** `@Session()` 데코레이터는 `@nestjs/common`에서 가져오고, `secureSession.Session`은 `@fastify/secure-session` 패키지에서 가져옵니다 (import 문: `import * as secureSession from '@fastify/secure-session'`).