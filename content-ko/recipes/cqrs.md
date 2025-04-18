### CQRS

단순한 [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (Create, Read, Update and Delete) 애플리케이션의 흐름은 다음과 같이 설명할 수 있습니다:

1. 컨트롤러 레이어는 HTTP 요청을 처리하고 서비스 레이어에 작업을 위임합니다.
2. 서비스 레이어는 대부분의 비즈니스 로직이 위치하는 곳입니다.
3. 서비스는 리포지토리 / DAO를 사용하여 엔티티를 변경 / 영구 저장합니다.
4. 엔티티는 값의 컨테이너 역할을 하며, 세터와 게터가 있습니다.

이 패턴은 일반적으로 작거나 중간 규모의 애플리케이션에는 충분하지만, 더 크고 복잡한 애플리케이션에는 최선의 선택이 아닐 수 있습니다. 이러한 경우, **CQRS** (Command and Query Responsibility Segregation) 모델이 더 적합하고 확장 가능할 수 있습니다 (애플리케이션 요구 사항에 따라 다름). 이 모델의 이점은 다음과 같습니다:

- **관심사 분리**. 이 모델은 읽기 및 쓰기 작업을 별도의 모델로 분리합니다.
- **확장성**. 읽기 및 쓰기 작업은 독립적으로 확장될 수 있습니다.
- **유연성**. 이 모델은 읽기 및 쓰기 작업을 위해 다른 데이터 저장소를 사용할 수 있도록 합니다.
- **성능**. 이 모델은 읽기 및 쓰기 작업에 최적화된 다른 데이터 저장소를 사용할 수 있도록 합니다.

이 모델을 용이하게 하기 위해 Nest는 경량 [CQRS 모듈](https://github.com/nestjs/cqrs)을 제공합니다. 이 장에서는 이를 사용하는 방법을 설명합니다.

#### 설치

먼저 필요한 패키지를 설치합니다:

```bash
$ npm install --save @nestjs/cqrs
```

설치가 완료되면 애플리케이션의 루트 모듈(일반적으로 `AppModule`)로 이동하여 `CqrsModule.forRoot()`를 임포트합니다:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule.forRoot()],
})
export class AppModule {}
```

이 모듈은 선택적 구성 객체를 허용합니다. 다음 옵션을 사용할 수 있습니다:

| 속성                      | 설명                                                                                                                               | 기본값                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `commandPublisher`            | 시스템에 커맨드를 디스패치하는 역할을 하는 퍼블리셔입니다.                                                                                                   | `DefaultCommandPubSub`            |
| `eventPublisher`              | 이벤트를 발행하는 데 사용되며, 이벤트를 브로드캐스트하거나 처리할 수 있습니다.                                                                                              | `DefaultPubSub`                   |
| `queryPublisher`              | 쿼리를 발행하는 데 사용되며, 데이터 검색 작업을 트리거할 수 있습니다.                                                                                                    | `DefaultQueryPubSub`              |
| `unhandledExceptionPublisher` | 처리되지 않은 예외를 처리하는 역할을 하며, 추적 및 보고되도록 합니다.                                                                                                  | `DefaultUnhandledExceptionPubSub` |
| `eventIdProvider`             | 이벤트 인스턴스에서 고유 이벤트 ID를 생성하거나 검색하여 제공하는 서비스입니다.                                                                                              | `DefaultEventIdProvider`          |
| `rethrowUnhandled`            | 처리되지 않은 예외가 처리된 후 다시 던져져야 하는지 여부를 결정하며, 디버깅 및 오류 관리에 유용합니다.                                                                                             | `false`                           |

#### 커맨드

커맨드는 애플리케이션 상태를 변경하는 데 사용됩니다. 데이터 중심적이기보다는 작업 중심적이어야 합니다. 커맨드가 디스패치되면 해당 **커맨드 핸들러**에 의해 처리됩니다. 핸들러는 애플리케이션 상태를 업데이트하는 역할을 합니다.

```typescript
@@filename(heroes-game.service)
@Injectable()
export class HeroesGameService {
  constructor(private commandBus: CommandBus) {}

