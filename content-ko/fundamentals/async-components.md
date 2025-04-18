### 비동기 프로바이더

때때로 애플리케이션은 하나 이상의 **비동기 작업**이 완료될 때까지 시작을 지연해야 합니다. 예를 들어, 데이터베이스 연결이 설정될 때까지 요청 수락을 시작하고 싶지 않을 수 있습니다. 비동기 프로바이더를 사용하여 이를 달성할 수 있습니다.

이를 위한 문법은 `useFactory` 문법과 함께 `async/await`를 사용하는 것입니다. 팩토리는 `Promise`를 반환하며, 팩토리 함수는 비동기 작업을 `await`할 수 있습니다. Nest는 이러한 프로바이더에 의존하는(주입하는) 클래스를 인스턴스화하기 전에 프로미스가 해결될 때까지 기다립니다.

```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
```

> info **팁** 커스텀 프로바이더 문법에 대해 더 알아보려면 [여기](/fundamentals/custom-providers)를 참고하세요.

#### 주입

비동기 프로바이더는 다른 프로바이더와 마찬가지로 토큰에 의해 다른 컴포넌트에 주입됩니다. 위 예시에서는 `@Inject('ASYNC_CONNECTION')` 구문을 사용합니다.

#### 예시

[TypeORM 레시피](/recipes/sql-typeorm)에 비동기 프로바이더에 대한 더 실질적인 예시가 있습니다.
