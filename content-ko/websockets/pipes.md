```markdown
### 파이프

[일반 파이프](/pipes)와 웹 소켓 파이프 간에는 근본적인 차이가 없습니다. 유일한 차이점은 `HttpException`을 던지는 대신 `WsException`을 사용해야 한다는 것입니다. 또한 모든 파이프는 `data` 매개변수에만 적용됩니다 (왜냐하면 `client` 인스턴스를 유효성 검사하거나 변환하는 것은 쓸모없기 때문입니다).

> info **힌트** `WsException` 클래스는 `@nestjs/websockets` 패키지에서 노출됩니다.

#### 파이프 바인딩

다음 예제는 수동으로 인스턴스화된 메소드 스코프 파이프를 사용합니다. HTTP 기반 애플리케이션과 마찬가지로 게이트웨이 스코프 파이프도 사용할 수 있습니다 (예: 게이트웨이 클래스에 `@UsePipes()` 데코레이터를 접두사로 붙입니다).

```typescript
@@filename()
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }))
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }))
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
```