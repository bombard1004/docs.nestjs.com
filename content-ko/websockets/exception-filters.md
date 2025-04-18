### 예외 필터

HTTP [예외 필터](/exception-filters) 레이어와 해당하는 웹 소켓 레이어의 유일한 차이점은 `HttpException`을 던지는 대신 `WsException`을 사용해야 한다는 것입니다.

```typescript
throw new WsException('Invalid credentials.');
```

> info **힌트** `WsException` 클래스는 `@nestjs/websockets` 패키지에서 임포트됩니다.

위 예시를 통해 Nest는 발생된 예외를 처리하고 다음과 같은 구조로 `exception` 메시지를 보냅니다.

```typescript
{
  status: 'error',
  message: 'Invalid credentials.'
}
```

#### 필터

웹 소켓 예외 필터는 HTTP 예외 필터와 동일하게 작동합니다. 다음 예시는 수동으로 인스턴스화된 메서드 스코프 필터를 사용합니다. HTTP 기반 애플리케이션과 마찬가지로, 게이트웨이 스코프 필터(즉, 게이트웨이 클래스 앞에 `@UseFilters()` 데코레이터를 붙이는 방식)를 사용할 수도 있습니다.

```typescript
@UseFilters(new WsExceptionFilter())
@SubscribeMessage('events')
onEvent(client, data: any): WsResponse<any> {
  const event = 'events';
  return { event, data };
}
```

#### 상속

일반적으로 애플리케이션 요구사항을 충족하기 위해 완전히 사용자 정의된 예외 필터를 생성합니다. 하지만 단순히 **핵심 예외 필터**를 확장하고 특정 요인에 따라 동작을 재정의하고 싶은 사용 사례가 있을 수 있습니다.

예외 처리를 기본 필터에 위임하려면 `BaseWsExceptionFilter`를 확장하고 상속된 `catch()` 메서드를 호출해야 합니다.

```typescript
@@filename()
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
```

위의 구현은 접근 방식을 보여주는 껍데기에 불과합니다. 확장된 예외 필터의 구현에는 맞춤형 **비즈니스 로직**(예: 다양한 조건 처리)이 포함될 것입니다.