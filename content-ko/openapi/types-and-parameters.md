### 유형 및 매개변수

`SwaggerModule`은 API 문서를 생성하기 위해 라우트 핸들러의 모든 `@Body()`, `@Query()`, `@Param()` 데코레이터를 검색합니다. 또한 리플렉션을 활용하여 해당하는 모델 정의를 생성합니다. 다음 코드를 고려해보세요:

```typescript
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **힌트** 본문 정의를 명시적으로 설정하려면 `@ApiBody()` 데코레이터 (`@nestjs/swagger` 패키지에서 임포트)를 사용하세요.

`CreateCatDto`에 기반하여 다음과 같은 모델 정의 Swagger UI가 생성됩니다:

<figure><img src="/assets/swagger-dto.png" /></figure>

보시다시피, 클래스에 선언된 속성이 몇 개 있지만 정의는 비어 있습니다. 클래스 속성이 `SwaggerModule`에 표시되도록 하려면 `@ApiProperty()` 데코레이터로 주석을 달거나, 자동으로 처리해주는 CLI 플러그인(자세한 내용은 **플러그인** 섹션 참조)을 사용해야 합니다:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

> info **힌트** 각 속성에 수동으로 주석을 다는 대신 Swagger 플러그인( [플러그인](/openapi/cli-plugin) 섹션 참조)을 사용하여 자동으로 처리하는 것을 고려해보세요.

브라우저를 열어 생성된 `CreateCatDto` 모델을 확인해봅시다:

<figure><img src="/assets/swagger-dto2.png" /></figure>

또한 `@ApiProperty()` 데코레이터는 다양한 [스키마 객체](https://swagger.io/specification/#schemaObject) 속성을 설정할 수 있도록 합니다:

```typescript
@ApiProperty({
  description: '고양이의 나이',
  minimum: 1,
  default: 1,
})
age: number;
```

> info **힌트** `{{"@ApiProperty({ required: false })"}}`를 명시적으로 입력하는 대신 `@ApiPropertyOptional()` 축약 데코레이터를 사용할 수 있습니다.

속성의 타입을 명시적으로 설정하려면 `type` 키를 사용하세요:

```typescript
@ApiProperty({
  type: Number,
})
age: number;
```

#### 배열

속성이 배열일 때는 다음과 같이 배열 타입을 수동으로 표시해야 합니다:

```typescript
@ApiProperty({ type: [String] })
names: string[];
```

> info **힌트** 배열을 자동으로 감지하는 Swagger 플러그인( [플러그인](/openapi/cli-cli) 섹션 참조) 사용을 고려해 보세요.

위에서 보여준 것처럼 배열의 첫 번째 요소로 타입을 포함시키거나, `isArray` 속성을 `true`로 설정하세요.

<app-banner-enterprise></app-banner-enterprise>

#### 순환 종속성

클래스 간에 순환 종속성이 있는 경우, `SwaggerModule`에 타입 정보를 제공하기 위해 지연 함수(lazy function)를 사용하세요:

```typescript
@ApiProperty({ type: () => Node })
node: Node;
```

> info **힌트** 순환 종속성을 자동으로 감지하는 Swagger 플러그인( [플러그인](/openapi/cli-plugin) 섹션 참조) 사용을 고려해 보세요.

#### 제네릭 및 인터페이스

TypeScript는 제네릭 또는 인터페이스에 대한 메타데이터를 저장하지 않기 때문에 DTO에서 사용할 때, `SwaggerModule`은 런타임에 모델 정의를 올바르게 생성하지 못할 수 있습니다. 예를 들어, 다음 코드는 Swagger 모듈에 의해 올바르게 검사되지 않습니다:

```typescript
createBulk(@Body() usersDto: CreateUserDto[])
```

이러한 제한을 극복하기 위해 타입을 명시적으로 설정할 수 있습니다:

```typescript
@ApiBody({ type: [CreateUserDto] })
createBulk(@Body() usersDto: CreateUserDto[])
```

#### Enum

`enum`을 식별하기 위해 `@ApiProperty`의 `enum` 속성을 값 배열로 수동으로 설정해야 합니다.

```typescript
@ApiProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;
```

또는 다음과 같이 실제 TypeScript enum을 정의할 수 있습니다:

```typescript
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User',
}
```

그런 다음 `@ApiQuery()` 데코레이터와 함께 `@Query()` 매개변수 데코레이터에 enum을 직접 사용할 수 있습니다.

```typescript
@ApiQuery({ name: 'role', enum: UserRole })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {}
```

<figure><img src="/assets/enum_query.gif" /></figure>

`isArray`를 **true**로 설정하면 `enum`을 **다중 선택**으로 선택할 수 있습니다:

<figure><img src="/assets/enum_query_array.gif" /></figure>

#### Enum 스키마

기본적으로 `enum` 속성은 매개변수에 [Enum](https://swagger.io/docs/specification/data-models/enums/)의 원시 정의를 추가합니다.

```yaml
- breed:
    type: 'string'
    enum:
      - Persian
      - Tabby
      - Siamese
```

위 스펙은 대부분의 경우에 잘 작동합니다. 그러나 스펙을 **입력**으로 받아 **클라이언트 측** 코드를 생성하는 도구를 사용하는 경우, 생성된 코드에 `enums`가 중복되는 문제가 발생할 수 있습니다. 다음 코드 스니펫을 고려해보세요:

```typescript
// 생성된 클라이언트 측 코드
export class CatDetail {
  breed: CatDetailEnum;
}

export class CatInformation {
  breed: CatInformationEnum;
}

export enum CatDetailEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}

