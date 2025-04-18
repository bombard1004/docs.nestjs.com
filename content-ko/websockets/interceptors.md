### 인터셉터

[일반 인터셉터](/interceptors)와 웹 소켓 인터셉터 사이에는 차이가 없습니다. 다음 예제에서는 수동으로 인스턴스화된 메서드 스코프 인터셉터를 사용합니다. HTTP 기반 애플리케이션과 마찬가지로 게이트웨이 스코프 인터셉터(즉, 게이트웨이 클래스에 `@UseInterceptors()` 데코레이터 접두사 사용)도 사용할 수 있습니다.

```typescript
@@filename()
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
