### 유효성 검증

웹 애플리케이션으로 전송되는 모든 데이터의 정확성을 검증하는 것은 좋은 습관입니다. Nest는 들어오는 요청을 자동으로 검증하기 위해 즉시 사용할 수 있는 여러 파이프를 제공합니다:

- `ValidationPipe`
- `ParseIntPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`

`ValidationPipe`는 강력한 [class-validator](https://github.com/typestack/class-validator) 패키지와 선언적 유효성 검사 데코레이터를 활용합니다. `ValidationPipe`는 들어오는 모든 클라이언트 페이로드에 대한 유효성 검사 규칙을 적용하는 편리한 접근 방식을 제공하며, 특정 규칙은 각 모듈의 로컬 클래스/DTO 선언에 간단한 애너테이션으로 선언됩니다.

#### 개요

[파이프](/pipes) 챕터에서, 우리는 간단한 파이프를 구축하고 컨트롤러, 메소드 또는 전역 앱에 바인딩하여 프로세스가 어떻게 작동하는지 시연했습니다. 이 챕터의 주제를 더 잘 이해하기 위해 해당 챕터를 다시 살펴보세요. 여기서는 `ValidationPipe`의 다양한 **실제** 사용 사례에 초점을 맞추고, 일부 고급 커스터마이징 기능을 사용하는 방법을 보여드리겠습니다.

#### 내장 ValidationPipe 사용하기

사용을 시작하려면 먼저 필요한 의존성을 설치해야 합니다.

```bash
$ npm i --save class-validator class-transformer
```

> info **힌트** `ValidationPipe`는 `@nestjs/common` 패키지에서 익스포트됩니다.

이 파이프는 [`class-validator`](https://github.com/typestack/class-validator) 및 [`class-transformer`](https://github.com/typestack/class-transformer) 라이브러리를 사용하므로 다양한 옵션을 사용할 수 있습니다. 이러한 설정은 파이프에 전달되는 설정 객체를 통해 구성합니다. 다음은 내장 옵션입니다:

```typescript
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

이 외에도 모든 `class-validator` 옵션 (`ValidatorOptions` 인터페이스에서 상속됨)을 사용할 수 있습니다:

<table>
  <tr>
    <th>옵션</th>
    <th>타입</th>
    <th>설명</th>
  </tr>
  <tr>
    <td><code>enableDebugMessages</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 검증기가 뭔가 잘못되었을 때 추가 경고 메시지를 콘솔에 출력합니다.</td>
  </tr>
  <tr>
    <td><code>skipUndefinedProperties</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 검증 대상 객체에서 undefined인 모든 속성의 유효성 검사를 건너뜁니다.</td>
  </tr>
  <tr>
    <td><code>skipNullProperties</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 검증 대상 객체에서 null인 모든 속성의 유효성 검사를 건너뜁니다.</td>
  </tr>
  <tr>
    <td><code>skipMissingProperties</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 검증 대상 객체에서 null 또는 undefined인 모든 속성의 유효성 검사를 건너뜁니다.</td>
  </tr>
  <tr>
    <td><code>whitelist</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 검증된 (반환된) 객체에서 유효성 검사 데코레이터를 사용하지 않은 속성을 모두 제거합니다.</td>
  </tr>
  <tr>
    <td><code>forbidNonWhitelisted</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 화이트리스트에 없는 속성을 제거하는 대신 예외를 발생시킵니다.</td>
  </tr>
  <tr>
    <td><code>forbidUnknownValues</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 알 수 없는 객체를 검증하려는 시도는 즉시 실패합니다.</td>
  </tr>
  <tr>
    <td><code>disableErrorMessages</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 유효성 검사 오류가 클라이언트에게 반환되지 않습니다.</td>
  </tr>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><code>number</code></td>
    <td>이 설정을 사용하면 오류 발생 시 어떤 예외 타입이 사용될지 지정할 수 있습니다. 기본적으로 <code>BadRequestException</code>을 던집니다.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Function</code></td>
    <td>유효성 검사 오류 배열을 받아 던질 예외 객체를 반환합니다.</td>
  </tr>
  <tr>
    <td><code>groups</code></td>
    <td><code>string[]</code></td>
    <td>객체 유효성 검사 중에 사용할 그룹입니다.</td>
  </tr>
  <tr>
    <td><code>always</code></td>
    <td><code>boolean</code></td>
    <td>데코레이터의 <code>always</code> 옵션에 대한 기본값을 설정합니다. 기본값은 데코레이터 옵션에서 재정의될 수 있습니다.</td>
  </tr>

  <tr>
    <td><code>strictGroups</code></td>
    <td><code>boolean</code></td>
    <td><code>groups</code>가 주어지지 않았거나 비어 있는 경우, 하나 이상의 그룹을 가진 데코레이터를 무시합니다.</td>
  </tr>
  <tr>
    <td><code>dismissDefaultMessages</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 유효성 검사는 기본 메시지를 사용하지 않습니다. 오류 메시지는 명시적으로 설정되지 않으면 항상 <code>undefined</code>입니다.</td>
  </tr>
  <tr>
    <td><code>validationError.target</code></td>
    <td><code>boolean</code></td>
    <td><code>ValidationError</code>에 대상이 노출되어야 하는지 여부를 나타냅니다.</td>
  </tr>
  <tr>
    <td><code>validationError.value</code></td>
    <td><code>boolean</code></td>
    <td><code>ValidationError</code>에 검증된 값이 노출되어야 하는지 여부를 나타냅니다.</td>
  </tr>
  <tr>
    <td><code>stopAtFirstError</code></td>
    <td><code>boolean</code></td>
    <td>true로 설정하면, 주어진 속성의 유효성 검사는 첫 번째 오류를 만난 후 중단됩니다. 기본값은 false입니다.</td>
  </tr>
</table>

> info **참고** `class-validator` 패키지에 대한 자세한 정보는 [리포지토리](https://github.com/typestack/class-validator)에서 찾을 수 있습니다.

#### 자동 유효성 검사

`ValidationPipe`를 애플리케이션 레벨에 바인딩하여 모든 엔드포인트가 잘못된 데이터를 받지 않도록 보호하는 것부터 시작하겠습니다.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

파이프를 테스트하기 위해 간단한 엔드포인트를 만들어 보겠습니다.

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

> info **힌트** TypeScript는 **제네릭 또는 인터페이스**에 대한 메타데이터를 저장하지 않으므로 DTO에서 이러한 타입을 사용하는 경우, `ValidationPipe`가 들어오는 데이터를 제대로 검증하지 못할 수 있습니다. 따라서 DTO에서는 구체적인 클래스를 사용하는 것이 좋습니다.

> info **힌트** DTO를 임포트할 때, 런타임에 지워지는 타입 전용 임포트를 사용할 수 없습니다. 즉, `import type {{ '{' }} CreateUserDto {{ '}' }}` 대신 `import {{ '{' }} CreateUserDto {{ '}' }}`와 같이 임포트해야 합니다.

이제 `CreateUserDto`에 몇 가지 유효성 검사 규칙을 추가할 수 있습니다. 이는 `class-validator` 패키지에서 제공하는 데코레이터를 사용하여 수행하며, [여기](https://github.com/typestack/class-validator#validation-decorators)에 자세히 설명되어 있습니다. 이러한 방식으로 `CreateUserDto`를 사용하는 모든 라우트는 자동으로 이 유효성 검사 규칙을 적용합니다.

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

이 규칙이 적용되면, 요청 본문의 `email` 속성에 잘못된 값이 포함된 요청이 엔드포인트에 도달하면, 애플리케이션은 다음과 같은 응답 본문과 함께 자동으로 `400 Bad Request` 코드로 응답합니다:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

`ValidationPipe`는 요청 본문 외에도 다른 요청 객체 속성과 함께 사용할 수 있습니다. 엔드포인트 경로에 `:id`를 허용하고 싶다고 상상해 보세요. 이 요청 파라미터에 숫자만 허용되도록 보장하기 위해 다음 구성을 사용할 수 있습니다:

```typescript
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```

`FindOneParams`는 DTO와 마찬가지로 `class-validator`를 사용하여 유효성 검사 규칙을 정의하는 단순한 클래스입니다. 다음과 같습니다:

```typescript
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: string;
}
```

#### 상세 오류 비활성화

오류 메시지는 요청에서 무엇이 잘못되었는지 설명하는 데 도움이 될 수 있습니다. 그러나 일부 프로덕션 환경에서는 상세 오류를 비활성화하는 것을 선호합니다. `ValidationPipe`에 옵션 객체를 전달하여 이를 수행할 수 있습니다:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    disableErrorMessages: true,
  }),
);
```

결과적으로 응답 본문에 상세 오류 메시지가 표시되지 않습니다.

#### 속성 제거 (Stripping properties)

`ValidationPipe`는 메소드 핸들러가 받아서는 안 되는 속성을 필터링할 수도 있습니다. 이 경우 허용 가능한 속성을 **화이트리스트**로 지정할 수 있으며, 화이트리스트에 포함되지 않은 모든 속성은 결과 객체에서 자동으로 제거됩니다. 예를 들어, 핸들러가 `email` 및 `password` 속성을 예상하지만 요청에 `age` 속성도 포함된 경우, 이 속성은 결과 DTO에서 자동으로 제거될 수 있습니다. 이러한 동작을 활성화하려면 `whitelist`를 `true`로 설정합니다.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

true로 설정하면 유효성 검사 클래스에 데코레이터가 없는 속성(즉, 화이트리스트에 없는 속성)이 자동으로 제거됩니다.

또는 화이트리스트에 없는 속성이 있을 때 요청 처리를 중단하고 사용자에게 오류 응답을 반환할 수 있습니다. 이를 활성화하려면 `whitelist`를 `true`로 설정하는 것과 함께 `forbidNonWhitelisted` 옵션 속성을 `true`로 설정합니다.

<app-banner-courses></app-banner-courses>

#### 페이로드 객체 변환

네트워크를 통해 들어오는 페이로드는 일반 JavaScript 객체입니다. `ValidationPipe`는 페이로드를 DTO 클래스에 따라 타입이 지정된 객체로 자동으로 변환할 수 있습니다. 자동 변환을 활성화하려면 `transform`을 `true`로 설정합니다. 이는 메소드 레벨에서 수행할 수 있습니다:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

이 동작을 전역적으로 활성화하려면 전역 파이프에 옵션을 설정합니다:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
);
```

자동 변환 옵션이 활성화되면 `ValidationPipe`는 원시 타입 변환도 수행합니다. 다음 예제에서 `findOne()` 메소드는 추출된 `id` 경로 매개변수를 나타내는 하나의 인수를 받습니다:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

기본적으로 모든 경로 매개변수 및 쿼리 매개변수는 네트워크를 통해 `string`으로 전달됩니다. 위 예제에서는 `id` 타입을 `number`로 지정했습니다 (메소드 시그니처에서). 따라서 `ValidationPipe`는 문자열 식별자를 숫자로 자동 변환하려고 시도합니다.

#### 명시적 변환

위 섹션에서는 `ValidationPipe`가 예상되는 타입에 따라 쿼리 및 경로 매개변수를 암시적으로 변환하는 방법을 보여주었습니다. 그러나 이 기능은 자동 변환이 활성화되어 있어야 합니다.

대안으로 (자동 변환이 비활성화된 경우), `ParseIntPipe` 또는 `ParseBoolPipe`를 사용하여 값을 명시적으로 캐스트할 수 있습니다 (`ParseStringPipe`는 앞서 언급했듯이 모든 경로 매개변수 및 쿼리 매개변수가 기본적으로 네트워크를 통해 `string`으로 전달되기 때문에 필요하지 않습니다).

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
```

