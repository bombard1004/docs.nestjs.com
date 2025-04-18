### 게으른 로딩 모듈 (Lazy loading modules)

기본적으로 모듈은 즉시 로딩됩니다. 이는 애플리케이션이 로드되는 즉시 모든 모듈이 필요하든 아니든 로드된다는 의미입니다. 대부분의 애플리케이션에서는 문제가 없지만, 시작 대기 시간("콜드 스타트")이 중요한 **서버리스 환경**에서 실행되는 앱/워커의 경우 병목 현상이 될 수 있습니다.

게으른 로딩은 특정 서버리스 함수 호출에 필요한 모듈만 로드하여 부트스트랩 시간을 단축하는 데 도움이 될 수 있습니다. 또한, 서버리스 함수가 "웜업"되면 다른 모듈을 비동기적으로 로드하여 후속 호출의 부트스트랩 시간을 더욱 단축할 수도 있습니다 (지연된 모듈 등록).

> info **힌트** **[Angular](https://angular.dev/)** 프레임워크에 익숙하다면 이전에 "[게으른 로딩 모듈](https://angular.dev/guide/ngmodules/lazy-loading#lazy-loading-basics)"이라는 용어를 보셨을 수 있습니다. Nest에서는 이 기술이 **기능적으로 다릅니다**. 따라서 이것을 비슷한 명명 규칙을 공유하는 완전히 다른 기능이라고 생각하십시오.

> warning **경고** 게으르게 로드된 모듈과 서비스에서는 [라이프사이클 훅 메서드](https://nestjs.dokidocs.dev/fundamentals/lifecycle-events)가 호출되지 않는다는 점에 유의하십시오.

#### 시작하기

모듈을 온디맨드로 로드하기 위해 Nest는 `LazyModuleLoader` 클래스를 제공하며, 이는 일반적인 방식으로 클래스에 주입할 수 있습니다:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}
}
@@switch
@Injectable()
@Dependencies(LazyModuleLoader)
export class CatsService {
  constructor(lazyModuleLoader) {
    this.lazyModuleLoader = lazyModuleLoader;
  }
}
```

> info **힌트** `LazyModuleLoader` 클래스는 `@nestjs/core` 패키지에서 가져옵니다.

또는 애플리케이션 부트스트랩 파일(`main.ts`) 내에서 다음과 같이 `LazyModuleLoader` 프로바이더에 대한 참조를 얻을 수 있습니다:

```typescript
// "app"은 Nest 애플리케이션 인스턴스를 나타냅니다.
const lazyModuleLoader = app.get(LazyModuleLoader);
```

이를 통해 이제 다음 구조를 사용하여 모든 모듈을 로드할 수 있습니다:

```typescript
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
```

> info **힌트** "게으르게 로드된" 모듈은 첫 번째 `LazyModuleLoader#load` 메서드 호출 시 **캐시됩니다**. 즉, `LazyModule`를 로드하려는 각 연속 시도는 **매우 빠르며**, 모듈을 다시 로드하는 대신 캐시된 인스턴스를 반환합니다.
>
> ```bash
> Load "LazyModule" attempt: 1
> time: 2.379ms
> Load "LazyModule" attempt: 2
> time: 0.294ms
> Load "LazyModule" attempt: 3
> time: 0.303ms
> ```
>
> 또한 "게으르게 로드된" 모듈은 애플리케이션 부트스트랩 시 즉시 로드된 모듈뿐만 아니라 앱에서 나중에 등록된 다른 게으른 모듈과 동일한 모듈 그래프를 공유합니다.

여기서 `lazy.module.ts`는 **일반적인 Nest 모듈**을 내보내는 TypeScript 파일입니다 (별도의 추가 변경 사항은 필요하지 않습니다).

`LazyModuleLoader#load` 메서드는 내부 프로바이더 목록을 탐색하고 주입 토큰을 조회 키로 사용하여 모든 프로바이더에 대한 참조를 얻을 수 있는 [모듈 참조](/fundamentals/module-ref) ( `LazyModule`의)를 반환합니다.

