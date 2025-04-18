### gRPC

[gRPC](https://github.com/grpc/grpc-node)는 모든 환경에서 실행할 수 있는 최신 오픈 소스 고성능 RPC 프레임워크입니다. 부하 분산, 트레이싱, 상태 확인 및 인증을 위한 플러그인 지원을 통해 데이터 센터 내부 및 데이터 센터 간에 서비스를 효율적으로 연결할 수 있습니다.

많은 RPC 시스템과 마찬가지로, gRPC는 원격으로 호출될 수 있는 함수(메서드) 관점에서 서비스를 정의하는 개념을 기반으로 합니다. 각 메서드에 대해 매개변수 및 반환 유형을 정의합니다. 서비스, 매개변수 및 반환 유형은 Google의 오픈 소스 언어 중립적 <a href="https://protobuf.dev">프로토콜 버퍼</a> 메커니즘을 사용하여 `.proto` 파일에 정의됩니다.

gRPC 트랜스포터를 사용하면 Nest는 `.proto` 파일을 사용하여 클라이언트와 서버를 동적으로 바인딩하여 원격 프로시저 호출을 쉽게 구현하고 구조화된 데이터를 자동으로 직렬화 및 역직렬화합니다.

#### 설치

gRPC 기반 마이크로서비스 구축을 시작하려면 먼저 필수 패키지를 설치하세요:

```bash
$ npm i --save @grpc/grpc-js @grpc/proto-loader
```

#### 개요

다른 Nest 마이크로서비스 트랜스포트 레이어 구현과 마찬가지로, `createMicroservice()` 메서드에 전달되는 옵션 객체의 `transport` 속성을 사용하여 gRPC 트랜스포터 메커니즘을 선택합니다. 다음 예에서는 히어로 서비스를 설정합니다. `options` 속성은 해당 서비스에 대한 메타데이터를 제공합니다. 그 속성은 <a href="microservices/grpc#options">아래</a>에 설명되어 있습니다.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
```

> info **힌트** `join()` 함수는 `path` 패키지에서 가져옵니다. `Transport` 열거형은 `@nestjs/microservices` 패키지에서 가져옵니다.

`nest-cli.json` 파일에, TypeScript가 아닌 파일을 배포할 수 있도록 `assets` 속성을 추가하고, `watchAssets` - 모든 비 TypeScript 자산 감시를 켭니다. 이 경우 `.proto` 파일이 `dist` 폴더로 자동으로 복사되도록 하고 싶습니다.

```json
{
  "compilerOptions": {
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
```

#### 옵션

**gRPC** 트랜스포터 옵션 객체는 아래 설명된 속성들을 노출합니다.

<table>
  <tr>
    <td><code>package</code></td>
    <td>Protobuf 패키지 이름 (`.proto` 파일의 `package` 설정과 일치). 필수.</td>
  </tr>
  <tr>
    <td><code>protoPath</code></td>
    <td>
      <code>.proto</code> 파일의 절대 경로 (또는 루트 디렉터리 기준 상대 경로). 필수.
    </td>
  </tr>
  <tr>
    <td><code>url</code></td>
    <td>연결 URL. `ip address/dns name:port` 형식의 문자열 (예: Docker 서버의 경우 <code>'0.0.0.0:50051'</code>). 트랜스포터가 연결을 설정할 주소/포트를 정의합니다. 선택 사항. 기본값은 <code>'localhost:5000'</code>입니다.</td>
  </tr>
  <tr>
    <td><code>protoLoader</code></td>
    <td><code>.proto</code> 파일을 로드하는 유틸리티 NPM 패키지 이름. 선택 사항. 기본값은 <code>'@grpc/proto-loader'</code>입니다.</td>
  </tr>
  <tr>
    <td><code>loader</code></td>
    <td>
      <code>@grpc/proto-loader</code> 옵션. 이들은 <code>.proto</code> 파일의 동작을 세부적으로 제어합니다. 선택 사항. 자세한 내용은
      <a
        href="https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md"
        rel="nofollow"
        target="_blank"
        >여기</a
      > 를 참조하십시오.
    </td>
  </tr>
  <tr>
    <td><code>credentials</code></td>
    <td>
      서버 자격 증명. 선택 사항. <a
        href="https://grpc.io/grpc/node/grpc.ServerCredentials.html"
        rel="nofollow"
        target="_blank"
        >여기에서 더 읽어보세요</a
      >.
    </td>
  </tr>
</table>

#### 샘플 gRPC 서비스

`HeroesService`라는 샘플 gRPC 서비스를 정의해 봅시다. 위의 `options` 객체에서 `protoPath` 속성은 `.proto` 정의 파일인 `hero.proto`의 경로를 설정합니다. `hero.proto` 파일은 <a href="https://developers.google.com/protocol-buffers">프로토콜 버퍼</a>를 사용하여 구조화되어 있습니다. 다음과 같습니다:

```typescript
// hero/hero.proto
syntax = "proto3";

package hero;

service HeroesService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}
```

`HeroesService`는 `FindOne()` 메서드를 노출합니다. 이 메서드는 `HeroById` 타입의 입력 인수를 예상하고 `Hero` 메시지를 반환합니다 (프로토콜 버퍼는 매개변수 타입과 반환 타입을 정의하기 위해 `message` 요소를 사용합니다).

다음으로, 서비스를 구현해야 합니다. 이 정의를 충족하는 핸들러를 정의하기 위해, 아래와 같이 컨트롤러에서 `@GrpcMethod()` 데코레이터를 사용합니다. 이 데코레이터는 메서드를 gRPC 서비스 메서드로 선언하는 데 필요한 메타데이터를 제공합니다.

> info **힌트** 이전 마이크로서비스 장에서 소개된 `@MessagePattern()` 데코레이터 (<a href="microservices/basics#request-response">더 읽기</a>)는 gRPC 기반 마이크로서비스와 함께 사용되지 않습니다. `@GrpcMethod()` 데코레이터가 gRPC 기반 마이크로서비스의 역할을 효과적으로 대체합니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

> info **힌트** `@GrpcMethod()` 데코레이터는 `@nestjs/microservices` 패키지에서 가져오고, `Metadata` 및 `ServerUnaryCall`은 `grpc` 패키지에서 가져옵니다.

위에 표시된 데코레이터는 두 개의 인수를 취합니다. 첫 번째는 서비스 이름(예: `'HeroesService'`)으로, `hero.proto`의 `HeroesService` 서비스 정의와 일치합니다. 두 번째 (문자열 `'FindOne'`)는 `hero.proto` 파일의 `HeroesService` 내에 정의된 `FindOne()` rpc 메서드와 일치합니다.

`findOne()` 핸들러 메서드는 세 가지 인수를 취합니다. 호출자로부터 전달된 `data`, gRPC 요청 메타데이터를 저장하는 `metadata`, 그리고 클라이언트에게 메타데이터를 보내기 위한 `sendMetadata`와 같은 `GrpcCall` 객체 속성을 얻기 위한 `call`입니다.

`@GrpcMethod()` 데코레이터 인수는 둘 다 선택 사항입니다. 두 번째 인수 없이 호출될 경우 (예: `'FindOne'`), Nest는 핸들러 이름을 Upper Camel Case로 변환하는 것을 기반으로 (`findOne` 핸들러가 `FindOne` rpc 호출 정의와 연결됨) `.proto` 파일의 rpc 메서드를 핸들러와 자동으로 연결합니다. 아래에 나와 있습니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

첫 번째 `@GrpcMethod()` 인수를 생략할 수도 있습니다. 이 경우 Nest는 핸들러가 정의된 **클래스** 이름을 기반으로 proto 정의 파일의 서비스 정의와 핸들러를 자동으로 연결합니다. 예를 들어, 다음 코드에서 클래스 `HeroesService`는 이름 `'HeroesService'`의 일치를 기반으로 `hero.proto` 파일의 `HeroesService` 서비스 정의와 해당 핸들러 메서드를 연결합니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

#### 클라이언트

Nest 애플리케이션은 `.proto` 파일에 정의된 서비스를 소비하는 gRPC 클라이언트 역할을 할 수 있습니다. `ClientGrpc` 객체를 통해 원격 서비스에 접근할 수 있습니다. `ClientGrpc` 객체는 여러 가지 방법으로 얻을 수 있습니다.

권장되는 방법은 `ClientsModule`을 가져오는 것입니다. `register()` 메서드를 사용하여 `.proto` 파일에 정의된 서비스 패키지를 주입 토큰에 바인딩하고 서비스를 구성합니다. `name` 속성은 주입 토큰입니다. gRPC 서비스의 경우 `transport: Transport.GRPC`를 사용합니다. `options` 속성은 <a href="microservices/grpc#options">위</a>에서 설명한 것과 동일한 속성을 가진 객체입니다.

```typescript
imports: [
  ClientsModule.register([
    {
      name: 'HERO_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(__dirname, 'hero/hero.proto'),
      },
    },
  ]),
];
```

> info **힌트** `register()` 메서드는 객체 배열을 취합니다. 쉼표로 구분된 등록 객체 목록을 제공하여 여러 패키지를 등록할 수 있습니다.

등록되면, `@Inject()`를 사용하여 구성된 `ClientGrpc` 객체를 주입할 수 있습니다. 그런 다음 `ClientGrpc` 객체의 `getService()` 메서드를 사용하여 서비스 인스턴스를 검색합니다. 아래에 나와 있습니다.

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  private heroesService: HeroesService;

  constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

> error **경고** gRPC 클라이언트는 밑줄(`_`)을 포함하는 필드를 보내지 않습니다. 단, 프로토 로더 설정 (`options.loader.keepcase`)에서 `keepCase` 옵션이 `true`로 설정된 경우는 예외입니다.

다른 마이크로서비스 트랜스포트 메서드에서 사용되는 기술과 비교하여 약간의 차이가 있음을 알 수 있습니다. `ClientProxy` 클래스 대신 `getService()` 메서드를 제공하는 `ClientGrpc` 클래스를 사용합니다. `getService()` 제네릭 메서드는 서비스 이름을 인수로 취하고 해당 인스턴스를 반환합니다 (사용 가능한 경우).

대안으로, `@Client()` 데코레이터를 사용하여 다음과 같이 `ClientGrpc` 객체를 인스턴스화할 수 있습니다:

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
    },
  })
  client: ClientGrpc;

  private heroesService: HeroesService;

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

마지막으로, 더 복잡한 시나리오의 경우 <a href="/microservices/basics#client">여기</a>에 설명된 대로 `ClientProxyFactory` 클래스를 사용하여 동적으로 구성된 클라이언트를 주입할 수 있습니다.

어떤 경우든, `.proto` 파일 내에 정의된 것과 동일한 메서드 집합을 노출하는 `HeroesService` 프록시 객체에 대한 참조를 얻게 됩니다. 이제 이 프록시 객체(즉, `heroesService`)에 액세스하면 gRPC 시스템은 요청을 자동으로 직렬화하고, 원격 시스템으로 전달하며, 응답을 반환하고, 응답을 역직렬화합니다. gRPC는 이러한 네트워크 통신 세부 정보를 숨기므로, `heroesService`는 로컬 공급자처럼 보이고 작동합니다.

모든 서비스 메서드는 **lower camel case**로 변환됩니다 (언어의 자연스러운 규칙을 따르기 위해). 따라서 예를 들어, `.proto` 파일의 `HeroesService` 정의에 `FindOne()` 함수가 포함되어 있지만, `heroesService` 인스턴스는 `findOne()` 메서드를 제공합니다.

```typescript
interface HeroesService {
  findOne(data: { id: number }): Observable<any>;
}
```

메시지 핸들러는 `Observable`을 반환할 수도 있으며, 이 경우 스트림이 완료될 때까지 결과 값이 방출됩니다.

```typescript
@@filename(heroes.controller)
@Get()
call(): Observable<any> {
  return this.heroesService.findOne({ id: 1 });
}
@@switch
@Get()
call() {
  return this.heroesService.findOne({ id: 1 });
}
```

gRPC 메타데이터를 (요청과 함께) 보내려면 다음과 같이 두 번째 인수를 전달할 수 있습니다.

```typescript
call(): Observable<any> {
  const metadata = new Metadata();
  metadata.add('Set-Cookie', 'yummy_cookie=choco');

  return this.heroesService.findOne({ id: 1 }, metadata);
}
```

> info **힌트** `Metadata` 클래스는 `grpc` 패키지에서 가져옵니다.

이는 몇 단계 전에 정의한 `HeroesService` 인터페이스를 업데이트해야 함을 유의하십시오.

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/04-grpc)에서 확인할 수 있습니다.

#### gRPC Reflection

[gRPC Server Reflection Specification](https://grpc.io/docs/guides/reflection/#overview)은 gRPC 클라이언트가 서버가 노출하는 API에 대한 세부 정보를 요청할 수 있는 표준으로, REST API의 OpenAPI 문서를 노출하는 것과 유사합니다. 이는 grpc-ui 또는 postman과 같은 개발자 디버깅 도구 작업을 훨씬 쉽게 만들 수 있습니다.

서버에 gRPC 리플렉션 지원을 추가하려면 먼저 필수 구현 패키지를 설치하십시오:

```bash
$ npm i --save @grpc/reflection
```

그런 다음 gRPC 서버 옵션의 `onLoadPackageDefinition` 후크를 사용하여 다음과 같이 gRPC 서버에 연결할 수 있습니다:

```typescript
@@filename(main)
import { ReflectionService } from '@grpc/reflection';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  options: {
    onLoadPackageDefinition: (pkg, server) => {
      new ReflectionService(pkg).addToServer(server);
    },
  },
});
```

이제 서버는 리플렉션 사양을 사용하여 API 세부 정보를 요청하는 메시지에 응답합니다.

#### gRPC Streaming

gRPC 자체는 일반적으로 `스트림`으로 알려진 장기 라이브 연결을 지원합니다. 스트림은 채팅, 관찰 또는 청크 데이터 전송과 같은 경우에 유용합니다. 자세한 내용은 [여기](https://grpc.io/docs/guides/concepts/)의 공식 문서를 참조하십시오.

Nest는 두 가지 가능한 방법으로 GRPC 스트림 핸들러를 지원합니다:

- RxJS `Subject` + `Observable` 핸들러: 컨트롤러 메서드 내에서 바로 응답을 쓰거나 `Subject`/`Observable` 소비자에게 전달하는 데 유용할 수 있습니다.
- 순수 GRPC 호출 스트림 핸들러: Node 표준 `Duplex` 스트림 핸들러의 나머지 디스패치를 처리할 일부 실행기에게 전달하는 데 유용할 수 있습니다.

<app-banner-enterprise></app-banner-enterprise>

#### 스트리밍 예제

`HelloService`라는 새로운 샘플 gRPC 서비스를 정의해 봅시다. `hello.proto` 파일은 <a href="https://developers.google.com/protocol-buffers">프로토콜 버퍼</a>를 사용하여 구조화되어 있습니다. 다음과 같습니다:

```typescript
// hello/hello.proto
syntax = "proto3";

