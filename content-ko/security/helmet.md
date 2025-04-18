### Helmet

[Helmet](https://github.com/helmetjs/helmet)은 HTTP 헤더를 적절하게 설정하여 앱을 일부 알려진 웹 취약점으로부터 보호하는 데 도움이 될 수 있습니다. 일반적으로 Helmet은 보안 관련 HTTP 헤더를 설정하는 작은 미들웨어 함수들의 모음입니다(자세한 내용은 [여기](https://github.com/helmetjs/helmet#how-it-works)에서 읽어보세요).

> info **힌트** `helmet`을 전역적으로 적용하거나 등록하는 것은 `app.use()`를 호출하거나 `app.use()`를 호출할 수 있는 다른 설정 함수보다 먼저 이루어져야 합니다. 이는 기반 플랫폼(예: Express 또는 Fastify)의 작동 방식 때문이며, 미들웨어/경로가 정의되는 순서가 중요합니다. `helmet` 또는 `cors`와 같은 미들웨어를 경로 정의 후에 사용하면, 해당 미들웨어는 해당 경로에는 적용되지 않고 미들웨어 이후에 정의된 경로에만 적용됩니다.

#### Express와 함께 사용 (기본값)

먼저 필요한 패키지를 설치합니다.

```bash
$ npm i --save helmet
```

설치가 완료되면 이를 전역 미들웨어로 적용합니다.

```typescript
import helmet from 'helmet';
// 초기화 파일 어딘가에
app.use(helmet());
```

> warning **경고** `helmet`, `@apollo/server` (4.x), 그리고 [Apollo Sandbox](https://nestjs.dokidocs.dev/graphql/quick-start#apollo-sandbox)를 함께 사용할 때, Apollo Sandbox에서 [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) 문제가 발생할 수 있습니다. 이 문제를 해결하려면 아래와 같이 CSP를 구성하세요:
>
> ```typescript
> app.use(helmet({
>   crossOriginEmbedderPolicy: false,
>   contentSecurityPolicy: {
>     directives: {
>       imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>       manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
>       frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
>     },
>   },
> }));

#### Fastify와 함께 사용

`FastifyAdapter`를 사용한다면, [@fastify/helmet](https://github.com/fastify/fastify-helmet) 패키지를 설치하세요:

```bash
$ npm i --save @fastify/helmet
```

[fastify-helmet](https://github.com/fastify/fastify-helmet)는 미들웨어가 아닌 [Fastify 플러그인](https://www.fastify.io/docs/latest/Reference/Plugins/)으로 사용해야 합니다. 즉, `app.register()`를 사용합니다:

```typescript
import helmet from '@fastify/helmet'
// 초기화 파일 어딘가에
await app.register(helmet)
```

> warning **경고** `apollo-server-fastify`와 `@fastify/helmet`를 함께 사용할 때, GraphQL playground에서 [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) 문제가 발생할 수 있으며, 이 충돌을 해결하려면 아래와 같이 CSP를 구성하세요:
>
> ```typescript
> await app.register(fastifyHelmet, {
>    contentSecurityPolicy: {
>      directives: {
>        defaultSrc: [`'self'`, 'unpkg.com'],
>        styleSrc: [
>          `'self'`,
>          `'unsafe-inline'`,
>          'cdn.jsdelivr.net',
>          'fonts.googleapis.com',
>          'unpkg.com',
>        ],
>        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
>        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
>        scriptSrc: [
>          `'self'`,
>          `https: 'unsafe-inline'`,
>          `cdn.jsdelivr.net`,
>          `'unsafe-eval'`,
>        ],
>      },
>    },
>  });
>
> // CSP를 전혀 사용하지 않으려면 다음을 사용하세요:
> await app.register(fastifyHelmet, {
>   contentSecurityPolicy: false,
> });
> ```