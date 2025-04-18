### CORS

Cross-origin resource sharing (CORS)는 다른 도메인에서 리소스를 요청할 수 있도록 하는 메커니즘입니다. 내부적으로 Nest는 기본 플랫폼에 따라 Express의 [cors](https://github.com/expressjs/cors) 또는 Fastify의 [@fastify/fastify-cors](https://github.com/fastify/fastify-cors) 패키지를 사용합니다. 이 패키지들은 요구사항에 따라 사용자 정의할 수 있는 다양한 옵션을 제공합니다.

#### 시작하기

CORS를 활성화하려면 Nest 애플리케이션 객체에서 `enableCors()` 메서드를 호출합니다.

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(process.env.PORT ?? 3000);
```

`enableCors()` 메서드는 선택적 설정 객체 인수를 받습니다. 이 객체의 사용 가능한 속성은 공식 [CORS](https://github.com/expressjs/cors#configuration-options) 문서에 설명되어 있습니다. 다른 방법으로는 요청에 따라 비동기적으로 (실시간으로) 설정 객체를 정의할 수 있는 [콜백 함수](https://github.com/expressjs/cors#configuring-cors-asynchronously)를 전달하는 것입니다.

대신, `create()` 메서드의 옵션 객체를 통해 CORS를 활성화할 수 있습니다. 기본 설정으로 CORS를 활성화하려면 `cors` 속성을 `true`로 설정하십시오.
또는 동작을 사용자 정의하려면 [CORS 설정 객체](https://github.com/expressjs/cors#configuration-options) 또는 [콜백 함수](https://github.com/expressjs/cors#configuring-cors-asynchronously)를 `cors` 속성 값으로 전달하십시오.

```typescript
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(process.env.PORT ?? 3000);
```