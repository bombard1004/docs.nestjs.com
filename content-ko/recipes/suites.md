### 스위트 (이전 이름: 오토목)

스위트는 백엔드 시스템의 소프트웨어 테스트 경험을 향상시키기 위해 설계된, 독창적이고 유연한 테스트 메타 프레임워크입니다. 다양한 테스트 도구를 통합된 프레임워크로 모아, 스위트는 신뢰할 수 있는 테스트 생성을 간소화하여 고품질 소프트웨어 개발을 보장하는 데 도움을 줍니다.

> info **힌트** `Suites`는 서드 파티 패키지이며 NestJS 코어 팀에서 유지 관리하지 않습니다. 라이브러리 관련 문제는 [해당 저장소](https://github.com/suites-dev/suites)에 보고해 주세요.

#### 소개

제어 역전(IoC)은 NestJS 프레임워크의 기본적인 원칙이며, 모듈화되고 테스트 가능한 아키텍처를 가능하게 합니다. NestJS는 테스트 모듈 생성을 위한 내장 도구를 제공하지만, 스위트는 격리된 단위 또는 소규모 단위 그룹을 함께 테스트하는 데 중점을 둔 대안적인 접근 방식을 제공합니다. 스위트는 의존성을 위한 가상 컨테이너를 사용하며, 여기서 목(mock)이 자동으로 생성되어 IoC(또는 DI) 컨테이너에서 각 제공자(provider)를 목으로 수동으로 교체할 필요가 없습니다. 이 접근 방식은 NestJS의 `Test.createTestingModule` 메서드 대신 또는 함께 사용할 수 있으며, 필요에 따라 단위 테스트에 더 많은 유연성을 제공합니다.

#### 설치

Suites를 NestJS와 함께 사용하려면 필요한 패키지를 설치합니다:

```bash
$ npm i -D @suites/unit @suites/di.nestjs @suites/doubles.jest
```

> info **힌트** `Suites`는 Vitest와 Sinon을 테스트 더블로도 지원합니다. 각각 `@suites/doubles.vitest`와 `@suites/doubles.sinon`입니다.

#### 예제 및 모듈 설정

`CatsService`를 위한 모듈 설정을 생각해 봅시다. 이 서비스는 `CatsApiService`, `CatsDAL`, `HttpClient`, `Logger`를 포함합니다. 이것이
이 레시피의 예제를 위한 기본이 될 것입니다:

```typescript
@@filename(cats.module)
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [HttpModule.register({ baseUrl: 'https://api.cats.com/' }), PrismaModule],
  providers: [CatsService, CatsApiService, CatsDAL, Logger],
  exports: [CatsService],
})
export class CatsModule {}
```

`HttpModule`과 `PrismaModule` 모두 제공자를 호스트 모듈로 내보내고 있습니다.

`CatsHttpService`를 격리하여 테스트하는 것부터 시작해 봅시다. 이 서비스는 API에서 고양이 데이터를 가져오고 작업을 로깅하는 역할을 합니다.

```typescript
@@filename(cats-http.service)
@Injectable()
export class CatsHttpService {
  constructor(private httpClient: HttpClient, private logger: Logger) {}

  async fetchCats(): Promise<Cat[]> {
    this.logger.log('Fetching cats from the API');
    const response = await this.httpClient.get('/cats');
    return response.data;
  }
}
```

`CatsHttpService`를 격리하고 해당 의존성인 `HttpClient`와 `Logger`를 목으로 만들고 싶습니다. Suites는 `TestBed`의 `.solitary()` 메서드를
사용하여 이를 쉽게 수행할 수 있도록 합니다.

```typescript
@@filename(cats-http.service.spec)
import { TestBed, Mocked } from '@suites/unit';

describe('Cats Http Service Unit Test', () => {
  let catsHttpService: CatsHttpService;
  let httpClient: Mocked<HttpClient>;
  let logger: Mocked<Logger>;

  beforeAll(async () => {
    // CatsHttpService를 격리하고 HttpClient와 Logger를 목으로 만듭니다.
    const { unit, unitRef } = await TestBed.solitary(CatsHttpService).compile();

    catsHttpService = unit;
    httpClient = unitRef.get(HttpClient);
    logger = unitRef.get(Logger);
  });

  it('should fetch cats from the API and log the operation', async () => {
    const catsFixtures: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
    httpClient.get.mockResolvedValue({ data: catsFixtures });

    const cats = await catsHttpService.fetchCats();

    expect(logger.log).toHaveBeenCalledWith('Fetching cats from the API');
    expect(httpClient.get).toHaveBeenCalledWith('/cats');
    expect(cats).toEqual<Cat[]>(catsFixtures);
  });
});
```

위 예제에서 Suites는 `TestBed.solitary()`를 사용하여 `CatsHttpService`의 의존성을 자동으로 목으로 만듭니다. 이렇게 하면 각 의존성을 수동으로 목으로 만들 필요가 없으므로 설정이 더 쉬워집니다.

- 의존성 자동 목 생성: Suites는 테스트 대상 단위의 모든 의존성에 대한 목을 생성합니다.
- 목의 빈 동작: 처음에는 이러한 목에 미리 정의된 동작이 없습니다. 테스트에 필요한 대로 동작을 지정해야 합니다.
- `unit` 및 `unitRef` 속성:
  - `unit`은 테스트 대상 클래스의 실제 인스턴스를 나타내며, 목으로 만들어진 의존성을 포함합니다.
  - `unitRef`는 목으로 만들어진 의존성에 접근할 수 있도록 하는 참조입니다.

#### `TestingModule`을 사용한 `CatsApiService` 테스트

`CatsApiService`의 경우, `HttpModule`이 `CatsModule` 호스트 모듈에 제대로 임포트되고 구성되었는지 확인하고 싶습니다. 여기에는 `Axios`의 기본 URL(및 기타 구성)이 올바르게 설정되었는지 확인하는 것이 포함됩니다.

이 경우 Suites는 사용하지 않고, 대신 Nest의 `TestingModule`을 사용하여 `HttpModule`의 실제 구성을 테스트합니다. 이 시나리오에서는 `HttpClient`를 목으로 만들지 않고 HTTP 요청을 목으로 만들기 위해 `nock`을 활용할 것입니다.

```typescript
@@filename(cats-api.service)
import { HttpClient } from '@nestjs/axios';

@Injectable()
export class CatsApiService {
  constructor(private httpClient: HttpClient) {}

  async getCatById(id: number): Promise<Cat> {
    const response = await this.httpClient.get(`/cats/${id}`);
    return response.data;
  }
}
```

`CatsApiService`를 실제 목으로 만들어지지 않은 `HttpClient`와 함께 테스트하여 `Axios` (http)의 DI 및 구성이
올바른지 확인해야 합니다. 여기에는 `CatsModule`을 임포트하고 HTTP 요청 목을 위해 `nock`을 사용하는 것이 포함됩니다.

```typescript
@@filename(cats-api.service.integration.test)
import { Test } from '@nestjs/testing';
import * as nock from 'nock';

describe('Cats Api Service Integration Test', () => {
  let catsApiService: CatsApiService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();

    catsApiService = moduleRef.get(CatsApiService);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch cat by id using real HttpClient', async () => {
    const catFixture: Cat = { id: 1, name: 'Catty' };

    nock('https://api.cats.com') // 이 URL은 HttpModule 등록의 URL과 동일해야 합니다.
      .get('/cats/1')
      .reply(200, catFixture);

    const cat = await catsApiService.getCatById(1);
    expect(cat).toEqual<Cat>(catFixture);
  });
});
```

#### 협업 테스트 예제

다음으로, `CatsApiService`와 `CatsDAL`에 의존하는 `CatsService`를 테스트해 봅시다. `CatsApiService`를 목으로 만들고
`CatsDAL`을 노출시킬 것입니다.

```typescript
@@filename(cats.dal)
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CatsDAL {
  constructor(private prisma: PrismaClient) {}

  async saveCat(cat: Cat): Promise<Cat> {
    return this.prisma.cat.create({data: cat});
  }
}
```

다음으로, `CatsApiService`와 `CatsDAL`에 의존하는 `CatsService`가 있습니다:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    private catsApiService: CatsApiService,
    private catsDAL: CatsDAL
  ) {}

  async getAndSaveCat(id: number): Promise<Cat> {
    const cat = await this.catsApiService.getCatById(id);
    return this.catsDAL.saveCat(cat);
  }
}
```

이제 스위트와 협업 테스트를 사용하여 `CatsService`를 테스트해 봅시다:

```typescript
@@filename(cats.service.spec)
import { TestBed, Mocked } from '@suites/unit';
import { PrismaClient } from '@prisma/client';