  async killDragon(heroId: string, killDragonDto: KillDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
@@switch
@Injectable()
@Dependencies(CommandBus)
export class HeroesGameService {
  constructor(commandBus) {
    this.commandBus = commandBus;
  }

  async killDragon(heroId, killDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
```

위 코드 스니펫에서 `KillDragonCommand` 클래스를 인스턴스화하고 `CommandBus`의 `execute()` 메서드에 전달합니다. 시연된 커맨드 클래스는 다음과 같습니다:

```typescript
@@filename(kill-dragon.command)
export class KillDragonCommand extends Command<{
  actionId: string // This type represents the command execution result
}> {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class KillDragonCommand extends Command {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

보시다시피, `KillDragonCommand` 클래스는 `Command` 클래스를 확장합니다. `Command` 클래스는 `@nestjs/cqrs` 패키지에서 내보내는 간단한 유틸리티 클래스로, 커맨드의 반환 타입을 정의할 수 있습니다. 이 경우, 반환 타입은 `actionId` 속성을 가진 객체입니다. 이제 `KillDragonCommand` 커맨드가 디스패치될 때마다 `CommandBus#execute()` 메서드의 반환 타입은 `Promise<{{ '{' }} actionId: string {{ '}' }}>`로 추론됩니다. 이는 커맨드 핸들러에서 일부 데이터를 반환하려는 경우에 유용합니다.

> info **힌트** `Command` 클래스에서 상속하는 것은 선택 사항입니다. 커맨드의 반환 타입을 정의하려는 경우에만 필요합니다.

`CommandBus`는 커맨드의 **스트림**을 나타냅니다. 적절한 핸들러에 커맨드를 디스패치하는 역할을 합니다. `execute()` 메서드는 핸들러가 반환하는 값으로 확인되는 프로미스를 반환합니다.

`KillDragonCommand` 커맨드에 대한 핸들러를 만들어 봅시다.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(private repository: HeroesRepository) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);

    // "ICommandHandler<KillDragonCommand>" forces you to return a value that matches the command's return type
    return {
      actionId: crypto.randomUUID(), // This value will be returned to the caller
    }
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroesRepository)
export class KillDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);

    // "ICommandHandler<KillDragonCommand>" forces you to return a value that matches the command's return type
    return {
      actionId: crypto.randomUUID(), // This value will be returned to the caller
    }
  }
}
```

이 핸들러는 리포지토리에서 `Hero` 엔티티를 검색하고, `killEnemy()` 메서드를 호출한 다음 변경 사항을 영구 저장합니다. `KillDragonHandler` 클래스는 `ICommandHandler` 인터페이스를 구현하며, `execute()` 메서드의 구현이 필요합니다. `execute()` 메서드는 커맨드 객체를 인수로 받습니다.

`ICommandHandler<KillDragonCommand>`는 커맨드의 반환 타입과 일치하는 값을 반환하도록 강제한다는 점에 유의하십시오. 이 경우 반환 타입은 `actionId` 속성을 가진 객체입니다. 이는 `Command` 클래스를 상속하는 커맨드에만 적용됩니다. 그렇지 않으면 원하는 것을 반환할 수 있습니다.

마지막으로 `KillDragonHandler`를 모듈의 프로바이더로 등록해야 합니다:

```typescript
providers: [KillDragonHandler];
```

#### 쿼리

쿼리는 애플리케이션 상태에서 데이터를 검색하는 데 사용됩니다. 작업 중심적이기보다는 데이터 중심적이어야 합니다. 쿼리가 디스패치되면 해당 **쿼리 핸들러**에 의해 처리됩니다. 핸들러는 데이터를 검색하는 역할을 합니다.

`QueryBus`는 `CommandBus`와 동일한 패턴을 따릅니다. 쿼리 핸들러는 `IQueryHandler` 인터페이스를 구현하고 `@QueryHandler()` 데코레이터로 주석 처리해야 합니다. 다음 예제를 참조하십시오:

```typescript
export class GetHeroQuery extends Query<Hero> {
  constructor(public readonly heroId: string) {}
}
```

`Command` 클래스와 유사하게, `Query` 클래스는 `@nestjs/cqrs` 패키지에서 내보내는 간단한 유틸리티 클래스로, 쿼리의 반환 타입을 정의할 수 있습니다. 이 경우, 반환 타입은 `Hero` 객체입니다. 이제 `GetHeroQuery` 쿼리가 디스패치될 때마다 `QueryBus#execute()` 메서드의 반환 타입은 `Promise<Hero>`로 추론됩니다.

영웅을 검색하려면 쿼리 핸들러를 만들어야 합니다:

```typescript
@@filename(get-hero.handler)
@QueryHandler(GetHeroQuery)
export class GetHeroHandler implements IQueryHandler<GetHeroQuery> {
  constructor(private repository: HeroesRepository) {}

  async execute(query: GetHeroQuery) {
    return this.repository.findOneById(query.hero);
  }
}
@@switch
@QueryHandler(GetHeroQuery)
@Dependencies(HeroesRepository)
export class GetHeroHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(query) {
    return this.repository.findOneById(query.hero);
  }
}
```

`GetHeroHandler` 클래스는 `IQueryHandler` 인터페이스를 구현하며, `execute()` 메서드의 구현이 필요합니다. `execute()` 메서드는 쿼리 객체를 인수로 받으며, 쿼리의 반환 타입과 일치하는 데이터(이 경우, `Hero` 객체)를 반환해야 합니다.

마지막으로 `GetHeroHandler`를 모듈의 프로바이더로 등록해야 합니다:

```typescript
providers: [GetHeroHandler];
```

이제 쿼리를 디스패치하려면 `QueryBus`를 사용합니다:

```typescript
const hero = await this.queryBus.execute(new GetHeroQuery(heroId)); // "hero" will be auto-inferred as "Hero" type
```

#### 이벤트

이벤트는 애플리케이션 상태의 변경 사항을 애플리케이션의 다른 부분에 알리는 데 사용됩니다. **모델** 또는 `EventBus`를 직접 사용하여 디스패치됩니다. 이벤트가 디스패치되면 해당 **이벤트 핸들러**에 의해 처리됩니다. 핸들러는 예를 들어 읽기 모델을 업데이트할 수 있습니다.

시연 목적으로 이벤트 클래스를 만들어 봅시다:

```typescript
@@filename(hero-killed-dragon.event)
export class HeroKilledDragonEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class HeroKilledDragonEvent {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

이제 이벤트는 `EventBus.publish()` 메서드를 사용하여 직접 디스패치될 수 있지만, 모델에서도 디스패치할 수 있습니다. `Hero` 모델을 업데이트하여 `killEnemy()` 메서드가 호출될 때 `HeroKilledDragonEvent` 이벤트를 디스패치하도록 해봅시다.

```typescript
@@filename(hero.model)
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
@@switch
export class Hero extends AggregateRoot {
  constructor(id) {
    super();
    this.id = id;
  }

