### Keep-alive 연결

기본적으로 NestJS의 HTTP 어댑터는 응답이 완료될 때까지 기다린 후에 애플리케이션을 종료합니다. 하지만 때로는 이 동작이 바람직하지 않거나 예상치 못한 상황을 초래할 수 있습니다. `Connection: Keep-Alive` 헤더를 사용하여 오랫동안 유지되는 요청이 있을 수 있습니다.

요청이 종료될 때까지 기다리지 않고 항상 애플리케이션을 종료하려는 이러한 시나리오에서는 NestJS 애플리케이션을 생성할 때 `forceCloseConnections` 옵션을 활성화할 수 있습니다.

> warning **팁** 대부분의 사용자는 이 옵션을 활성화할 필요가 없을 것입니다. 하지만 이 옵션이 필요한 증상은 예상할 때 애플리케이션이 종료되지 않는다는 것입니다. 일반적으로 `app.enableShutdownHooks()`가 활성화되어 있고 애플리케이션이 재시작/종료되지 않는 것을 확인할 때 발생합니다. 아마도 `--watch`와 함께 개발 중에 NestJS 애플리케이션을 실행할 때 가장 흔하게 나타날 것입니다.

#### 사용법

`main.ts` 파일에서 NestJS 애플리케이션을 생성할 때 이 옵션을 활성화하십시오:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```
