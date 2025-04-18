### CSRF 보호

사이트 간 요청 위조(CSRF 또는 XSRF)는 신뢰할 수 있는 사용자가 웹 애플리케이션에 **승인되지 않은** 명령을 보내는 공격 유형입니다. 이를 방지하기 위해 [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf) 패키지를 사용할 수 있습니다.

#### Express와 함께 사용 (기본값)

필요한 패키지를 설치하는 것부터 시작합니다.

```bash
$ npm i csrf-csrf
```

> warning **경고** [csrf-csrf 문서](https://github.com/Psifi-Solutions/csrf-csrf?tab=readme-ov-file#getting-started)에 명시된 바와 같이, 이 미들웨어는 사전에 세션 미들웨어 또는 `cookie-parser`가 초기화되어 있어야 합니다. 자세한 내용은 문서를 참조하십시오.

설치가 완료되면 `csrf-csrf` 미들웨어를 전역 미들웨어로 등록합니다.

```typescript
import { doubleCsrf } from 'csrf-csrf';
// ...
// 초기화 파일 어딘가에
const {
  invalidCsrfTokenError, // 사용자 정의 미들웨어를 만들 계획이라면 순전히 편의를 위해 제공됩니다.
  generateToken, // CSRF 해시와 토큰 쿠키 및 토큰을 생성하고 제공하기 위해 라우트에서 사용합니다.
  validateRequest, // 사용자 정의 미들웨어를 만들 계획이라면 또한 편의를 위해 제공됩니다.
  doubleCsrfProtection, // 이것은 기본 CSRF 보호 미들웨어입니다.
} = doubleCsrf(doubleCsrfOptions);
app.use(doubleCsrfProtection);
```

#### Fastify와 함께 사용

필요한 패키지를 설치하는 것부터 시작합니다.

```bash
$ npm i --save @fastify/csrf-protection
```

설치가 완료되면 다음과 같이 `@fastify/csrf-protection` 플러그인을 등록합니다.

```typescript
import fastifyCsrf from '@fastify/csrf-protection';
// ...
// 일부 스토리지 플러그인 등록 후 초기화 파일 어딘가에
await app.register(fastifyCsrf);
```

> warning **경고** [@fastify/csrf-protection] 문서의 [여기](https://github.com/fastify/csrf-protection#usage)에 설명된 바와 같이, 이 플러그인은 스토리지 플러그인이 먼저 초기화되어 있어야 합니다. 자세한 내용은 해당 문서를 참조하십시오.
