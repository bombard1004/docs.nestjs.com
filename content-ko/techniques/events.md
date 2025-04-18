### 이벤트

[@nestjs/event-emitter](https://www.npmjs.com/package/@nestjs/event-emitter) 패키지(`@nestjs/event-emitter`)는 간단한 옵저버 구현을 제공하여 애플리케이션에서 발생하는 다양한 이벤트를 구독하고 수신할 수 있도록 합니다. 이벤트는 애플리케이션의 다양한 측면을 분리하는 훌륭한 방법입니다. 왜냐하면 하나의 이벤트는 서로 의존하지 않는 여러 개의 리스너를 가질 수 있기 때문입니다.

`EventEmitterModule`은 내부적으로 [eventemitter2](https://github.com/EventEmitter2/EventEmitter2) 패키지를 사용합니다.

#### 시작하기

먼저 필요한 패키지를 설치합니다:

```shell
$ npm i --save @nestjs/event-emitter
```

설치가 완료되면, `EventEmitterModule`을 루트 `AppModule`로 임포트하고 아래와 같이 `forRoot()` 정적 메서드를 실행합니다:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
```

`.forRoot()` 호출은 이벤트 이미터를 초기화하고 앱 내에 존재하는 모든 선언적 이벤트 리스너를 등록합니다. 등록은 `onApplicationBootstrap` 라이프사이클 훅이 발생할 때 이루어지며, 모든 모듈이 로드되고 예약된 작업을 모두 선언했는지 확인합니다.

기반이 되는 `EventEmitter` 인스턴스를 구성하려면, 아래와 같이 `.forRoot()` 메서드에 구성 객체를 전달합니다:

```typescript
EventEmitterModule.forRoot({
  // 와일드카드를 사용하려면 `true`로 설정합니다.
  wildcard: false,
  // 네임스페이스를 구분하는 데 사용되는 구분자입니다.
  delimiter: '.',
  // newListener 이벤트를 발생시키려면 `true`로 설정합니다.
  newListener: false,
  // removeListener 이벤트를 발생시키려면 `true`로 설정합니다.
  removeListener: false,
  // 이벤트에 할당할 수 있는 최대 리스너 수입니다.
  maxListeners: 10,
  // 할당된 리스너 수가 최대치를 초과할 때 메모리 누수 메시지에 이벤트 이름을 표시합니다.
  verboseMemoryLeak: false,
  // error 이벤트가 발생했지만 리스너가 없는 경우 uncaughtException을 발생시키지 않습니다.
  ignoreErrors: false,
});
```

#### 이벤트 디스패치하기

이벤트를 디스패치(즉, 발생)하려면, 먼저 표준 생성자 주입을 사용하여 `EventEmitter2`를 주입합니다:

```typescript
constructor(private eventEmitter: EventEmitter2) {}
```

> info **힌트** `@nestjs/event-emitter` 패키지에서 `EventEmitter2`를 임포트하세요.

그런 다음 클래스에서 다음과 같이 사용합니다:

```typescript
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
```

#### 이벤트 수신하기

이벤트 리스너를 선언하려면, 실행할 코드가 포함된 메서드 정의 앞에 `@OnEvent()` 데코레이터를 사용하여 메서드를 데코레이트합니다:

```typescript
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // "OrderCreatedEvent" 이벤트를 처리하고 가공합니다.
}
```

> warning **경고** 이벤트 구독자는 요청 스코프(request-scoped)가 될 수 없습니다.

첫 번째 인자는 단순 이벤트 이미터의 경우 `string` 또는 `symbol`이 될 수 있으며, 와일드카드 이미터의 경우 `string | symbol | Array<string | symbol>`이 될 수 있습니다.

두 번째 인자(선택 사항)는 다음과 같은 리스너 옵션 객체입니다:

```typescript
export type OnEventOptions = OnOptions & {
  /**
   * "true"인 경우, 제공된 리스너를 리스너 배열의 앞에 추가합니다 (뒤에 추가하는 대신).
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * "true"인 경우, onEvent 콜백은 이벤트를 처리하는 동안 오류를 발생시키지 않습니다. 그렇지 않으면 "false"인 경우 오류를 발생시킵니다.
   *
   * @default true
   */
  suppressErrors?: boolean;
};
```

> info **힌트** [`eventemitter2`](https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean)에서 `OnOptions` 옵션 객체에 대해 더 자세히 알아보세요.

```typescript
@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // "OrderCreatedEvent" 이벤트를 처리하고 가공합니다.
}
```

네임스페이스/와일드카드를 사용하려면, `EventEmitterModule#forRoot()` 메서드에 `wildcard` 옵션을 전달합니다. 네임스페이스/와일드카드가 활성화되면 이벤트는 구분자(delimiter)로 구분된 문자열(`foo.bar`) 또는 배열(`['foo', 'bar']`)이 될 수 있습니다. 구분자는 구성 속성(`delimiter`)으로 구성할 수도 있습니다. 네임스페이스 기능이 활성화되면 와일드카드를 사용하여 이벤트를 구독할 수 있습니다:

```typescript
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // 이벤트를 처리하고 가공합니다.
}
```

이러한 와일드카드는 한 블록에만 적용된다는 점에 유의하십시오. 인자 `order.*`는 `order.created` 및 `order.shipped`와 같은 이벤트에는 일치하지만 `order.delayed.out_of_stock`에는 일치하지 않습니다. 이러한 이벤트를 수신하려면, `EventEmitter2` [문서](https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards)에 설명된 `다단계 와일드카드` 패턴 (즉, `**`)을 사용하십시오.

이 패턴을 사용하면 예를 들어 모든 이벤트를 포착하는 이벤트 리스너를 만들 수 있습니다.

```typescript
@OnEvent('**')
handleEverything(payload: any) {
  // 이벤트를 처리하고 가공합니다.
}
```

> info **힌트** `EventEmitter2` 클래스는 `waitFor` 및 `onAny`와 같은 이벤트 상호작용에 유용한 몇 가지 메서드를 제공합니다. 이에 대해 [여기](https://github.com/EventEmitter2/EventEmitter2)에서 더 자세히 알아볼 수 있습니다.

#### 이벤트 손실 방지

모듈 생성자 또는 `onModuleInit` 메서드와 같이 `onApplicationBootstrap` 라이프사이클 훅이 완료되기 전이나 그 도중에 트리거된 이벤트는 `EventSubscribersLoader`가 리스너 설정을 완료하지 않았기 때문에 누락될 수 있습니다.

이 문제를 방지하려면, 모든 리스너가 등록되면 해결되는 Promise를 반환하는 `EventEmitterReadinessWatcher`의 `waitUntilReady` 메서드를 사용할 수 있습니다. 이 메서드는 모듈의 `onApplicationBootstrap` 라이프사이클 훅에서 호출되어 모든 이벤트가 제대로 포착되도록 할 수 있습니다.

```typescript
await this.eventEmitterReadinessWatcher.waitUntilReady();
await this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({ orderId: 1, payload: {} }),
);
```

> info **참고** 이것은 `onApplicationBootstrap` 라이프사이클 훅이 완료되기 전에 발생하는 이벤트에만 필요합니다.

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/30-event-emitter)에서 확인할 수 있습니다.