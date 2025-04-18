### 파이프

[일반 파이프](/pipes)와 마이크로서비스 파이프 사이에는 근본적인 차이가 없습니다. 유일한 차이점은 `HttpException`을 throw하는 대신 `RpcException`을 사용해야 한다는 것입니다.

> info **팁** `@nestjs/microservices` 패키지에서 `RpcException` 클래스가 노출됩니다.

#### 파이프 바인딩

다음 예제는 수동으로 인스턴스화된 메서드 스코프 파이프를 사용합니다. HTTP 기반 애플리케이션과 마찬가지로 컨트롤러 스코프 파이프(예: 컨트롤러 클래스 앞에 `@UsePipes()` 데코레이터를 붙이는 것)도 사용할 수 있습니다.

```typescript
@@filename()
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new RpcException(errors) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new RpcException(errors) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```