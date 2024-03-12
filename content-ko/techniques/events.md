### Events

[Event Emitter](https://www.npmjs.com/package/@nestjs/event-emitter) 패키지(`@nestjs/event-emitter`)는 다양한 옵저버 구현을 제공하여 애플리케이션에서 발생하는 여러 이벤트를 구독하고 수신할 수 있습니다. 이벤트는 단일 이벤트에 여러 개의 독립적인 리스너가 있을 수 있기 때문에 애플리케이션의 다양한 측면을 분리하는 데 유용합니다.

`EventEmitterModule`은 내부적으로 [eventemitter2](https://github.com/EventEmitter2/EventEmitter2) 패키지를 사용합니다.

#### Getting started

먼저 필요한 패키지를 설치합니다.

```shell
$ npm i --save @nestjs/event-emitter
```

설치가 완료되면 `EventEmitterModule`을 루트 `AppModule`로 임포트하고 아래와 같이 `forRoot()` 스태틱 메서드를 실행합니다.

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

`.forRoot()` 호출은 이벤트 이미터를 초기화하고 앱 내에 선언되어 있는 모든 이벤트 리스너를 등록합니다. 등록은 `onApplicationBootstrap` 라이프사이클 후크가 발생할 때 이루어지므로 모든 모듈이 로드되고 스케줄 작업을 선언함을 보장합니다.

기본 `EventEmitter` 인스턴스를 구성하려면 설정 객체를 `.forRoot()` 메서드에 전달하면 됩니다.

```typescript
EventEmitterModule.forRoot({
  // set this to `true` to use wildcards
  wildcard: false,
  // the delimiter used to segment namespaces
  delimiter: '.',
  // set this to `true` if you want to emit the newListener event
  newListener: false,
  // set this to `true` if you want to emit the removeListener event
  removeListener: false,
  // the maximum amount of listeners that can be assigned to an event
  maxListeners: 10,
  // show event name in memory leak message when more than maximum amount of listeners is assigned
  verboseMemoryLeak: false,
  // disable throwing uncaughtException if an error event is emitted and it has no listeners
  ignoreErrors: false,
});
```

#### Dispatching Events

이벤트를 발신하려면 먼저 `EventEmitter2`를 표준 생성자 주입을 사용하여 주입합니다.

```typescript
constructor(private eventEmitter: EventEmitter2) {}
```

> info **힌트** `EventEmitter2`는 `@nestjs/event-emitter` 패키지에서 임포트합니다.

그런 다음 클래스에서 다음과 같이 사용합니다.

```typescript
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
```

#### Listening to Events

이벤트 리스너를 선언하려면 메서드 앞에 `@OnEvent()` 데코레이터를 추가하여 코드를 실행할 메서드를 데코레이팅합니다.

```typescript
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

> warning **경고** 이벤트 구독자는 요청 범위(request-scoped)가 될 수 없습니다.

첫 번째 인수는 단순 이벤트 이미터의 경우 `string` 또는 `symbol`이고 와일드카드 이미터의 경우 `string | symbol | Array<string | symbol>`입니다.

두 번째 인수(선택 사항)는 리스너 옵션 객체이고 다음과 같습니다.

```typescript
export type OnEventOptions = OnOptions & {
  /**
   * If "true", prepends (instead of append) the given listener to the array of listeners.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * If "true", the onEvent callback will not throw an error while handling the event. Otherwise, if "false" it will throw an error.
   *
   * @default true
   */
  suppressErrors?: boolean;
};
```

> info **힌트** `OnOptions` 옵션 객체에 대한 자세한 내용은 [`eventemitter2`](https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean)를 참조하세요.

```typescript
@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
```

네임스페이스/와일드카드를 사용하려면 `EventEmitterModule#forRoot()` 메서드에 `wildcard` 옵션을 전달합니다. 네임스페이스/와일드카드가 활성화되면 이벤트는 구분자로 구분된 문자열(`foo.bar`) 또는 배열(`['foo', 'bar']`)일 수 있습니다. 구분 기호도 옵션의 프로퍼티(`delimiter`)로 설정할 수 있습니다. 네임스페이스 기능을 사용하면 와일드카드를 사용하여 이벤트를 구독할 수 있습니다.

```typescript
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // handle and process an event
}
```

이러한 와일드카드는 한 블록에만 적용됩니다. 인수 `order.*`는 예를 들어 `order.created`와 `order.shipped` 이벤트와 일치하지만 `order.delayed.out_of_stock`과는 일치하지 않습니다. 이러한 이벤트를 수신하려면 `EventEmitter2` [문서](https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards)에 설명된 `multilevel wildcard` 패턴(즉, `**`)을 사용하세요.

이 패턴을 사용하면 모든 이벤트를 캡처하는 이벤트 리스너를 만들 수 있습니다.

```typescript
@OnEvent('**')
handleEverything(payload: any) {
  // handle and process an event
}
```

> info **힌트** `EventEmitter2` 클래스에는 `waitFor`와 `onAny`와 같이 이벤트와 상호 작용하는 데 유용한 여러 메서드가 있습니다. 자세한 내용은 [여기](https://github.com/EventEmitter2/EventEmitter2)를 참조하세요.

#### Example

예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/30-event-emitter)에서 확인할 수 있습니다.
