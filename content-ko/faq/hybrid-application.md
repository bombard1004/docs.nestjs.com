### 하이브리드 애플리케이션

하이브리드 애플리케이션은 두 개 이상의 서로 다른 소스에서 오는 요청을 수신하는 애플리케이션입니다. 이는 HTTP 서버와 마이크로서비스 리스너를 결합하거나 단순히 여러 개의 다른 마이크로서비스 리스너를 결합할 수 있습니다. 기본 `createMicroservice` 메서드는 여러 서버를 허용하지 않으므로 이 경우 각 마이크로서비스는 수동으로 생성하고 시작해야 합니다. 이를 위해 `INestApplication` 인스턴스는 `connectMicroservice()` 메서드를 통해 `INestMicroservice` 인스턴스와 연결될 수 있습니다.

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
});

await app.startAllMicroservices();
await app.listen(3001);
```

> info **힌트** `app.listen(port)` 메서드는 지정된 주소에서 HTTP 서버를 시작합니다. 애플리케이션이 HTTP 요청을 처리하지 않는다면 대신 `app.init()` 메서드를 사용해야 합니다.

여러 마이크로서비스 인스턴스를 연결하려면 각 마이크로서비스에 대해 `connectMicroservice()` 호출을 실행합니다.

```typescript
const app = await NestFactory.create(AppModule);
// microservice #1
const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: {
    port: 3001,
  },
});
// microservice #2
const microserviceRedis = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});

await app.startAllMicroservices();
await app.listen(3001);
```

여러 마이크로서비스를 가진 하이브리드 애플리케이션에서 `@MessagePattern()`을 하나의 특정 전송 전략(예: MQTT)에만 바인딩하려면, 내장된 모든 전송 전략이 정의된 열거형인 `Transport` 타입의 두 번째 인자를 전달할 수 있습니다.

```typescript
@@filename()
@MessagePattern('time.us.*', Transport.NATS)
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(@Payload() data: number[]) {
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*', Transport.NATS)
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@Bind(Payload(), Ctx())
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(data, context) {
  return new Date().toLocaleTimeString(...);
}
```

> info **힌트** `@Payload()`, `@Ctx()`, `Transport` 및 `NatsContext`는 `@nestjs/microservices`에서 가져옵니다.

#### 설정 공유

기본적으로 하이브리드 애플리케이션은 메인(HTTP 기반) 애플리케이션에 설정된 전역 파이프, 인터셉터, 가드 및 필터를 상속받지 않습니다. 메인 애플리케이션으로부터 이러한 설정 속성을 상속받으려면, `connectMicroservice()` 호출의 두 번째 인자(선택적 옵션 객체)에 `inheritAppConfig` 속성을 다음과 같이 설정하십시오.

```typescript
const microservice = app.connectMicroservice<MicroserviceOptions>(
  {
    transport: Transport.TCP,
  },
  { inheritAppConfig: true },
);
```
