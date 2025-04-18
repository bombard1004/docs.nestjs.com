### 전역 접두사

HTTP 애플리케이션에 등록된 **모든 라우트**에 대한 접두사를 설정하려면 `INestApplication` 인스턴스의 `setGlobalPrefix()` 메서드를 사용하십시오.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
```

다음 구문을 사용하여 전역 접두사에서 라우트를 제외할 수 있습니다:

```typescript
app.setGlobalPrefix('v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});
```

또는 라우트를 문자열로 지정할 수 있습니다(모든 요청 메서드에 적용됨):

```typescript
app.setGlobalPrefix('v1', { exclude: ['cats'] });
```

> info **힌트** `path` 속성은 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) 패키지를 사용하여 와일드카드 매개변수를 지원합니다. 참고: 와일드카드 별표 `*`는 허용하지 않습니다. 대신 매개변수(`:param`) 또는 명명된 와일드카드(`*splat`)를 사용해야 합니다.