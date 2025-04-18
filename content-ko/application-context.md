### 독립 실행형 애플리케이션

Nest 애플리케이션을 마운트하는 방법에는 여러 가지가 있습니다. 웹 앱, 마이크로서비스 또는 네트워크 리스너가 없는 순수한 Nest **독립 실행형 애플리케이션**을 만들 수 있습니다. Nest 독립 실행형 애플리케이션은 모든 인스턴스화된 클래스를 담는 Nest **IoC 컨테이너**의 래퍼입니다. 독립 실행형 애플리케이션 객체를 사용하여 가져온 모든 모듈 내에서 기존 인스턴스에 대한 참조를 직접 얻을 수 있습니다. 따라서 예를 들어 스크립트된 **CRON** 작업을 포함하여 Nest 프레임워크를 어디에서나 활용할 수 있습니다. 심지어 그 위에 **CLI**를 구축할 수도 있습니다.

#### 시작하기

Nest 독립 실행형 애플리케이션을 생성하려면 다음 구문을 사용하십시오.

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // 여기에 애플리케이션 로직...
}
bootstrap();
```

#### 정적 모듈에서 프로바이더 검색

독립 실행형 애플리케이션 객체를 사용하면 Nest 애플리케이션 내에 등록된 모든 인스턴스에 대한 참조를 얻을 수 있습니다. `AppModule` 모듈에서 가져온 `TasksModule` 모듈에 `TasksService` 프로바이더가 있다고 가정해 봅시다. 이 클래스는 CRON 작업 내에서 호출하려는 메서드 세트를 제공합니다.

```typescript
@@filename()
const tasksService = app.get(TasksService);
```

`TasksService` 인스턴스에 접근하려면 `get()` 메서드를 사용합니다. `get()` 메서드는 등록된 각 모듈에서 인스턴스를 검색하는 **쿼리**처럼 작동합니다. 여기에 모든 프로바이더의 토큰을 전달할 수 있습니다. 또는 엄격한 컨텍스트 검사를 위해 `strict: true` 속성을 가진 옵션 객체를 전달할 수 있습니다. 이 옵션이 활성화되면 선택한 컨텍스트에서 특정 인스턴스를 얻기 위해 특정 모듈을 탐색해야 합니다.

```typescript
@@filename()
const tasksService = app.select(TasksModule).get(TasksService, { strict: true });
```

다음은 독립 실행형 애플리케이션 객체에서 인스턴스 참조를 검색하는 데 사용할 수 있는 메서드 요약입니다.

<table>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      애플리케이션 컨텍스트에서 사용 가능한 컨트롤러 또는 프로바이더(가드, 필터 등 포함)의 인스턴스를 검색합니다.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      모듈 그래프를 탐색하여 선택한 모듈의 특정 인스턴스를 가져옵니다(위에서 설명한 대로 엄격 모드와 함께 사용).
    </td>
  </tr>
</table>

> info **힌트** 비엄격 모드에서는 루트 모듈이 기본적으로 선택됩니다. 다른 모듈을 선택하려면 모듈 그래프를 수동으로 단계별로 탐색해야 합니다.

독립 실행형 애플리케이션은 네트워크 리스너를 가지고 있지 않으므로, 이 컨텍스트에서는 HTTP와 관련된 Nest 기능(예: 미들웨어, 인터셉터, 파이프, 가드 등)을 사용할 수 없습니다.

예를 들어, 애플리케이션에 전역 인터셉터를 등록하고 `app.get()` 메서드를 사용하여 컨트롤러 인스턴스를 검색하더라도 인터셉터는 실행되지 않습니다.

#### 동적 모듈에서 프로바이더 검색

[동적 모듈](/fundamentals/dynamic-modules)을 다룰 때, 애플리케이션에 등록된 동적 모듈을 나타내는 동일한 객체를 `app.select`에 제공해야 합니다. 예를 들어:

```typescript
@@filename()
export const dynamicConfigModule = ConfigModule.register({ folder: './config' });

@Module({
  imports: [dynamicConfigModule],
})
export class AppModule {}
```

그런 다음 나중에 해당 모듈을 선택할 수 있습니다:

```typescript
@@filename()
const configService = app.select(dynamicConfigModule).get(ConfigService, { strict: true });
```

#### 종료 단계

스크립트가 완료된 후 Node 애플리케이션을 종료하려면(예: CRON 작업을 실행하는 스크립트), `bootstrap` 함수의 끝에서 다음과 같이 `app.close()` 메서드를 호출해야 합니다:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // 애플리케이션 로직...
  await app.close();
}
bootstrap();
```

그리고 [라이프사이클 이벤트](/fundamentals/lifecycle-events) 챕터에서 언급했듯이, 이것은 라이프사이클 훅을 트리거할 것입니다.

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/18-context)에서 확인할 수 있습니다.