export enum CatInformationEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}
```

> info **힌트** 위의 스니펫은 [NSwag](https://github.com/RicoSuter/NSwag)라는 도구를 사용하여 생성되었습니다.

이제 똑같은 두 개의 `enums`가 있는 것을 볼 수 있습니다.
이 문제를 해결하기 위해 데코레이터의 `enum` 속성과 함께 `enumName`을 전달할 수 있습니다.

```typescript
export class CatDetail {
  @ApiProperty({ enum: CatBreed, enumName: 'CatBreed' })
  breed: CatBreed;
}
```

`enumName` 속성은 `@nestjs/swagger`가 `CatBreed`를 자체적인 `schema`로 변환하여 `CatBreed` enum을 재사용할 수 있도록 합니다. 스펙은 다음과 같이 보일 것입니다:

```yaml
CatDetail:
  type: 'object'
  properties:
    ...
    - breed:
        schema:
          $ref: '#/components/schemas/CatBreed'
CatBreed:
  type: string
  enum:
    - Persian
    - Tabby
    - Siamese
```

> info **힌트** `enum`을 속성으로 사용하는 모든 **데코레이터**는 `enumName`도 함께 받습니다.

#### 속성 값 예시

`example` 키를 사용하여 속성에 대한 단일 예시를 설정할 수 있습니다:

```typescript
@ApiProperty({
  example: 'persian',
})
breed: string;
```

여러 예시를 제공하고 싶다면, 다음과 같이 구조화된 객체를 `examples` 키에 전달할 수 있습니다:

```typescript
@ApiProperty({
  examples: {
    Persian: { value: 'persian' },
    Tabby: { value: 'tabby' },
    Siamese: { value: 'siamese' },
    'Scottish Fold': { value: 'scottish_fold' },
  },
})
breed: string;
```

#### 원시 정의

깊게 중첩된 배열이나 행렬과 같은 특정 경우에는 타입을 수동으로 정의해야 할 수 있습니다:

```typescript
@ApiProperty({
  type: 'array',
  items: {
    type: 'array',
    items: {
      type: 'number',
    },
  },
})
coords: number[][];
```

다음과 같이 원시 객체 스키마를 지정할 수도 있습니다:

```typescript
@ApiProperty({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Error'
    },
    status: {
      type: 'number',
      example: 400
    }
  },
  required: ['name', 'status']
})
rawDefinition: Record<string, any>;
```

컨트롤러 클래스에서 입/출력 콘텐츠를 수동으로 정의하려면 `schema` 속성을 사용하세요:

```typescript
@ApiBody({
  schema: {
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
})
async create(@Body() coords: number[][]) {}
```

#### 추가 모델

컨트롤러에서 직접 참조되지 않지만 Swagger 모듈에 의해 검사되어야 하는 추가 모델을 정의하려면 `@ApiExtraModels()` 데코레이터를 사용하세요:

```typescript
@ApiExtraModels(ExtraModel)
export class CreateCatDto {}
```

> info **힌트** 특정 모델 클래스에 대해 `@ApiExtraModels()`는 한 번만 사용하면 됩니다.

또는 다음과 같이 `extraModels` 속성이 지정된 옵션 객체를 `SwaggerModule#createDocument()` 메서드에 전달할 수 있습니다:

```typescript
const documentFactory = () =>
  SwaggerModule.createDocument(app, options, {
    extraModels: [ExtraModel],
  });
```

모델에 대한 참조(`$ref`)를 얻으려면 `getSchemaPath(ExtraModel)` 함수를 사용하세요:

```typescript
'application/vnd.api+json': {
   schema: { $ref: getSchemaPath(ExtraModel) },
},
```

#### oneOf, anyOf, allOf

스키마를 결합하려면 `oneOf`, `anyOf` 또는 `allOf` 키워드를 사용할 수 있습니다([자세히 보기](https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/)).

```typescript
@ApiProperty({
  oneOf: [
    { $ref: getSchemaPath(Cat) },
    { $ref: getSchemaPath(Dog) },
  ],
})
pet: Cat | Dog;
```

다형성 배열(즉, 멤버가 여러 스키마에 걸쳐 있는 배열)을 정의하려면 원시 정의(위 참조)를 사용하여 타입을 직접 정의해야 합니다.

```typescript
type Pet = Cat | Dog;

@ApiProperty({
  type: 'array',
  items: {
    oneOf: [
      { $ref: getSchemaPath(Cat) },
      { $ref: getSchemaPath(Dog) },
    ],
  },
})
pets: Pet[];
```

> info **힌트** `getSchemaPath()` 함수는 `@nestjs/swagger`에서 임포트됩니다.

`Cat`과 `Dog`는 클래스 레벨에서 `@ApiExtraModels()` 데코레이터를 사용하여 추가 모델로 정의되어야 합니다.

#### 스키마 이름 및 설명

눈치채셨겠지만, 생성된 스키마의 이름은 원래 모델 클래스의 이름에 기반합니다(예: `CreateCatDto` 모델은 `CreateCatDto` 스키마를 생성합니다). 스키마 이름을 변경하고 싶다면 `@ApiSchema()` 데코레이터를 사용할 수 있습니다.

예시는 다음과 같습니다:

```typescript
@ApiSchema({ name: 'CreateCatRequest' })
class CreateCatDto {}
```

위 모델은 `CreateCatRequest` 스키마로 변환될 것입니다.

기본적으로 생성된 스키마에는 설명이 추가되지 않습니다. `description` 속성을 사용하여 설명을 추가할 수 있습니다:

```typescript
@ApiSchema({ description: 'CreateCatDto 스키마에 대한 설명' })
class CreateCatDto {}
```

이렇게 하면 다음과 같이 스키마에 설명이 포함됩니다:

```yaml
schemas:
  CreateCatDto:
    type: object
    description: CreateCatDto 스키마에 대한 설명
```
