### MQTT

[MQTT](https://mqtt.org/) (Message Queuing Telemetry Transport)는 낮은 지연 시간(low latency)에 최적화된 오픈 소스 경량 메시징 프로토콜입니다. 이 프로토콜은 **게시/구독(publish/subscribe)** 모델을 사용하여 장치를 연결하는 확장 가능하고 비용 효율적인 방법을 제공합니다. MQTT 기반 통신 시스템은 게시 서버, 브로커 및 하나 이상의 클라이언트로 구성됩니다. 이 프로토콜은 제약이 있는 장치(constrained devices)와 낮은 대역폭(low-bandwidth), 높은 지연 시간(high-latency) 또는 신뢰할 수 없는 네트워크(unreliable networks)에 맞게 설계되었습니다.

#### 설치

MQTT 기반 마이크로서비스 구축을 시작하려면 먼저 필요한 패키지를 설치해야 합니다.

```bash
$ npm i --save mqtt
```

#### 개요

MQTT 트랜스포터(transporter)를 사용하려면 다음 옵션 객체를 `createMicroservice()` 메서드에 전달합니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
```

> info **힌트** `Transport` 열거형은 `@nestjs/microservices` 패키지에서 가져옵니다.

#### 옵션

`options` 객체는 선택된 트랜스포터에 따라 다릅니다. **MQTT** 트랜스포터는 [여기](https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options)에 설명된 속성을 노출합니다.

#### 클라이언트

다른 마이크로서비스 트랜스포터와 마찬가지로, MQTT `ClientProxy` 인스턴스를 생성하기 위한 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">몇 가지 옵션</a>이 있습니다.

인스턴스를 생성하는 한 가지 방법은 `ClientsModule`을 사용하는 것입니다. `ClientsModule`을 사용하여 클라이언트 인스턴스를 생성하려면, 이를 가져오고 `register()` 메서드를 사용하여 위에 `createMicroservice()` 메서드에 표시된 것과 동일한 속성을 가진 옵션 객체와 주입 토큰(injection token)으로 사용될 `name` 속성을 전달합니다. `ClientsModule`에 대해 자세히 알아보려면 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여기를 참조하세요</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://localhost:1883',
        }
      },
    ]),
  ]
  ...
})
```

클라이언트를 생성하는 다른 옵션( `ClientProxyFactory` 또는 `@Client()`)도 사용할 수 있습니다. 이에 대해 알아보려면 <a href="https://nestjs.dokidocs.dev/microservices/basics#client">여기를 참조하세요</a>.

#### 컨텍스트

더 복잡한 시나리오에서는 들어오는 요청에 대한 추가 정보에 액세스해야 할 수 있습니다. MQTT 트랜스포터를 사용하는 경우 `MqttContext` 객체에 액세스할 수 있습니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **힌트** `@Payload()`, `@Ctx()` 및 `MqttContext`는 `@nestjs/microservices` 패키지에서 가져옵니다.

원래 mqtt [패킷(packet)](https://github.com/mqttjs/mqtt-packet)에 액세스하려면 다음과 같이 `MqttContext` 객체의 `getPacket()` 메서드를 사용합니다.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(context.getPacket());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getPacket());
}
```

#### 와일드카드

구독은 명시적인 토픽일 수도 있고 와일드카드를 포함할 수도 있습니다. `+`와 `#`의 두 가지 와일드카드를 사용할 수 있습니다. `+`는 단일 레벨 와일드카드이며, `#`는 여러 토픽 레벨을 포함하는 다중 레벨 와일드카드입니다.

```typescript
@@filename()
@MessagePattern('sensors/+/temperature/+')
getTemperature(@Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Ctx())
@MessagePattern('sensors/+/temperature/+')
getTemperature(context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

#### 서비스 품질 (QoS)

`@MessagePattern` 또는 `@EventPattern` 데코레이터로 생성된 모든 구독은 QoS 0으로 구독됩니다. 더 높은 QoS가 필요한 경우, 다음과 같이 연결 설정 시 `subscribeOptions` 블록을 사용하여 전역적으로 설정할 수 있습니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
```

토픽별 QoS가 필요한 경우 [사용자 지정 트랜스포터(Custom transporter)](https://nestjs.dokidocs.dev/microservices/custom-transport) 생성을 고려하세요.

#### 레코드 빌더

메시지 옵션을 구성하려면(QoS 레벨 조정, Retain 또는 DUP 플래그 설정, 페이로드에 추가 속성 추가 등) `MqttRecordBuilder` 클래스를 사용할 수 있습니다. 예를 들어, `QoS`를 `2`로 설정하려면 다음과 같이 `setQoS` 메서드를 사용합니다.

```typescript
const userProperties = { 'x-version': '1.0.0' };
const record = new MqttRecordBuilder(':cat:')
  .setProperties({ userProperties })
.setQoS(1)
  .build();
client.send('replace-emoji', record).subscribe(...);
```

> info **힌트** `MqttRecordBuilder` 클래스는 `@nestjs/microservices` 패키지에서 내보내집니다.

그리고 서버 측에서도 `MqttContext`에 액세스하여 이러한 옵션을 읽을 수 있습니다.

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: MqttContext): string {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

경우에 따라 여러 요청에 대해 사용자 속성을 구성하고 싶을 수 있습니다. 이러한 옵션을 `ClientProxyFactory`에 전달할 수 있습니다.

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: 'mqtt://localhost:1833',
            userProperties: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### 인스턴스 상태 업데이트

연결 및 기본 드라이버 인스턴스의 상태에 대한 실시간 업데이트를 받으려면 `status` 스트림을 구독할 수 있습니다. 이 스트림은 선택된 드라이버에 특정한 상태 업데이트를 제공합니다. MQTT 드라이버의 경우 `status` 스트림은 `connected`, `disconnected`, `reconnecting`, `closed` 이벤트를 내보냅니다.

```typescript
this.client.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

> info **힌트** `MqttStatus` 타입은 `@nestjs/microservices` 패키지에서 가져옵니다.

마찬가지로 서버의 `status` 스트림을 구독하여 서버 상태에 대한 알림을 받을 수 있습니다.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

#### MQTT 이벤트 수신하기

경우에 따라 마이크로서비스에서 내보내는 내부 이벤트를 수신하고 싶을 수 있습니다. 예를 들어, 오류 발생 시 추가 작업을 트리거하기 위해 `error` 이벤트를 수신할 수 있습니다. 이를 위해 다음과 같이 `on()` 메서드를 사용합니다.

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

마찬가지로 서버의 내부 이벤트를 수신할 수 있습니다.

```typescript
server.on<MqttEvents>('error', (err) => {
  console.error(err);
});
```

> info **힌트** `MqttEvents` 타입은 `@nestjs/microservices` 패키지에서 가져옵니다.

#### 기본 드라이버 액세스

더 고급 사용 사례의 경우 기본 드라이버 인스턴스에 액세스해야 할 수 있습니다. 이는 연결을 수동으로 닫거나 드라이버별 메서드를 사용하는 시나리오에 유용할 수 있습니다. 하지만 대부분의 경우 드라이버에 직접 액세스할 **필요가 없다**는 점을 명심하세요.

이를 위해 `unwrap()` 메서드를 사용할 수 있으며, 이 메서드는 기본 드라이버 인스턴스를 반환합니다. 제네릭 타입 매개변수는 예상하는 드라이버 인스턴스의 타입을 지정해야 합니다.

```typescript
const mqttClient = this.client.unwrap<import('mqtt').MqttClient>();
```

마찬가지로 서버의 기본 드라이버 인스턴스에 액세스할 수 있습니다.

```typescript
const mqttClient = server.unwrap<import('mqtt').MqttClient>();
```