  killEnemy(enemyId) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
```

`apply()` 메서드는 이벤트를 디스패치하는 데 사용됩니다. 이벤트 객체를 인수로 받습니다. 하지만 우리 모델은 `EventBus`를 알지 못하므로, 모델과 연결해야 합니다. `EventPublisher` 클래스를 사용하여 그렇게 할 수 있습니다.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private repository: HeroesRepository,
    private publisher: EventPublisher,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroesRepository, EventPublisher)
export class KillDragonHandler {
  constructor(repository, publisher) {
    this.repository = repository;
    this.publisher = publisher;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
  }
}
```

`EventPublisher#mergeObjectContext` 메서드는 이벤트 퍼블리셔를 제공된 객체에 병합합니다. 이는 객체가 이제 이벤트 스트림에 이벤트를 발행할 수 있음을 의미합니다.

이 예제에서 모델의 `commit()` 메서드도 호출한다는 점에 유의하십시오. 이 메서드는 미처리된 이벤트를 디스패치하는 데 사용됩니다. 이벤트를 자동으로 디스패치하려면 `autoCommit` 속성을 `true`로 설정할 수 있습니다:

```typescript
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
    this.autoCommit = true;
  }
}
```

이벤트 퍼블리셔를 기존 객체가 아닌 클래스에 병합하려는 경우 `EventPublisher#mergeClassContext` 메서드를 사용할 수 있습니다:

```typescript
const HeroModel = this.publisher.mergeClassContext(Hero);
const hero = new HeroModel('id'); // <-- HeroModel은 클래스입니다.
```

이제 `HeroModel` 클래스의 모든 인스턴스는 `mergeObjectContext()` 메서드를 사용하지 않고도 이벤트를 발행할 수 있습니다.

또한 `EventBus`를 사용하여 이벤트를 수동으로 발생시킬 수 있습니다:

```typescript
this.eventBus.publish(new HeroKilledDragonEvent());
```

> info **힌트** `EventBus`는 주입 가능한 클래스입니다.

각 이벤트에는 여러 개의 **이벤트 핸들러**가 있을 수 있습니다.

```typescript
@@filename(hero-killed-dragon.handler)
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private repository: HeroesRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // Business logic
  }
}
```

> info **힌트** 이벤트 핸들러를 사용하기 시작하면 기존 HTTP 웹 컨텍스트에서 벗어난다는 점에 유의하십시오.
>
> - `CommandHandlers`의 오류는 내장된 [예외 필터](/exception-filters)에 의해 여전히 잡힐 수 있습니다.
> - `EventHandlers`의 오류는 예외 필터에 의해 잡힐 수 없습니다. 수동으로 처리해야 합니다. 간단한 `try/catch`를 사용하거나, 보상 이벤트를 트리거하여 [Sagas](/recipes/cqrs#sagas)를 사용하거나, 선택한 다른 솔루션을 사용하세요.
> - `CommandHandlers`의 HTTP 응답은 여전히 클라이언트로 다시 전송될 수 있습니다.
> - `EventHandlers`의 HTTP 응답은 전송될 수 없습니다. 클라이언트로 정보를 전송하려면 [WebSocket](/websockets/gateways), [SSE](/techniques/server-sent-events) 또는 선택한 다른 솔루션을 사용할 수 있습니다.

커맨드 및 쿼리와 마찬가지로 `HeroKilledDragonHandler`를 모듈의 프로바이더로 등록해야 합니다:

```typescript
providers: [HeroKilledDragonHandler];
```

#### 사가

사가는 이벤트를 수신하고 새로운 커맨드를 트리거할 수 있는 장기 실행 프로세스입니다. 일반적으로 애플리케이션에서 복잡한 워크플로우를 관리하는 데 사용됩니다. 예를 들어, 사용자가 가입할 때 사가는 `UserRegisteredEvent`를 수신하고 사용자에게 환영 이메일을 보낼 수 있습니다.

사가는 매우 강력한 기능입니다. 단일 사가는 1개 이상의 이벤트를 수신할 수 있습니다. [RxJS](https://github.com/ReactiveX/rxjs) 라이브러리를 사용하여 이벤트 스트림을 필터링, 매핑, 포크, 병합하여 정교한 워크플로우를 만들 수 있습니다. 각 사가는 커맨드 인스턴스를 생성하는 Observable을 반환합니다. 이 커맨드는 `CommandBus`에 의해 **비동기적으로** 디스패치됩니다.

`HeroKilledDragonEvent`를 수신하고 `DropAncientItemCommand` 커맨드를 디스패치하는 사가를 만들어 봅시다.

```typescript
@@filename(heroes-game.saga)
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
@@switch
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$) => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
```

> info **힌트** `ofType` 연산자와 `@Saga()` 데코레이터는 `@nestjs/cqrs` 패키지에서 내보냅니다.

`@Saga()` 데코레이터는 메서드를 사가로 표시합니다. `events$` 인수는 모든 이벤트의 Observable 스트림입니다. `ofType` 연산자는 지정된 이벤트 타입으로 스트림을 필터링합니다. `map` 연산자는 이벤트를 새 커맨드 인스턴스로 매핑합니다.

이 예제에서는 `HeroKilledDragonEvent`를 `DropAncientItemCommand` 커맨드로 매핑합니다. `DropAncientItemCommand` 커맨드는 `CommandBus`에 의해 자동으로 디스패치됩니다.

쿼리, 커맨드 및 이벤트 핸들러와 마찬가지로 `HeroesGameSagas`를 모듈의 프로바이더로 등록해야 합니다:

```typescript
providers: [HeroesGameSagas];
```

#### 처리되지 않은 예외

이벤트 핸들러는 비동기적으로 실행되므로 애플리케이션이 일관성 없는 상태가 되는 것을 방지하기 위해 항상 예외를 제대로 처리해야 합니다. 예외가 처리되지 않으면 `EventBus`는 `UnhandledExceptionInfo` 객체를 생성하고 `UnhandledExceptionBus` 스트림으로 푸시합니다. 이 스트림은 처리되지 않은 예외를 처리하는 데 사용할 수 있는 `Observable`입니다.

```typescript
private destroy$ = new Subject<void>();

constructor(private unhandledExceptionsBus: UnhandledExceptionBus) {
  this.unhandledExceptionsBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((exceptionInfo) => {
      // Handle exception here
      // e.g. send it to external service, terminate process, or publish a new event
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

예외를 필터링하려면 다음과 같이 `ofType` 연산자를 사용할 수 있습니다:

```typescript
this.unhandledExceptionsBus
  .pipe(
    takeUntil(this.destroy$),
    UnhandledExceptionBus.ofType(TransactionNotAllowedException),
  )
  .subscribe((exceptionInfo) => {
    // Handle exception here
  });
```

여기서 `TransactionNotAllowedException`은 필터링하려는 예외입니다.

`UnhandledExceptionInfo` 객체에는 다음과 같은 속성이 포함됩니다:

```typescript
export interface UnhandledExceptionInfo<
  Cause = IEvent | ICommand,
  Exception = any,
> {
  /**
   * The exception that was thrown.
   */
  exception: Exception;
  /**
   * The cause of the exception (event or command reference).
   */
  cause: Cause;
}
```

#### 모든 이벤트 구독

`CommandBus`, `QueryBus`, `EventBus`는 모두 **Observables**입니다. 이는 전체 스트림을 구독하고 예를 들어 모든 이벤트를 처리할 수 있음을 의미합니다. 예를 들어, 모든 이벤트를 콘솔에 로깅하거나 이벤트 저장소에 저장할 수 있습니다.

```typescript
private destroy$ = new Subject<void>();

constructor(private eventBus: EventBus) {
  this.eventBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => {
      // Save events to database
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

#### 요청 스코핑

다른 프로그래밍 언어 배경에서 온 사람들에게는 Nest에서 대부분의 것이 들어오는 요청 전반에 걸쳐 공유된다는 사실이 놀라울 수 있습니다. 여기에는 데이터베이스에 대한 연결 풀, 전역 상태를 가진 싱글톤 서비스 등이 포함됩니다. Node.js는 각 요청이 별도의 스레드에 의해 처리되는 요청/응답 다중 스레드 무상태 모델을 따르지 않는다는 점을 명심하십시오. 결과적으로 싱글톤 인스턴스를 사용하는 것은 애플리케이션에 **안전**합니다.

그러나 핸들러에 대한 요청 기반 수명 주기가 바람직할 수 있는 예외적인 경우가 있습니다. 여기에는 GraphQL 애플리케이션의 요청별 캐싱, 요청 추적 또는 멀티테넌시와 같은 시나리오가 포함될 수 있습니다. 스코프를 제어하는 방법에 대한 자세한 내용은 [여기](/fundamentals/injection-scopes)에서 확인할 수 있습니다.

요청 범위 프로바이더를 CQRS와 함께 사용하는 것은 `CommandBus`, `QueryBus`, `EventBus`가 싱글톤이기 때문에 복잡할 수 있습니다. 다행히 `@nestjs/cqrs` 패키지는 처리된 각 커맨드, 쿼리 또는 이벤트에 대해 요청 범위 핸들러의 새 인스턴스를 자동으로 생성하여 이를 단순화합니다.

핸들러를 요청 스코프로 만들려면 다음 중 하나를 수행할 수 있습니다.

1. 요청 스코프 프로바이더에 의존합니다.
2. 다음과 같이 `@CommandHandler`, `@QueryHandler` 또는 `@EventsHandler` 데코레이터를 사용하여 명시적으로 스코프를 `REQUEST`로 설정합니다.

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  // Implementation here
}
```

요청 페이로드를 요청 범위 프로바이더에 주입하려면 `@Inject(REQUEST)` 데코레이터를 사용합니다. 그러나 CQRS에서 요청 페이로드의 특성은 컨텍스트에 따라 다릅니다. HTTP 요청, 스케줄링된 작업 또는 커맨드를 트리거하는 다른 작업일 수 있습니다.

페이로드는 요청 컨텍스트 역할을 하며 요청 수명 주기 동안 액세스 가능한 데이터를 보유하는 `AsyncContext` ( `@nestjs/cqrs` 제공)를 확장하는 클래스의 인스턴스여야 합니다.

```typescript
import { AsyncContext } from '@nestjs/cqrs';

export class MyRequest extends AsyncContext {
  constructor(public readonly user: User) {
    super();
  }
}
```

커맨드를 실행할 때 사용자 정의 요청 컨텍스트를 `CommandBus#execute` 메서드의 두 번째 인수로 전달합니다:

```typescript
const myRequest = new MyRequest(user);
await this.commandBus.execute(
  new KillDragonCommand(heroId, killDragonDto.dragonId),
  myRequest,
);
```

이렇게 하면 `MyRequest` 인스턴스를 해당 핸들러에 대한 `REQUEST` 프로바이더로 사용할 수 있습니다:

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
```

쿼리에 대해서도 동일한 접근 방식을 따를 수 있습니다:

```typescript
const myRequest = new MyRequest(user);
const hero = await this.queryBus.execute(new GetHeroQuery(heroId), myRequest);
```

그리고 쿼리 핸들러에서:

```typescript
@QueryHandler(GetHeroQuery, {
  scope: Scope.REQUEST,
})
export class GetHeroHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
```

이벤트의 경우 `EventBus#publish`에 요청 프로바이더를 전달할 수 있지만, 이는 덜 일반적입니다. 대신 `EventPublisher`를 사용하여 요청 프로바이더를 모델에 병합합니다:

```typescript
const hero = this.publisher.mergeObjectContext(
  await this.repository.findOneById(+heroId),
  this.request, // Inject the request context here
);
```

이 이벤트를 구독하는 요청 범위 이벤트 핸들러는 요청 프로바이더에 액세스할 수 있습니다.

사가는 장기 실행 프로세스를 관리하므로 항상 싱글톤 인스턴스입니다. 그러나 이벤트 객체에서 요청 프로바이더를 검색할 수 있습니다:

```typescript
@Saga()
dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
  return events$.pipe(
    ofType(HeroKilledDragonEvent),
    map((event) => {
      const request = AsyncContext.of(event); // Retrieve the request context
      const command = new DropAncientItemCommand(event.heroId, fakeItemID);

      AsyncContext.merge(request, command); // Merge the request context into the command
      return command;
    }),
  );
}
```

또는 `request.attachTo(command)` 메서드를 사용하여 요청 컨텍스트를 커맨드에 연결할 수 있습니다.

#### 예제

작동하는 예제는 [여기](https://github.com/kamilmysliwiec/nest-cqrs-example)에서 확인할 수 있습니다.