describe('Cats Service Sociable Unit Test', () => {
  let catsService: CatsService;
  let prisma: Mocked<PrismaClient>;
  let catsApiService: Mocked<CatsApiService>;

  beforeAll(async () => {
    // 협업 테스트 설정, CatsDAL 노출 및 CatsApiService 목 생성
    const { unit, unitRef } = await TestBed.sociable(CatsService)
      .expose(CatsDAL)
      .mock(CatsApiService)
      .final({ getCatById: async () => ({ id: 1, name: 'Catty' })})
      .compile();

    catsService = unit;
    prisma = unitRef.get(PrismaClient);
  });

  it('should get cat by id and save it', async () => {
    const catFixture: Cat = { id: 1, name: 'Catty' };
    prisma.cat.create.mockResolvedValue(catFixture);

    const savedCat = await catsService.getAndSaveCat(1);

    expect(prisma.cat.create).toHaveBeenCalledWith({ data: catFixture });
    expect(savedCat).toEqual(catFixture);
  });
});
```

이 예제에서는 `.sociable()` 메서드를 사용하여 테스트 환경을 설정합니다. `.expose()` 메서드를 사용하여 `CatsDAL`과 실제 상호작용을 허용하는 반면, `.mock()` 메서드로 `CatsApiService`를 목으로 만듭니다. `.final()` 메서드는 `CatsApiService`에 대한 고정된 동작을 설정하여 테스트 전반에 걸쳐 일관된 결과를 보장합니다.

이 접근 방식은 `CatsService`와 `CatsDAL`의 실제 상호작용을 통한 테스트에 중점을 두며, 이는 `Prisma` 처리를 포함합니다. Suites는 `CatsDAL`을 있는 그대로 사용하며, 이 경우 `Prisma`와 같은 해당 의존성만 목으로 만들어집니다.

이 접근 방식은 **동작 검증에만 사용**되며 전체 테스트 모듈을 로드하는 것과는 다르다는 점에 유의하는 것이 중요합니다. 협업 테스트는 단위의 동작과 상호작용에 초점을 맞추고 싶을 때, 직접적인 의존성으로부터 격리된 단위의 동작을 확인하는 데 유용합니다.

#### 통합 테스트와 데이터베이스

`CatsDAL`의 경우 SQLite 또는 PostgreSQL과 같은 실제 데이터베이스(예: Docker Compose 사용)를 대상으로 테스트하는 것이 가능합니다. 그러나 이 예제에서는 `Prisma`를 목으로 만들고 협업 테스트에 중점을 둘 것입니다. `Prisma`를 목으로 만드는 이유는 I/O 작업을 피하고 `CatsService`의 동작에 격리적으로 집중하기 위함입니다. 하지만 실제 I/O 작업과 라이브 데이터베이스를 사용하여 테스트를 수행할 수도 있습니다.

#### 협업 단위 테스트, 통합 테스트, 그리고 목 생성

- 협업 단위 테스트: 심층적인 의존성을 목으로 만들면서 단위 간의 상호작용과 동작을 테스트하는 데 중점을 둡니다. 이 예제에서는 `Prisma`를 목으로 만들고 `CatsDAL`을 노출시킵니다.

- 통합 테스트: 실제 I/O 작업과 완전히 구성된 의존성 주입(DI) 설정을 포함합니다. `HttpModule`과 `nock`을 사용하여 `CatsApiService`를 테스트하는 것은 `HttpClient`의 실제 구성과 상호작용을 검증하므로 통합 테스트로 간주됩니다. 이 시나리오에서는 Nest의 `TestingModule`을 사용하여 실제 모듈 구성을 로드합니다.

**목 사용 시 주의하십시오.** I/O 작업 및 DI 구성(특히 HTTP 또는 데이터베이스 상호작용이 관련된 경우)을 반드시 테스트해야 합니다. 이러한 구성 요소를 통합 테스트로 검증한 후에는 협업 단위 테스트를 위해 자신 있게 목으로 만들어서 동작 및 상호작용에 집중할 수 있습니다. Suites의 협업 테스트는 직접적인 의존성으로부터 격리된 단위의 동작을 검증하는 데 중점을 두는 반면, 통합 테스트는 전체 시스템 구성 및 I/O 작업이 올바르게 작동하는지 확인합니다.

#### IoC 컨테이너 등록 테스트

DI 컨테이너가 런타임 오류를 방지하기 위해 올바르게 구성되었는지 확인하는 것이 필수적입니다. 여기에는 모든 제공자, 서비스, 모듈이 올바르게 등록되고 주입되었는지 확인하는 것이 포함됩니다. DI 컨테이너 구성을 테스트하면 잘못된 구성을 조기에 파악하여 런타임에만 발생할 수 있는 문제를 방지하는 데 도움이 됩니다.

IoC 컨테이너가 올바르게 설정되었는지 확인하기 위해 실제 모듈 구성을 로드하고 모든 제공자가 올바르게 등록 및 주입되었는지 확인하는 통합 테스트를 만들어 봅시다.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CatsModule } from './cats.module';
import { CatsService } from './cats.service';

describe('Cats Module Integration Test', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();
  });

  it('should resolve exported providers from the ioc container', () => {
    const catsService = moduleRef.get(CatsService);
    expect(catsService).toBeDefined();
  });
});
```