package hello;

service HelloService {
  rpc BidiHello(stream HelloRequest) returns (stream HelloResponse);
  rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse);
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
```

> info **힌트** `LotsOfGreetings` 메서드는 반환된 스트림이 여러 값을 내보낼 수 있으므로 `@GrpcMethod` 데코레이터로 간단하게 구현할 수 있습니다 (위의 예제와 같이).

이 `.proto` 파일에 기반하여 `HelloService` 인터페이스를 정의해 봅시다:

```typescript
interface HelloService {
  bidiHello(upstream: Observable<HelloRequest>): Observable<HelloResponse>;
  lotsOfGreetings(
    upstream: Observable<HelloRequest>,
  ): Observable<HelloResponse>;
}

interface HelloRequest {
  greeting: string;
}

interface HelloResponse {
  reply: string;
}
```

> info **힌트** 프로토 인터페이스는 [ts-proto](https://github.com/stephenh/ts-proto) 패키지에 의해 자동으로 생성될 수 있으며, 자세한 내용은 [여기](https://github.com/stephenh/ts-proto/blob/main/NESTJS.markdown)에서 확인할 수 있습니다.

#### Subject 전략

`@GrpcStreamMethod()` 데코레이터는 RxJS `Observable`로 함수 매개변수를 제공합니다. 따라서 여러 메시지를 수신하고 처리할 수 있습니다.

```typescript
@GrpcStreamMethod()
bidiHello(messages: Observable<any>, metadata: Metadata, call: ServerDuplexStream<any, any>): Observable<any> {
  const subject = new Subject();

  const onNext = message => {
    console.log(message);
    subject.next({
      reply: 'Hello, world!'
    });
  };
  const onComplete = () => subject.complete();
  messages.subscribe({
    next: onNext,
    complete: onComplete,
  });


  return subject.asObservable();
}
```

> warning **경고** `@GrpcStreamMethod()` 데코레이터와 함께 완전 양방향 상호 작용을 지원하려면 컨트롤러 메서드는 RxJS `Observable`을 반환해야 합니다.

> info **힌트** `Metadata` 및 `ServerUnaryCall` 클래스/인터페이스는 `grpc` 패키지에서 가져옵니다.

서비스 정의(`.proto` 파일)에 따르면 `BidiHello` 메서드는 서비스로 요청 스트림을 보내야 합니다. 클라이언트에서 스트림으로 여러 비동기 메시지를 보내기 위해 RxJS `ReplaySubject` 클래스를 활용합니다.

```typescript
const helloService = this.client.getService<HelloService>('HelloService');
const helloRequest$ = new ReplaySubject<HelloRequest>();

