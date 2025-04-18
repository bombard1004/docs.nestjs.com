### CRUD 생성기 (TypeScript 전용)

프로젝트의 수명 주기 동안 새로운 기능을 구축할 때 애플리케이션에 새로운 리소스를 추가해야 하는 경우가 많습니다. 이러한 리소스는 일반적으로 새로운 리소스를 정의할 때마다 반복해야 하는 여러 반복적인 작업을 필요로 합니다.

#### 소개

두 개의 엔티티, 예를 들어 **User** 및 **Product** 엔티티에 대한 CRUD 엔드포인트를 노출해야 하는 실제 시나리오를 상상해 보겠습니다.
모범 사례에 따르면 각 엔티티에 대해 다음과 같이 여러 작업을 수행해야 합니다.

- 모듈 생성(`nest g mo`) - 코드를 정리하고 명확한 경계 설정(관련 컴포넌트 그룹화)을 위해
- 컨트롤러 생성(`nest g co`) - CRUD 라우트 정의 (또는 GraphQL 애플리케이션의 경우 쿼리/뮤테이션)
- 서비스 생성(`nest g s`) - 비즈니스 로직 구현 및 격리
- 엔티티 클래스/인터페이스 생성 - 리소스 데이터 형태를 표현
- Data Transfer Object (DTO) 생성 (또는 GraphQL 애플리케이션의 경우 입력) - 데이터가 네트워크를 통해 어떻게 전송될지 정의

단계가 정말 많습니다!

이 반복적인 프로세스의 속도를 높이기 위해 [Nest CLI](/cli/overview)는 이 모든 작업을 피하고 개발자 경험을 훨씬 단순하게 만드는 데 도움이 되는 모든 상용구 코드를 자동으로 생성하는 생성기(스키매틱)를 제공합니다.

> info **참고** 이 스키매틱은 **HTTP** 컨트롤러, **Microservice** 컨트롤러, **GraphQL** 리졸버(코드 우선 및 스키마 우선), **WebSocket** 게이트웨이 생성을 지원합니다.

#### 새 리소스 생성

새 리소스를 생성하려면 프로젝트의 루트 디렉토리에서 다음 명령을 실행하십시오.

```shell
$ nest g resource
```

`nest g resource` 명령은 모든 NestJS 구성 요소(모듈, 서비스, 컨트롤러 클래스)뿐만 아니라 엔티티 클래스, DTO 클래스 및 테스트(`.spec`) 파일을 생성합니다.

아래에서 생성된 컨트롤러 파일(REST API용)을 확인할 수 있습니다.

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

또한, 모든 CRUD 엔드포인트(REST API의 라우트, GraphQL의 쿼리 및 뮤테이션, Microservice 및 WebSocket 게이트웨이의 메시지 구독)에 대한 플레이스홀더를 자동으로 생성합니다. 손가락 하나 까딱하지 않고도 말이죠.

> warning **참고** 생성된 서비스 클래스는 특정 **ORM (또는 데이터 소스)**에 묶여 있지 않습니다. 이를 통해 생성기는 어떤 프로젝트의 요구 사항에도 충족할 수 있을 만큼 범용적입니다. 기본적으로 모든 메서드에는 플레이스홀더가 포함되어 있어 프로젝트에 특정한 데이터 소스로 채울 수 있습니다.

마찬가지로 GraphQL 애플리케이션용 리졸버를 생성하려면 전송 계층으로 `GraphQL (code first)` (또는 `GraphQL (schema first)`)을 선택하기만 하면 됩니다.

이 경우 NestJS는 REST API 컨트롤러 대신 리졸버 클래스를 생성합니다.

```shell
$ nest g resource users

> ? What transport layer do you use? GraphQL (code first)
> ? Would you like to generate CRUD entry points? Yes
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
```

> info **팁** 테스트 파일 생성을 방지하려면 `--no-spec` 플래그를 다음과 같이 전달하면 됩니다. `nest g resource users --no-spec`

아래에서 보듯이, 모든 상용구 뮤테이션 및 쿼리가 생성되었을 뿐만 아니라 모든 것이 연결되어 있습니다. 우리는 `UsersService`, `User` 엔티티, 그리고 DTO를 활용하고 있습니다.

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
```