### 사용자 지정 트랜스포터

Nest는 다양한 **트랜스포터**를 기본으로 제공하며, 개발자가 새로운 사용자 지정 전송 전략을 구축할 수 있는 API도 제공합니다. 트랜스포터를 사용하면 플러그 가능한 통신 레이어와 매우 간단한 애플리케이션 수준의 메시지 프로토콜을 사용하여 네트워크를 통해 구성 요소를 연결할 수 있습니다 ([전체 문서](https://dev.to/nestjs/integrate-nestjs-with-external-services-using-microservice-transporters-part-1-p3) 읽기).

> info **힌트** Nest로 마이크로서비스를 구축한다고 해서 반드시 `@nestjs/microservices` 패키지를 사용해야 하는 것은 아닙니다. 예를 들어, 외부 서비스(예: 다른 언어로 작성된 다른 마이크로서비스)와 통신하려는 경우 `@nestjs/microservice` 라이브러리가 제공하는 모든 기능이 필요하지 않을 수 있습니다.
> 사실, 선언적으로 구독자를 정의할 수 있는 데코레이터(`@EventPattern` 또는 `@MessagePattern`)가 필요하지 않다면, [독립 실행형 애플리케이션](/application-context)을 실행하고 수동으로 연결을 유지/채널을 구독하는 것만으로도 대부분의 사용 사례에 충분하며 더 많은 유연성을 제공할 것입니다.

사용자 지정 트랜스포터를 사용하면 모든 메시징 시스템/프로토콜(Google Cloud Pub/Sub, Amazon Kinesis 등 포함)을 통합하거나 기존 시스템을 확장하여 추가 기능(예: MQTT의 [QoS](https://github.com/mqttjs/MQTT.js/blob/master/README.md#qos))을 추가할 수 있습니다.

> info **힌트** Nest 마이크로서비스가 어떻게 작동하는지, 그리고 기존 트랜스포터의 기능을 어떻게 확장할 수 있는지 더 잘 이해하려면, [NestJS Microservices in Action](https://dev.to/johnbiundo/series/4724) 및 [Advanced NestJS Microservices](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) 문서 시리즈를 읽는 것을 권장합니다.

#### 전략 생성하기

먼저 사용자 지정 트랜스포터를 나타내는 클래스를 정의해 보겠습니다.

```typescript
import { CustomTransportStrategy, Server } from '@nestjs/microservices';

class GoogleCloudPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  /**
   * "app.listen()"을 실행할 때 트리거됩니다.
   */
  listen(callback: () => void) {
    callback();
  }

  /**
   * 애플리케이션 종료 시 트리거됩니다.
   */
  close() {}

  /**
   * 트랜스포터 사용자가 이벤트 리스너를 등록할 수 있도록
   * 하지 않으려면 이 메서드를 무시할 수 있습니다. 대부분의 사용자 지정 구현은
   * 이것이 필요하지 않습니다.
   */
  on(event: string, callback: Function) {
    throw new Error('Method not implemented.');
  }

  /**
   * 트랜스포터 사용자가 기본 네이티브 서버를 검색할 수 있도록
   * 하지 않으려면 이 메서드를 무시할 수 있습니다. 대부분의 사용자 지정 구현은
   * 이것이 필요하지 않습니다.
   */
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

> warning **경고** 이 장에서는 트랜스포터별 기술적인 세부 사항을 자세히 다루어야 하므로, 완전한 기능을 갖춘 Google Cloud Pub/Sub 서버를 구현하지는 않는다는 점에 유의하십시오.

위의 예에서 우리는 `GoogleCloudPubSubServer` 클래스를 선언하고 `CustomTransportStrategy` 인터페이스에 의해 강제되는 `listen()` 및 `close()` 메서드를 제공했습니다. 또한 우리 클래스는 Nest 런타임이 메시지 핸들러를 등록하는 데 사용되는 메서드와 같은 몇 가지 유용한 메서드를 제공하는 `@nestjs/microservices` 패키지에서 가져온 `Server` 클래스를 확장합니다. 또는 기존 전송 전략의 기능을 확장하려는 경우, 예를 들어 `ServerRedis`와 같은 해당 서버 클래스를 확장할 수 있습니다. 관례적으로 우리는 클래스 이름에 `"Server"` 접미사를 추가했습니다. 이는 메시지/이벤트를 구독(필요한 경우 응답)하는 역할을 할 것이기 때문입니다.

이것이 갖춰지면, 이제 내장 트랜스포터를 사용하는 대신 다음과 같이 사용자 지정 전략을 사용할 수 있습니다.

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    strategy: new GoogleCloudPubSubServer(),
  },
);
```

기본적으로 일반 트랜스포터 옵션 객체에 `transport` 및 `options` 속성을 전달하는 대신, 단일 속성인 `strategy`를 전달하고 그 값은 사용자 지정 트랜스포터 클래스의 인스턴스입니다.

`GoogleCloudPubSubServer` 클래스로 돌아가서, 실제 애플리케이션에서는 메시지 브로커/외부 서비스와의 연결을 설정하고 `listen()` 메서드에서 구독자를 등록/특정 채널을 수신(그리고 `close()` 해체 메서드에서 구독 해제 및 연결 종료)할 것입니다. 하지만 이는 Nest 마이크로서비스가 서로 통신하는 방식에 대한 충분한 이해가 필요하므로, 이 [문서 시리즈](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l)를 읽어보는 것을 권장합니다. 대신 이 장에서는 `Server` 클래스가 제공하는 기능과 이를 활용하여 사용자 지정 전략을 구축하는 방법에 초점을 맞출 것입니다.

예를 들어, 애플리케이션의 어딘가에 다음과 같은 메시지 핸들러가 정의되어 있다고 가정해 봅시다.

```typescript
@MessagePattern('echo')
echo(@Payload() data: object) {
  return data;
}
```

이 메시지 핸들러는 Nest 런타임에 의해 자동으로 등록됩니다. `Server` 클래스를 사용하면 등록된 메시지 패턴을 확인하고, 또한 해당 패턴에 할당된 실제 메서드에 접근하고 실행할 수 있습니다.
이를 테스트하기 위해 `callback` 함수가 호출되기 전에 `listen()` 메서드 내부에 간단한 `console.log`를 추가해 봅시다.

```typescript
listen(callback: () => void) {
  console.log(this.messageHandlers);
  callback();
}
```

애플리케이션을 다시 시작하면 터미널에 다음과 같은 로그가 표시될 것입니다.

```typescript
Map { 'echo' => [AsyncFunction] { isEventHandler: false } }
```

> info **힌트** 만약 `@EventPattern` 데코레이터를 사용했다면, 동일한 출력이 표시되겠지만 `isEventHandler` 속성은 `true`로 설정될 것입니다.

보시다시피, `messageHandlers` 속성은 모든 메시지(및 이벤트) 핸들러의 `Map` 컬렉션이며, 패턴이 키로 사용됩니다. 이제 키(예: `"echo"`)를 사용하여 메시지 핸들러에 대한 참조를 얻을 수 있습니다.

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  console.log(await echoHandler('Hello world!'));
  callback();
}
```

임의의 문자열(`"Hello world!"`)을 인수로 전달하여 `echoHandler`를 실행하면 콘솔에 다음과 같이 표시될 것입니다.

```json
Hello world!
```

이는 우리의 메서드 핸들러가 제대로 실행되었음을 의미합니다.

[인터셉터](/interceptors)와 함께 `CustomTransportStrategy`를 사용할 때 핸들러는 RxJS 스트림으로 래핑됩니다. 이는 스트림의 기본 로직을 실행하기 위해 구독해야 함을 의미합니다(예: 인터셉터 실행 후 컨트롤러 로직으로 계속 진행).

이에 대한 예는 아래에서 볼 수 있습니다.

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  const streamOrResult = await echoHandler('Hello World');
  if (isObservable(streamOrResult)) {
    streamOrResult.subscribe();
  }
  callback();
}
```

#### 클라이언트 프록시

첫 번째 섹션에서 언급했듯이, 마이크로서비스를 생성하기 위해 반드시 `@nestjs/microservices` 패키지를 사용할 필요는 없지만, 그렇게 하기로 결정하고 사용자 지정 전략을 통합해야 하는 경우 "클라이언트" 클래스도 제공해야 합니다.

> info **힌트** 다시 말하지만, 모든 `@nestjs/microservices` 기능(예: 스트리밍)과 호환되는 완전한 기능을 갖춘 클라이언트 클래스를 구현하려면 프레임워크에서 사용하는 통신 기법에 대한 충분한 이해가 필요합니다. 자세한 내용은 이 [문서](https://dev.to/nestjs/part-4-basic-client-component-16f9)를 확인하세요.

외부 서비스와 통신/메시지(또는 이벤트)를 방출 및 게시하려면 라이브러리별 SDK 패키지를 사용하거나, 다음과 같이 `ClientProxy`를 확장하는 사용자 지정 클라이언트 클래스를 구현할 수 있습니다.

```typescript
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {}
  async close() {}
  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {}
  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {}
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

> warning **경고** 이 장에서는 트랜스포터별 기술적인 세부 사항을 자세히 다루어야 하므로, 완전한 기능을 갖춘 Google Cloud Pub/Sub 클라이언트를 구현하지는 않는다는 점에 유의하십시오.

보시다시피, `ClientProxy` 클래스는 연결 설정 및 종료, 메시지 게시(`publish`) 및 이벤트 게시(`dispatchEvent`)를 위한 여러 메서드를 제공하도록 요구합니다. 요청-응답 통신 스타일 지원이 필요하지 않다면 `publish()` 메서드를 비워둘 수 있습니다. 마찬가지로 이벤트 기반 통신을 지원할 필요가 없다면 `dispatchEvent()` 메서드를 건너뛰십시오.

이 메서드들이 언제, 무엇을 실행하는지 관찰하기 위해 다음과 같이 여러 개의 `console.log` 호출을 추가해 봅시다.

```typescript
class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {
    console.log('connect');
  }

  async close() {
    console.log('close');
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {
    console.log('message:', packet);

    // 실제 애플리케이션에서는 "callback" 함수는
    // 응답자로부터 다시 전송된 페이로드와 함께 실행되어야 합니다. 여기서는
    // 단순히 원래 전달했던 것과 동일한 "data"를 전달하여 (5초 지연 후)
    // 응답이 도착한 것을 시뮬레이션합니다.
    setTimeout(() => callback({ response: packet.data }), 5000);

    return () => console.log('teardown');
  }

  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

이것이 갖춰지면 `GoogleCloudPubSubClient` 클래스의 인스턴스를 생성하고 (이전 장에서 보셨을 수 있는) `send()` 메서드를 실행하여 반환된 옵저버블 스트림을 구독해 봅시다.

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .subscribe((response) => console.log(response));
```

이제 터미널에 다음과 같은 출력이 표시될 것입니다.

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
Hello world! // <-- 5초 후
```

`publish()` 메서드가 반환하는 "teardown" 메서드가 제대로 실행되는지 테스트하기 위해, 반환된 옵저버블 스트림에 timeout 연산자를 적용하고, 반환된 옵저버블 스트림에 timeout 연산자를 적용하고, `setTimeout`이 `callback` 함수를 호출하기 전에 먼저 발생하도록 2초로 설정해 보겠습니다.

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .pipe(timeout(2000))
  .subscribe(
    (response) => console.log(response),
    (error) => console.error(error.message),
  );
```

> info **힌트** `timeout` 연산자는 `rxjs/operators` 패키지에서 가져옵니다.

`timeout` 연산자를 적용하면 터미널 출력은 다음과 같을 것입니다.

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
teardown // <-- 해체
Timeout has occurred
```

(메시지를 보내는 대신) 이벤트를 디스패치하려면 `emit()` 메서드를 사용합니다.

```typescript
googlePubSubClient.emit('event', 'Hello world!');
```

그리고 콘솔에 표시될 내용은 다음과 같습니다.

```typescript
connect
event to dispatch:  { pattern: 'event', data: 'Hello world!' }
```

#### 메시지 직렬화

클라이언트 측 응답 직렬화와 관련된 사용자 지정 로직을 추가해야 하는 경우, `ClientProxy` 클래스 또는 해당 하위 클래스 중 하나를 확장하는 사용자 지정 클래스를 사용할 수 있습니다. 성공적인 요청을 수정하려면 `serializeResponse` 메서드를 재정의하고, 이 클라이언트를 통해 전달되는 오류를 수정하려면 `serializeError` 메서드를 재정의할 수 있습니다. 이 사용자 지정 클래스를 사용하려면 `ClientsModule.register()` 메서드에 `customClass` 속성을 사용하여 클래스 자체를 전달하면 됩니다. 다음은 각 오류를 `RpcException`으로 직렬화하는 사용자 지정 `ClientProxy`의 예입니다.

```typescript
@@filename(error-handling.proxy)
import { ClientTcp, RpcException } from '@nestjs/microservices';

class ErrorHandlingProxy extends ClientTCP {
  serializeError(err: Error) {
    return new RpcException(err);
  }
}
```

그리고 `ClientsModule`에서 다음과 같이 사용합니다.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ClientsModule.register([{
      name: 'CustomProxy',
      customClass: ErrorHandlingProxy,
    }]),
  ]
})
export class AppModule
```

> info **힌트** 이것은 클래스의 인스턴스가 아닌 클래스 자체를 `customClass`에 전달하는 것입니다. Nest는 내부적으로 인스턴스를 생성하며, `options` 속성에 제공된 모든 옵션을 새 `ClientProxy`에 전달합니다.