> info **힌트** `ParseIntPipe` 및 `ParseBoolPipe`는 `@nestjs/common` 패키지에서 익스포트됩니다.

#### 매핑된 타입 (Mapped types)

**CRUD** (생성/읽기/업데이트/삭제)와 같은 기능을 구축할 때 기본 엔티티 타입의 변형을 구성하는 것이 유용할 때가 많습니다. Nest는 이 작업을 더 편리하게 만들기 위해 타입 변환을 수행하는 여러 유틸리티 함수를 제공합니다.

> **경고** 애플리케이션이 `@nestjs/swagger` 패키지를 사용하는 경우, 매핑된 타입에 대한 자세한 정보는 [이 챕터](/openapi/mapped-types)를 참조하십시오. 마찬가지로 `@nestjs/graphql` 패키지를 사용하는 경우 [이 챕터](/graphql/mapped-types)를 참조하십시오. 두 패키지 모두 타입에 크게 의존하므로 다른 임포트가 필요합니다. 따라서 `@nestjs/mapped-types` (앱 타입에 따라 적절한 `@nestjs/swagger` 또는 `@nestjs/graphql` 대신)을 사용한 경우 다양한 문서화되지 않은 부작용에 직면할 수 있습니다.

입력 유효성 검사 타입 (DTO라고도 함)을 구축할 때 동일한 타입에 대한 **생성** 및 **업데이트** 변형을 구축하는 것이 유용할 때가 많습니다. 예를 들어, **생성** 변형은 모든 필드를 요구할 수 있지만, **업데이트** 변형은 모든 필드를 선택 사항으로 만들 수 있습니다.

