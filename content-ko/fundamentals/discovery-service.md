### 디스커버리 서비스

`@nestjs/core` 패키지에서 제공하는 `DiscoveryService`는 개발자가 NestJS 애플리케이션 내에서 프로바이더, 컨트롤러 및 기타 메타데이터를 동적으로 검사하고 검색할 수 있도록 하는 강력한 유틸리티입니다. 이는 런타임 인트로스펙션에 의존하는 플러그인, 데코레이터 또는 고급 기능을 구축할 때 특히 유용합니다. `DiscoveryService`를 활용함으로써 개발자는 더 유연하고 모듈화된 아키텍처를 만들 수 있으며, 애플리케이션에서 자동화 및 동적 동작을 활성화할 수 있습니다.

#### 시작하기

`DiscoveryService`를 사용하기 전에, 사용할 모듈에 `DiscoveryModule`을 임포트해야 합니다. 이렇게 하면 서비스가 의존성 주입을 위해 사용 가능하게 됩니다. 아래는 NestJS 모듈 내에서 이를 구성하는 방법의 예입니다.

```typescript
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ExampleService } from './example.service';

@Module({
  imports: [DiscoveryModule],
  providers: [ExampleService],
})
export class ExampleModule {}
```

모듈이 설정되면, `DiscoveryService`는 동적 디스커버리가 필요한 모든 프로바이더 또는 서비스에 주입될 수 있습니다.

```typescript
@@filename(example.service)
@Injectable()
export class ExampleService {
  constructor(private readonly discoveryService: DiscoveryService) {}
}
@@switch
@Injectable()
@Dependencies(DiscoveryService)
export class ExampleService {
  constructor(discoveryService) {
    this.discoveryService = discoveryService;
  }
}
```

#### 프로바이더 및 컨트롤러 디스커버리

`DiscoveryService`의 주요 기능 중 하나는 애플리케이션에 등록된 모든 프로바이더를 검색하는 것입니다. 이는 특정 조건에 따라 프로바이더를 동적으로 처리하는 데 유용합니다. 다음 스니펫은 모든 프로바이더에 액세스하는 방법을 보여줍니다.

```typescript
const providers = this.discoveryService.getProviders();
console.log(providers);
```

각 프로바이더 객체는 인스턴스, 토큰, 메타데이터와 같은 정보를 포함합니다. 유사하게, 애플리케이션 내에 등록된 모든 컨트롤러를 검색해야 하는 경우, 다음과 같이 할 수 있습니다.

```typescript
const controllers = this.discoveryService.getControllers();
console.log(controllers);
```

이 기능은 분석 추적 또는 자동 등록 메커니즘과 같이 컨트롤러를 동적으로 처리해야 하는 시나리오에 특히 유용합니다.

#### 메타데이터 추출

프로바이더와 컨트롤러를 디스커버리하는 것 외에도, `DiscoveryService`는 이러한 컴포넌트에 연결된 메타데이터 검색도 가능하게 합니다. 이는 런타임에 메타데이터를 저장하는 사용자 정의 데코레이터와 작업할 때 특히 유용합니다.

예를 들어, 사용자 정의 데코레이터가 특정 메타데이터로 프로바이더에 태그를 지정하는 데 사용되는 경우를 고려해 보세요.

```typescript
import { DiscoveryService } from '@nestjs/core';

export const FeatureFlag = DiscoveryService.createDecorator();
```

이 데코레이터를 서비스에 적용하면 나중에 쿼리할 수 있는 메타데이터를 저장할 수 있습니다.

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlag } from './custom-metadata.decorator';

@Injectable()
@FeatureFlag('experimental')
export class CustomService {}
```

이렇게 메타데이터가 프로바이더에 연결되면, `DiscoveryService`는 할당된 메타데이터를 기반으로 프로바이더를 쉽게 필터링할 수 있게 합니다. 다음 코드 스니펫은 특정 메타데이터 값으로 태그가 지정된 프로바이더를 검색하는 방법을 보여줍니다.

```typescript
const providers = this.discoveryService.getProviders();

const [provider] = providers.filter(
  (item) =>
    this.discoveryService.getMetadataByDecorator(FeatureFlag, item) ===
    'experimental',
);

console.log(
  '"experimental" 기능 플래그 메타데이터를 가진 프로바이더:',
  provider,
);
```

#### 결론

`DiscoveryService`는 NestJS 애플리케이션에서 런타임 인트로스펙션을 가능하게 하는 다재다능하고 강력한 도구입니다. 프로바이더, 컨트롤러 및 메타데이터의 동적 디스커버리를 허용함으로써 확장 가능한 프레임워크, 플러그인 및 자동화 중심 기능을 구축하는 데 중요한 역할을 합니다. 프로바이더를 스캔하고 처리하거나, 고급 처리를 위해 메타데이터를 추출하거나, 모듈식의 확장 가능한 아키텍처를 만들어야 하는 경우, `DiscoveryService`는 이러한 목표를 달성하기 위한 효율적이고 구조화된 접근 방식을 제공합니다.
