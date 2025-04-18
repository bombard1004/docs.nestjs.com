### 직렬화 (Serialization)

직렬화는 객체가 네트워크 응답으로 반환되기 전에 발생하는 프로세스입니다. 이는 클라이언트에 반환될 데이터를 변환하고 정제하기 위한 규칙을 제공하기에 적합한 위치입니다. 예를 들어, 비밀번호와 같은 민감한 데이터는 응답에서 항상 제외되어야 합니다. 또는 특정 속성은 엔티티 속성의 일부만 보내는 것과 같이 추가 변환이 필요할 수 있습니다. 이러한 변환을 수동으로 수행하는 것은 번거롭고 오류가 발생하기 쉬우며, 모든 경우를 다루었는지 확신할 수 없게 만듭니다.

#### 개요 (Overview)

Nest는 이러한 작업이 간단하게 수행될 수 있도록 돕는 내장 기능을 제공합니다. `ClassSerializerInterceptor` 인터셉터는 강력한 [class-transformer](https://github.com/typestack/class-transformer) 패키지를 사용하여 객체를 변환하는 선언적이고 확장 가능한 방법을 제공합니다. 인터셉터가 수행하는 기본 작업은 메서드 핸들러가 반환하는 값을 가져와 [class-transformer](https://github.com/typestack/class-transformer)의 `instanceToPlain()` 함수를 적용하는 것입니다. 이렇게 함으로써 아래에 설명된 대로 엔티티/DTO 클래스에 `class-transformer` 데코레이터로 표현된 규칙을 적용할 수 있습니다.

> info **힌트** 직렬화는 [StreamableFile](https://nestjs.dokidocs.dev/techniques/streaming-files#streamable-file-class) 응답에는 적용되지 않습니다.

#### 속성 제외 (Exclude properties)

사용자 엔티티에서 `password` 속성을 자동으로 제외한다고 가정해 보겠습니다. 다음과 같이 엔티티에 주석을 추가합니다:

```typescript
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```

이제 이 클래스의 인스턴스를 반환하는 메서드 핸들러가 있는 컨트롤러를 살펴보겠습니다.

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    password: 'password',
  });
}
```

> **경고** 클래스의 인스턴스를 반환해야 함에 유의하십시오. 예를 들어 `{{ '{' }} user: new UserEntity() {{ '}' }}`와 같은 일반 JavaScript 객체를 반환하면 객체가 제대로 직렬화되지 않습니다.

> info **힌트** `ClassSerializerInterceptor`는 `@nestjs/common`에서 임포트됩니다.

이 엔드포인트가 요청되면 클라이언트는 다음 응답을 받습니다.

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe"
}
```

인터셉터는 애플리케이션 전반에 적용될 수 있습니다([여기](https://nestjs.dokidocs.dev/interceptors#binding-interceptors)에서 설명). 인터셉터와 엔티티 클래스 선언의 조합은 `UserEntity`를 반환하는 **모든** 메서드가 `password` 속성을 확실히 제거하도록 보장합니다. 이를 통해 이 비즈니스 규칙에 대한 중앙 집중식 시행 조치를 얻을 수 있습니다.

#### 속성 노출 (Expose properties)

`@Expose()` 데코레이터를 사용하여 속성에 대한 별칭 이름을 제공하거나, 아래와 같이 속성 값을 계산하는 함수( **게터(getter)** 함수와 유사)를 실행할 수 있습니다.

```typescript
@Expose()
get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
}
```

#### 변환 (Transform)

`@Transform()` 데코레이터를 사용하여 추가 데이터 변환을 수행할 수 있습니다. 예를 들어, 다음 구조는 전체 `RoleEntity` 객체를 반환하는 대신 `RoleEntity`의 이름 속성을 반환합니다.

```typescript
@Transform(({ value }) => value.name)
role: RoleEntity;
```

#### 옵션 전달 (Pass options)

변환 함수의 기본 동작을 수정하고 싶을 수 있습니다. 기본 설정을 재정의하려면 `@SerializeOptions()` 데코레이터와 함께 `options` 객체로 전달합니다.

```typescript
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return new UserEntity();
}
```

> info **힌트** `@SerializeOptions()` 데코레이터는 `@nestjs/common`에서 임포트됩니다.

`@SerializeOptions()`를 통해 전달된 옵션은 내부 `instanceToPlain()` 함수의 두 번째 인자로 전달됩니다. 이 예제에서는 `_` 접두사로 시작하는 모든 속성을 자동으로 제외하고 있습니다.

#### 일반 객체 변환 (Transform plain objects)

`@SerializeOptions` 데코레이터를 사용하여 컨트롤러 수준에서 변환을 강제할 수 있습니다. 이렇게 하면 일반 객체가 반환되는 경우에도 모든 응답이 지정된 클래스의 인스턴스로 변환되어 class-validator 또는 class-transformer의 모든 데코레이터가 적용됩니다. 이 접근 방식은 클래스를 반복적으로 인스턴스화하거나 `plainToInstance`를 호출할 필요 없이 더 깔끔한 코드를 가능하게 합니다.

아래 예제에서는 두 조건부 분기 모두에서 일반 JavaScript 객체를 반환하지만, 관련 데코레이터가 적용되어 자동으로 `UserEntity` 인스턴스로 변환됩니다.

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: UserEntity })
@Get()
findOne(@Query() { id }: { id: number }): UserEntity {
  if (id === 1) {
    return {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      password: 'password',
    };
  }

  return {
    id: 2,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password2',
  };
}
```

> info **힌트** 컨트롤러에 대해 예상되는 반환 타입을 지정함으로써, 반환된 일반 객체가 DTO 또는 엔티티의 형태를 준수하는지 확인하기 위해 TypeScript의 타입 검사 기능을 활용할 수 있습니다. `plainToInstance` 함수는 이러한 수준의 타입 힌트를 제공하지 않아, 일반 객체가 예상되는 DTO 또는 엔티티 구조와 일치하지 않을 경우 잠재적인 버그로 이어질 수 있습니다.

#### 예제 (Example)

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/21-serializer)에서 사용할 수 있습니다.

#### WebSockets 및 Microservices

이 장에서는 HTTP 스타일 애플리케이션(예: Express 또는 Fastify)을 사용한 예제를 보여주지만, `ClassSerializerInterceptor`는 사용되는 전송 방식에 관계없이 WebSockets 및 Microservices에서도 동일하게 작동합니다.

#### 더 알아보기 (Learn more)

`class-transformer` 패키지에서 제공하는 사용 가능한 데코레이터 및 옵션에 대한 자세한 내용은 [여기](https://github.com/typestack/class-transformer)에서 읽어보십시오.