Nest는 이 작업을 더 쉽게 하고 상용구 코드를 최소화하기 위해 `PartialType()` 유틸리티 함수를 제공합니다.

`PartialType()` 함수는 입력 타입의 모든 속성이 선택 사항으로 설정된 타입 (클래스)을 반환합니다. 예를 들어, 다음과 같은 **생성** 타입이 있다고 가정합니다:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

기본적으로 이 필드는 모두 필수입니다. 동일한 필드를 가지지만 각 필드가 선택 사항인 타입을 생성하려면 `PartialType()`에 클래스 참조 (`CreateCatDto`)를 인수로 전달하여 사용합니다:

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

> info **힌트** `PartialType()` 함수는 `@nestjs/mapped-types` 패키지에서 임포트됩니다.

`PickType()` 함수는 입력 타입에서 속성 집합을 선택하여 새 타입 (클래스)을 구성합니다. 예를 들어, 다음과 같은 타입에서 시작한다고 가정합니다:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

`PickType()` 유틸리티 함수를 사용하여 이 클래스에서 속성 집합을 선택할 수 있습니다:

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

> info **힌트** `PickType()` 함수는 `@nestjs/mapped-types` 패키지에서 임포트됩니다.

`OmitType()` 함수는 입력 타입에서 모든 속성을 선택한 다음 특정 키 집합을 제거하여 타입을 구성합니다. 예를 들어, 다음과 같은 타입에서 시작한다고 가정합니다:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

