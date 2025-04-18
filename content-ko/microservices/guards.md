### 가드

마이크로서비스 가드와 [일반 HTTP 애플리케이션 가드](/guards) 사이에는 근본적인 차이가 없습니다.
유일한 차이점은 `HttpException`을 던지는 대신 `RpcException`을 사용해야 한다는 것입니다.

> info **팁** `RpcException` 클래스는 `@nestjs/microservices` 패키지에서 노출됩니다.

#### 가드 바인딩

다음 예제는 메서드 범위 가드를 사용합니다. HTTP 기반 애플리케이션과 마찬가지로 컨트롤러 범위 가드도 사용할 수 있습니다(즉, 컨트롤러 클래스에 `@UseGuards()` 데코레이터를 접두사로 붙입니다).

```typescript
@@filename()
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```
