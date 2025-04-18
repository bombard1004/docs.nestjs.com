### HTTP 어댑터

간혹 Nest 애플리케이션 컨텍스트 내에서 또는 외부에서 기본 HTTP 서버에 접근해야 할 수 있습니다.

모든 네이티브 (플랫폼별) HTTP 서버/라이브러리 (예: Express 및 Fastify) 인스턴스는 **어댑터**로 래핑됩니다. 어댑터는 애플리케이션 컨텍스트에서 검색하거나 다른 프로바이더에 주입할 수 있는 전역적으로 사용 가능한 프로바이더로 등록됩니다.

#### 애플리케이션 컨텍스트 외부 전략

애플리케이션 컨텍스트 외부에서 `HttpAdapter`에 대한 참조를 얻으려면 `getHttpAdapter()` 메서드를 호출합니다.

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
const httpAdapter = app.getHttpAdapter();
```

#### 주입 가능한 방식으로

애플리케이션 컨텍스트 내에서 `HttpAdapterHost`에 대한 참조를 얻으려면, 다른 기존 프로바이더와 동일한 기술 (예: 생성자 주입)을 사용하여 주입합니다.

```typescript
@@filename()
export class CatsService {
  constructor(private adapterHost: HttpAdapterHost) {}
}
@@switch
@Dependencies(HttpAdapterHost)
export class CatsService {
  constructor(adapterHost) {
    this.adapterHost = adapterHost;
  }
}
```

> info **힌트** `HttpAdapterHost`는 `@nestjs/core` 패키지에서 임포트됩니다.

`HttpAdapterHost`는 실제 `HttpAdapter`가 **아닙니다**. 실제 `HttpAdapter` 인스턴스를 얻으려면 `httpAdapter` 속성에 접근하면 됩니다.

```typescript
const adapterHost = app.get(HttpAdapterHost);
const httpAdapter = adapterHost.httpAdapter;
```

`httpAdapter`는 기본 프레임워크에서 사용하는 HTTP 어댑터의 실제 인스턴스입니다. 이는 `ExpressAdapter` 또는 `FastifyAdapter`의 인스턴스입니다 (두 클래스 모두 `AbstractHttpAdapter`를 확장합니다).

어댑터 객체는 HTTP 서버와 상호 작용하는 데 유용한 여러 메서드를 노출합니다. 그러나 라이브러리 인스턴스 (예: Express 인스턴스)에 직접 접근하려면 `getInstance()` 메서드를 호출합니다.

```typescript
const instance = httpAdapter.getInstance();
```

#### 리스닝 이벤트

서버가 들어오는 요청을 수신하기 시작할 때 액션을 실행하려면 아래에 설명된 대로 `listen$` 스트림을 구독할 수 있습니다.

```typescript
this.httpAdapterHost.listen$.subscribe(() =>
  console.log('HTTP server is listening'),
);
```

또한 `HttpAdapterHost`는 서버가 현재 활성화되어 수신 대기 중인지 나타내는 `listening` 불리언 속성을 제공합니다.

```typescript
if (this.httpAdapterHost.listening) {
  console.log('HTTP server is listening');
}
```