다음과 같이 `name`을 **제외한** 모든 속성을 가진 파생된 타입을 생성할 수 있습니다. 이 구성에서 `OmitType`의 두 번째 인수는 속성 이름의 배열입니다.

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

> info **힌트** `OmitType()` 함수는 `@nestjs/mapped-types` 패키지에서 임포트됩니다.

`IntersectionType()` 함수는 두 타입을 하나로 결합하여 새로운 타입 (클래스)을 만듭니다. 예를 들어, 다음과 같은 두 타입에서 시작한다고 가정합니다:

```typescript
export class CreateCatDto {
  name: string;
  breed: string;
}

export class AdditionalCatInfo {
  color: string;
}
```

두 타입의 모든 속성을 결합한 새 타입을 생성할 수 있습니다.

```typescript
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

> info **힌트** `IntersectionType()` 함수는 `@nestjs/mapped-types` 패키지에서 임포트됩니다.

타입 매핑 유틸리티 함수는 조합 가능합니다. 예를 들어, 다음은 `CreateCatDto` 타입의 `name`을 제외한 모든 속성을 가지며, 이 속성들이 선택 사항으로 설정된 타입 (클래스)을 생성합니다:

```typescript
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```

#### 배열 파싱 및 유효성 검사

TypeScript는 제네릭 또는 인터페이스에 대한 메타데이터를 저장하지 않으므로 DTO에서 이러한 타입을 사용하는 경우, `ValidationPipe`가 들어오는 데이터를 제대로 검증하지 못할 수 있습니다. 예를 들어, 다음 코드에서 `createUserDtos`는 올바르게 검증되지 않습니다:

```typescript
@Post()
createBulk(@Body() createUserDtos: CreateUserDto[]) {
  return 'This action adds new users';
}
```

배열의 유효성을 검사하려면 배열을 래핑하는 속성을 포함하는 전용 클래스를 생성하거나 `ParseArrayPipe`를 사용하십시오.

```typescript
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
```

또한 `ParseArrayPipe`는 쿼리 매개변수를 파싱할 때 유용하게 사용될 수 있습니다. 쿼리 매개변수로 전달된 식별자를 기반으로 사용자를 반환하는 `findByIds()` 메소드를 고려해 보겠습니다.

```typescript
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
```

이 구성은 다음과 같은 HTTP `GET` 요청에서 들어오는 쿼리 매개변수를 검증합니다:

```bash
GET /?ids=1,2,3
```

#### WebSockets 및 마이크로서비스

이 챕터에서는 HTTP 스타일 애플리케이션 (예: Express 또는 Fastify)을 사용한 예제를 보여주지만, `ValidationPipe`는 사용되는 전송 방식에 관계없이 WebSockets 및 마이크로서비스에서도 동일하게 작동합니다.

#### 더 알아보기

`class-validator` 패키지에서 제공하는 사용자 정의 유효성 검사기, 오류 메시지 및 사용 가능한 데코레이터에 대한 자세한 내용은 [여기](https://github.com/typestack/class-validator)에서 확인할 수 있습니다.