helloRequest$.next({ greeting: 'Hello (1)!' });
helloRequest$.next({ greeting: 'Hello (2)!' });
helloRequest$.complete();

return helloService.bidiHello(helloRequest$);
```

위 예제에서는 스트림에 두 개의 메시지를 쓰고 (`next()` 호출), 데이터 전송이 완료되었음을 서비스에 알렸습니다 (`complete()` 호출).

#### Call stream 핸들러

메서드 반환 값이 `stream`으로 정의된 경우, `@GrpcStreamCall()` 데코레이터는 `grpc.ServerDuplexStream`으로 함수 매개변수를 제공하며, 이는 `.on('data', callback)`, `.write(message)` 또는 `.cancel()`와 같은 표준 메서드를 지원합니다. 사용 가능한 메서드에 대한 전체 문서는 [여기](https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html)에서 찾을 수 있습니다.

대안으로, 메서드 반환 값이 `stream`이 아닌 경우, `@GrpcStreamCall()` 데코레이터는 각각 `grpc.ServerReadableStream` ([여기](https://grpc.github.io/grpc/node/grpc-ServerReadableStream.html)에서 더 읽기) 및 `callback` 두 개의 함수 매개변수를 제공합니다.

완전 양방향 상호 작용을 지원해야 하는 `BidiHello`를 구현하는 것부터 시작하겠습니다.

```typescript
@GrpcStreamCall()
bidiHello(requestStream: any) {
  requestStream.on('data', message => {
    console.log(message);
    requestStream.write({
      reply: 'Hello, world!'
    });
  });
}
```

> info **힌트** 이 데코레이터는 특정 반환 매개변수를 제공할 필요가 없습니다. 스트림은 다른 표준 스트림 타입과 유사하게 처리될 것으로 예상됩니다.

위 예제에서는 `write()` 메서드를 사용하여 응답 스트림에 객체를 썼습니다. 두 번째 매개변수로 `.on()` 메서드에 전달된 콜백은 서비스가 새 데이터 청크를 받을 때마다 호출됩니다.

`LotsOfGreetings` 메서드를 구현해 봅시다.

```typescript
@GrpcStreamCall()
lotsOfGreetings(requestStream: any, callback: (err: unknown, value: HelloResponse) => void) {
  requestStream.on('data', message => {
    console.log(message);
  });
  requestStream.on('end', () => callback(null, { reply: 'Hello, world!' }));
}
```

여기서는 `callback` 함수를 사용하여 `requestStream` 처리가 완료되면 응답을 보냈습니다.

#### 상태 확인 (Health checks)

Kubernetes와 같은 오케스트레이터에서 gRPC 애플리케이션을 실행할 때, 애플리케이션이 실행 중이며 정상 상태인지 알아야 할 수 있습니다. [gRPC Health Check specification](https://grpc.io/docs/guides/health-checking/)은 gRPC 클라이언트가 오케스트레이터가 그에 따라 행동할 수 있도록 상태를 노출할 수 있게 하는 표준입니다.

gRPC 상태 확인 지원을 추가하려면 먼저 [grpc-node](https://github.com/grpc/grpc-node/tree/master/packages/grpc-health-check) 패키지를 설치하십시오:

```bash
$ npm i --save grpc-health-check
```

그런 다음 gRPC 서버 옵션의 `onLoadPackageDefinition` 후크를 사용하여 gRPC 서비스에 연결할 수 있습니다. `protoPath`는 상태 확인과 히어로 패키지 모두를 포함해야 한다는 점을 유의하십시오.

```typescript
@@filename(main)
import { HealthImplementation, protoPath as healthCheckProtoPath } from 'grpc-health-check';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  options: {
    protoPath: [
      healthCheckProtoPath,
      protoPath: join(__dirname, 'hero/hero.proto'),
    ],
    onLoadPackageDefinition: (pkg, server) => {
      const healthImpl = new HealthImplementation({
        '': 'UNKNOWN',
      });

      healthImpl.addToServer(server);
      healthImpl.setStatus('', 'SERVING');
    },
  },
});
```

> info **힌트** [gRPC health probe](https://github.com/grpc-ecosystem/grpc-health-probe)는 컨테이너 환경에서 gRPC 상태 확인을 테스트하는 데 유용한 CLI입니다.

#### gRPC 메타데이터

메타데이터는 키-값 쌍 목록 형태의 특정 RPC 호출에 대한 정보로, 키는 문자열이고 값은 일반적으로 문자열이지만 이진 데이터일 수도 있습니다. 메타데이터는 gRPC 자체에게는 불투명합니다. 클라이언트가 호출과 관련된 정보를 서버에 제공하고 그 반대도 가능하게 합니다. 메타데이터에는 인증 토큰, 요청 식별자 및 모니터링 목적을 위한 태그, 데이터 세트의 레코드 수와 같은 데이터 정보가 포함될 수 있습니다.

`@GrpcMethod()` 핸들러에서 메타데이터를 읽으려면 두 번째 인수(메타데이터)를 사용하며, 이 인수는 `Metadata` 타입입니다 (`grpc` 패키지에서 가져옴).

핸들러에서 메타데이터를 다시 보내려면 `ServerUnaryCall#sendMetadata()` 메서드(세 번째 핸들러 인수)를 사용합니다.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
```

마찬가지로, `@GrpcStreamMethod()` 핸들러([subject 전략](microservices/grpc#subject-strategy))로 주석이 달린 핸들러에서 메타데이터를 읽으려면 두 번째 인수(메타데이터)를 사용하며, 이는 `Metadata` 타입입니다 (`grpc` 패키지에서 가져옴).

핸들러에서 메타데이터를 다시 보내려면 `ServerDuplexStream#sendMetadata()` 메서드(세 번째 핸들러 인수)를 사용합니다.

[call stream 핸들러](microservices/grpc#call-stream-handler) (`@GrpcStreamCall()` 데코레이터로 주석이 달린 핸들러) 내에서 메타데이터를 읽으려면 다음과 같이 `requestStream` 참조의 `metadata` 이벤트를 수신하십시오:

```typescript
requestStream.on('metadata', (metadata: Metadata) => {
  const meta = metadata.get('X-Meta');
});
```