예를 들어, 다음과 같은 정의를 가진 `LazyModule`가 있다고 가정해 보겠습니다:

```typescript
@Module({
  providers: [LazyService],
  exports: [LazyService],
})
export class LazyModule {}
```

> info **힌트** 게으르게 로드된 모듈은 **전역 모듈**로 등록될 수 없습니다. 이는 단순히 말이 되지 않습니다 (게으르게, 즉시 로드된 모든 정적으로 등록된 모듈이 이미 인스턴스화된 후 온디맨드로 등록되기 때문입니다). 마찬가지로 등록된 **전역 인핸서**(가드/인터셉터 등)도 제대로 **작동하지 않습니다**.

이를 통해 다음과 같이 `LazyService` 프로바이더에 대한 참조를 얻을 수 있습니다:

```typescript
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);

const { LazyService } = await import('./lazy.service');
const lazyService = moduleRef.get(LazyService);
```

> warning **경고** **Webpack**을 사용하는 경우 `tsconfig.json` 파일을 업데이트하여 `compilerOptions.module`을 `"esnext"`로 설정하고 `compilerOptions.moduleResolution` 속성에 `"node"` 값을 추가해야 합니다:
>
> ```json
> {
>   "compilerOptions": {
>     "module": "esnext",
>     "moduleResolution": "node",
>     ...
>   }
> }
> ```
>
> 이러한 옵션이 설정되면 [코드 분할](https://webpack.js.org/guides/code-splitting/) 기능을 활용할 수 있습니다.

#### 컨트롤러, 게이트웨이, 리졸버 게으른 로딩

Nest에서 컨트롤러(또는 GraphQL 애플리케이션의 리졸버)는 경로/경로/토픽(또는 쿼리/뮤테이션) 세트를 나타내므로 `LazyModuleLoader` 클래스를 사용하여 **게으르게 로드할 수 없습니다**.

> error **경고** 게으르게 로드된 모듈 내에 등록된 컨트롤러, [리졸버](/graphql/resolvers) 및 [게이트웨이](/websockets/gateways)는 예상대로 작동하지 않습니다. 마찬가지로, `MiddlewareConsumer` 인터페이스를 구현하여 미들웨어 함수를 온디맨드로 등록할 수 없습니다.

예를 들어, `@nestjs/platform-fastify` 패키지를 사용하여 Fastify 드라이버 기반의 REST API (HTTP 애플리케이션)를 구축하고 있다고 가정해 보겠습니다. Fastify는 애플리케이션이 준비/성공적으로 메시지를 수신한 후에는 경로를 등록할 수 없습니다. 즉, 모듈의 컨트롤러에 등록된 경로 매핑을 분석하더라도 모든 게으르게 로드된 경로는 런타임에 등록할 방법이 없으므로 접근할 수 없습니다.

마찬가지로, `@nestjs/microservices` 패키지의 일부로 제공되는 일부 전송 전략 (Kafka, gRPC 또는 RabbitMQ 포함)은 연결이 설정되기 전에 특정 토픽/채널을 구독/수신해야 합니다. 애플리케이션이 메시지 수신을 시작하면 프레임워크는 새로운 토픽을 구독/수신할 수 없습니다.

마지막으로, 코드 우선 접근 방식을 활성화한 `@nestjs/graphql` 패키지는 메타데이터를 기반으로 GraphQL 스키마를 즉석에서 자동으로 생성합니다. 즉, 모든 클래스가 사전에 로드되어야 합니다. 그렇지 않으면 적절하고 유효한 스키마를 생성할 수 없습니다.

#### 일반적인 사용 사례

가장 일반적으로, 워커/크론 작업/람다 및 서버리스 함수/웹훅이 입력 인자(경로/날짜/쿼리 매개변수 등)에 따라 다른 서비스(다른 로직)를 트리거해야 하는 상황에서 게으르게 로드된 모듈을 볼 수 있습니다. 반면에, 시작 시간이 그다지 중요하지 않은 모놀리식 애플리케이션에서는 모듈 게으른 로딩이 그다지 의미가 없을 수 있습니다.