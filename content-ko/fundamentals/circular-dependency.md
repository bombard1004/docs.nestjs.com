### 순환 종속성

순환 종속성은 두 클래스가 서로 의존할 때 발생합니다. 예를 들어, 클래스 A는 클래스 B가 필요하고, 클래스 B는 또한 클래스 A가 필요합니다. Nest에서는 모듈 간 또는 프로바이더 간에 순환 종속성이 발생할 수 있습니다.

가능한 순환 종속성을 피해야 하지만, 항상 피할 수는 없습니다. 이런 경우, Nest는 두 가지 방법으로 프로바이더 간의 순환 종속성을 해결할 수 있도록 합니다. 이 챕터에서는 한 가지 기술로 **전방 참조(forward referencing)**를 사용하는 방법과, 다른 방법으로 **ModuleRef** 클래스를 사용하여 DI 컨테이너에서 프로바이더 인스턴스를 검색하는 방법을 설명합니다.

또한 모듈 간의 순환 종속성을 해결하는 방법도 설명합니다.

> warning **주의** "배럴 파일"(index.ts 파일)을 사용하여 import를 그룹화할 때도 순환 종속성이 발생할 수 있습니다. 모듈/프로바이더 클래스의 경우 배럴 파일을 사용하지 않아야 합니다. 예를 들어, `cats/cats.controller`에서 같은 디렉토리 내의 파일을 import할 때, 즉 `cats/cats.service` 파일을 import하기 위해 `cats`를 import해서는 안 됩니다. 더 자세한 내용은 [이 GitHub 이슈](https://github.com/nestjs/nest/issues/1181#issuecomment-430197191)를 참조하십시오.

#### 전방 참조

**전방 참조(forward reference)**는 `forwardRef()` 유틸리티 함수를 사용하여 아직 정의되지 않은 클래스를 Nest가 참조할 수 있도록 합니다. 예를 들어, `CatsService`와 `CommonService`가 서로 의존하는 경우, 관계의 양쪽 모두에서 `@Inject()` 및 `forwardRef()` 유틸리티를 사용하여 순환 종속성을 해결할 수 있습니다. 그렇지 않으면 필수 메타데이터를 모두 사용할 수 없기 때문에 Nest는 인스턴스를 생성하지 않습니다. 예시는 다음과 같습니다:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CommonService))
export class CatsService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}
```

> info **팁** `forwardRef()` 함수는 `@nestjs/common` 패키지에서 import됩니다.

이것으로 관계의 한쪽은 처리되었습니다. 이제 `CommonService`에도 똑같이 해봅시다:

```typescript
@@filename(common.service)
@Injectable()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private catsService: CatsService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CatsService))
export class CommonService {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

> warning **주의** 인스턴스화 순서는 결정되지 않습니다. 코드가 어떤 생성자가 먼저 호출되는지에 의존하지 않도록 하십시오. 순환 종속성이 `Scope.REQUEST` 스코프를 가진 프로바이더에 의존하는 경우 정의되지 않은(undefined) 종속성으로 이어질 수 있습니다. 더 자세한 정보는 [여기](https://github.com/nestjs/nest/issues/5778)에서 확인할 수 있습니다.

#### ModuleRef 클래스 대안

`forwardRef()`를 사용하는 것 외에 다른 대안은 코드를 리팩토링하고 `ModuleRef` 클래스를 사용하여 (그렇지 않으면) 순환 관계의 한쪽에서 프로바이더를 검색하는 것입니다. `ModuleRef` 유틸리티 클래스에 대해 더 자세히 알아보려면 [여기](/fundamentals/module-ref)를 참조하세요.

#### 모듈 전방 참조

모듈 간의 순환 종속성을 해결하려면 모듈 연관 관계의 양쪽 모두에서 동일한 `forwardRef()` 유틸리티 함수를 사용하십시오. 예를 들면 다음과 같습니다:

```typescript
@@filename(common.module)
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```

이것으로 관계의 한쪽은 처리되었습니다. 이제 `CatsModule`에도 똑같이 해봅시다:

```typescript
@@filename(cats.module)
@Module({
  imports: [forwardRef(() => CommonModule)],
})
export class CatsModule {}
```