#### 단독, 협업, 통합, E2E 테스트 비교

#### 단독 단위 테스트 (Solitary Unit Tests)

- **초점**: 단일 단위(클래스)를 완전히 격리하여 테스트합니다.
- **사용 사례**: `CatsHttpService` 테스트.
- **도구**: Suites의 `TestBed.solitary()` 메서드.
- **예제**: `HttpClient`를 목으로 만들고 `CatsHttpService` 테스트.

#### 협업 단위 테스트 (Sociable Unit Tests)

- **초점**: 더 깊은 의존성을 목으로 만들면서 단위 간의 상호작용을 검증합니다.
- **사용 사례**: `CatsApiService`를 목으로 만들고 `CatsDAL`을 노출하여 `CatsService` 테스트.
- **도구**: Suites의 `TestBed.sociable()` 메서드.
- **예제**: `Prisma`를 목으로 만들고 `CatsService` 테스트.

#### 통합 테스트 (Integration Tests)

- **초점**: 실제 I/O 작업과 완전히 구성된 모듈(IoC 컨테이너)을 포함합니다.
- **사용 사례**: `HttpModule`과 `nock`을 사용하여 `CatsApiService` 테스트.
- **도구**: Nest의 `TestingModule`.
- **예제**: `HttpClient`의 실제 구성 및 상호작용 테스트.

#### E2E 테스트 (E2E Tests)

- **초점**: 더 높은 집합 수준에서 클래스와 모듈의 상호작용을 다룹니다.
- **사용 사례**: 최종 사용자 관점에서 시스템의 전체 동작 테스트.
- **도구**: Nest의 `TestingModule`, `supertest`.
- **예제**: HTTP 요청을 시뮬레이션하기 위해 `supertest`를 사용하여 `CatsModule` 테스트.

E2E 테스트 설정 및 실행에 대한 자세한 내용은 [NestJS 공식 테스트 가이드](https://nestjs.dokidocs.dev/fundamentals/testing#end-to-end-testing)를 참조하세요.
