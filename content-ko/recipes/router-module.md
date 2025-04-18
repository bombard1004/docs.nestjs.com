### 라우터 모듈

> info **힌트** 이 장은 HTTP 기반 애플리케이션에만 해당됩니다.

HTTP 애플리케이션(예: REST API)에서 핸들러의 라우트 경로는 컨트롤러에 선언된 (선택적) 접두사(`@Controller` 데코레이터 내부)를 연결하고 메서드의 데코레이터(예: `@Get('users')`)에 지정된 경로를 연결하여 결정됩니다. [이 섹션](/controllers#routing)에서 자세히 알아볼 수 있습니다. 또한, 애플리케이션에 등록된 모든 라우트에 대해 [전역 접두사](/faq/global-prefix)를 정의하거나 [버전 관리](/techniques/versioning)를 활성화할 수 있습니다.

또한, 모듈 수준(그리고 해당 모듈 내부에 등록된 모든 컨트롤러에 대해)에서 접두사를 정의하는 것이 유용할 수 있는 예외적인 경우가 있습니다. 예를 들어, 애플리케이션의 특정 부분인 "대시보드"에서 사용되는 여러 다른 엔드포인트를 노출하는 REST 애플리케이션을 상상해 보세요. 이러한 경우, 각 컨트롤러 내에서 `/dashboard` 접두사를 반복하는 대신, 다음과 같이 유틸리티 `RouterModule` 모듈을 사용할 수 있습니다.

```typescript
@Module({
  imports: [
    DashboardModule,
    RouterModule.register([
      {
        path: 'dashboard',
        module: DashboardModule,
      },
    ]),
  ],
})
export class AppModule {}
```

> info **힌트** `RouterModule` 클래스는 `@nestjs/core` 패키지에서 내보내집니다.

또한 계층적 구조를 정의할 수 있습니다. 이는 각 모듈이 `children` 모듈을 가질 수 있음을 의미합니다. 자식 모듈은 부모의 접두사를 상속합니다. 다음 예제에서는 `AdminModule`을 `DashboardModule` 및 `MetricsModule`의 부모 모듈로 등록합니다.

```typescript
@Module({
  imports: [
    AdminModule,
    DashboardModule,
    MetricsModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          {
            path: 'metrics',
            module: MetricsModule,
          },
        ],
      },
    ])
  ],
});
```

> info **힌트** 이 기능은 과도하게 사용하면 시간이 지남에 따라 코드를 유지보수하기 어려워질 수 있으므로 매우 주의해서 사용해야 합니다.

위 예제에서 `DashboardModule` 내부에 등록된 모든 컨트롤러는 추가로 `/admin/dashboard` 접두사를 갖게 됩니다(모듈이 상위에서 하위로 - 재귀적으로 - 경로를 연결하기 때문에). 마찬가지로, `MetricsModule` 내부에 정의된 각 컨트롤러는 추가 모듈 수준 접두사 `/admin/metrics`를 갖게 됩니다.