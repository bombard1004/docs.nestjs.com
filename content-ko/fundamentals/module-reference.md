### ModuleRef

Nest는 내부 제공자 목록을 탐색하고 주입 토큰을 조회 키로 사용하여 모든 제공자의 참조를 얻을 수 있는 `ModuleRef` 클래스를 제공합니다. `ModuleRef` 클래스는 정적 제공자와 스코프 제공자를 모두 동적으로 인스턴스화하는 방법도 제공합니다. `ModuleRef`는 일반적인 방식으로 클래스에 주입될 수 있습니다:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private moduleRef: ModuleRef) {}
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }
}
```

> info **힌트** `ModuleRef` 클래스는 `@nestjs/core` 패키지에서 가져옵니다.

#### 인스턴스 검색하기

`ModuleRef` 인스턴스(이하 **모듈 참조**라고 부르겠습니다)에는 `get()` 메서드가 있습니다. 기본적으로 이 메서드는 주입 토큰/클래스 이름을 사용하여 *현재 모듈*에 등록되고 인스턴스화된 제공자, 컨트롤러 또는 주입 가능 항목(예: 가드, 인터셉터 등)을 반환합니다. 인스턴스를 찾을 수 없으면 예외가 발생합니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private service: Service;
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
```

> warning **경고** `get()` 메서드로는 스코프 제공자(transient 또는 request-scoped)를 검색할 수 없습니다. 대신 <a href="https://docs.nestjs.com/fundamentals/module-ref#resolving-scoped-providers">아래</a>에 설명된 기법을 사용하십시오. 스코프 제어 방법은 [여기](/fundamentals/injection-scopes)에서 알아보세요.

전역 컨텍스트에서 제공자를 검색하려면 (예를 들어, 다른 모듈에서 주입된 경우) `get()`의 두 번째 인수로 `{{ '{' }} strict: false {{ '}' }}` 옵션을 전달합니다.

```typescript
this.moduleRef.get(Service, { strict: false });
```

#### 스코프 제공자 확인하기

스코프 제공자(transient 또는 request-scoped)를 동적으로 확인하려면 제공자의 주입 토큰을 인수로 전달하여 `resolve()` 메서드를 사용합니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private transientService: TransientService;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
```

`resolve()` 메서드는 자체 **DI 컨테이너 서브 트리**에서 제공자의 고유한 인스턴스를 반환합니다. 각 서브 트리는 고유한 **컨텍스트 식별자**를 가집니다. 따라서 이 메서드를 두 번 이상 호출하고 인스턴스 참조를 비교하면 같지 않다는 것을 알 수 있습니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
```

여러 `resolve()` 호출에서 단일 인스턴스를 생성하고 동일한 생성된 DI 컨테이너 서브 트리를 공유하도록 하려면 `resolve()` 메서드에 컨텍스트 식별자를 전달할 수 있습니다. 컨텍스트 식별자를 생성하기 위해 `ContextIdFactory` 클래스를 사용합니다. 이 클래스는 적절한 고유 식별자를 반환하는 `create()` 메서드를 제공합니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
```

> info **힌트** `ContextIdFactory` 클래스는 `@nestjs/core` 패키지에서 가져옵니다.

#### `REQUEST` 제공자 등록하기

수동으로 생성된 컨텍스트 식별자(`ContextIdFactory.create()` 사용)는 Nest 의존성 주입 시스템에 의해 인스턴스화되고 관리되지 않으므로 `REQUEST` 제공자가 `undefined`인 DI 서브 트리를 나타냅니다.

수동으로 생성된 DI 서브 트리에 사용자 지정 `REQUEST` 객체를 등록하려면 다음과 같이 `ModuleRef#registerRequestByContextId()` 메서드를 사용하십시오.

```typescript
const contextId = ContextIdFactory.create();
this.moduleRef.registerRequestByContextId(/* YOUR_REQUEST_OBJECT */, contextId);
```

#### 현재 서브 트리 가져오기

때때로 **요청 컨텍스트** 내에서 request-scoped 제공자의 인스턴스를 확인하고 싶을 수 있습니다. `CatsService`가 request-scoped이고 `CatsRepository` 인스턴스(또한 request-scoped 제공자로 표시됨)를 확인하고 싶다고 가정해 봅시다. 동일한 DI 컨테이너 서브 트리를 공유하려면 새 컨텍스트 식별자를 생성하는 대신 (예: 위에 표시된 `ContextIdFactory.create()` 함수 사용) 현재 컨텍스트 식별자를 얻어야 합니다. 현재 컨텍스트 식별자를 얻으려면 `@Inject()` 데코레이터를 사용하여 요청 객체를 주입하는 것부터 시작합니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(REQUEST) private request: Record<string, unknown>,
  ) {}
}
@@switch
@Injectable()
@Dependencies(REQUEST)
export class CatsService {
  constructor(request) {
    this.request = request;
  }
}
```

> info **힌트** 요청 제공자에 대한 자세한 내용은 [여기](https://docs.nestjs.com/fundamentals/injection-scopes#request-provider)에서 알아보세요.

이제 `ContextIdFactory` 클래스의 `getByRequest()` 메서드를 사용하여 요청 객체를 기반으로 컨텍스트 ID를 생성하고 이를 `resolve()` 호출에 전달합니다.

```typescript
const contextId = ContextIdFactory.getByRequest(this.request);
const catsRepository = await this.moduleRef.resolve(CatsRepository, contextId);
```

#### 사용자 지정 클래스 동적으로 인스턴스화하기

이전에 **제공자로 등록되지 않은** 클래스를 동적으로 인스턴스화하려면 모듈 참조의 `create()` 메서드를 사용합니다.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private catsFactory: CatsFactory;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
```

이 기법을 사용하면 프레임워크 컨테이너 외부에서 다양한 클래스를 조건부로 인스턴스화할 수 있습니다.

<app-banner-devtools></app-banner-devtools>