### 개요

> info **힌트** 이 챕터는 Nest Devtools와 Nest 프레임워크의 통합에 대해 다룹니다. Devtools 애플리케이션을 찾고 있다면 [Devtools](https://devtools.nestjs.com) 웹사이트를 방문하십시오.

로컬 애플리케이션 디버깅을 시작하려면 `main.ts` 파일을 열고 애플리케이션 옵션 객체에서 `snapshot` 속성을 다음과 같이 `true`로 설정해야 합니다.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
```

이렇게 하면 프레임워크가 Nest Devtools가 애플리케이션의 그래프를 시각화하는 데 필요한 메타데이터를 수집하도록 지시합니다.

다음으로 필요한 종속성을 설치하겠습니다.

```bash
$ npm i @nestjs/devtools-integration
```

> warning **경고** 애플리케이션에서 `@nestjs/graphql` 패키지를 사용하는 경우 최신 버전을 설치해야 합니다(`npm i @nestjs/graphql@11`).

이 종속성이 설치되었으면 `app.module.ts` 파일을 열고 방금 설치한 `DevtoolsModule`을 임포트해 보겠습니다.

```typescript
@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

> warning **경고** 여기서 `NODE_ENV` 환경 변수를 확인하는 이유는 프로덕션 환경에서는 이 모듈을 절대 사용해서는 안 되기 때문입니다!

`DevtoolsModule`이 임포트되고 애플리케이션이 실행되면(`npm run start:dev`) [Devtools](https://devtools.nestjs.com) URL로 이동하여 인트로스펙션된 그래프를 볼 수 있습니다.

<figure><img src="/assets/devtools/modules-graph.png" /></figure>

> info **힌트** 위 스크린샷에서 볼 수 있듯이 모든 모듈은 `InternalCoreModule`에 연결됩니다. `InternalCoreModule`은 항상 루트 모듈에 임포트되는 전역 모듈입니다. 전역 노드로 등록되어 있으므로 Nest는 모든 모듈과 `InternalCoreModule` 노드 사이에 자동으로 엣지를 생성합니다. 이제 그래프에서 전역 모듈을 숨기려면 사이드바의 "**전역 모듈 숨기기**" 체크박스를 사용하면 됩니다.

따라서 보시다시피 `DevtoolsModule`은 애플리케이션이 Devtools 애플리케이션이 앱을 인트로스펙션하는 데 사용할 추가 HTTP 서버(포트 8000에서)를 노출하도록 합니다.

모든 것이 예상대로 작동하는지 다시 확인하기 위해 그래프 뷰를 "클래스"로 변경하십시오. 다음 화면이 표시될 것입니다.

<figure><img src="/assets/devtools/classes-graph.png" /></figure>

특정 노드에 초점을 맞추려면 직사각형을 클릭하면 그래프에 **"초점"** 버튼이 있는 팝업 창이 표시됩니다. 또한 사이드바에 있는 검색 창을 사용하여 특정 노드를 찾을 수도 있습니다.

> info **힌트** **검사** 버튼을 클릭하면 애플리케이션은 해당 특정 노드가 선택된 상태로 `/debug` 페이지로 이동합니다.

<figure><img src="/assets/devtools/node-popup.png" /></figure>

> info **힌트** 그래프를 이미지로 내보내려면 그래프 오른쪽 모서리에 있는 **PNG로 내보내기** 버튼을 클릭하십시오.

사이드바(왼쪽)에 있는 폼 컨트롤을 사용하면 엣지 근접도를 제어하여 특정 애플리케이션 서브트리를 시각화할 수 있습니다.

<figure><img src="/assets/devtools/subtree-view.png" /></figure>

이는 팀에 **새로운 개발자**가 있고 애플리케이션 구조를 보여주고 싶을 때 특히 유용할 수 있습니다. 또한 이 기능을 사용하여 특정 모듈(예: `TasksModule`)과 그 모든 종속성을 시각화할 수 있으며, 이는 큰 애플리케이션을 더 작은 모듈(예: 개별 마이크로 서비스)로 분해할 때 유용할 수 있습니다.

이 비디오를 시청하여 **그래프 탐색기** 기능의 실제 작동 모습을 볼 수 있습니다.

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/bW8V-ssfnvM"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### "종속성을 해결할 수 없습니다" 오류 조사하기

> info **참고** 이 기능은 `@nestjs/core` >= `v9.3.10` 버전에서 지원됩니다.

아마도 가장 흔하게 보았을 오류 메시지는 Nest가 프로바이더의 종속성을 해결할 수 없다는 것입니다. Nest Devtools를 사용하면 문제를 쉽게 식별하고 해결 방법을 알 수 있습니다.

먼저 `main.ts` 파일을 열고 `bootstrap()` 호출을 다음과 같이 업데이트하십시오.

```typescript
bootstrap().catch((err) => {
  fs.writeFileSync('graph.json', PartialGraphHost.toString() ?? '');
  process.exit(1);
});
```

또한 `abortOnError`를 `false`로 설정해야 합니다.

```typescript
const app = await NestFactory.create(AppModule, {
  snapshot: true,
  abortOnError: false, // <--- 이 부분
});
```

이제 **"종속성을 해결할 수 없습니다"** 오류로 인해 애플리케이션이 부트스트랩에 실패할 때마다 루트 디렉터리에서 부분 그래프를 나타내는 `graph.json` 파일을 찾을 수 있습니다. 그런 다음 이 파일을 Devtools로 드래그 앤 드롭할 수 있습니다(현재 모드를 "인터랙티브"에서 "미리보기"로 전환해야 합니다).

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

성공적으로 업로드되면 다음 그래프 및 대화 상자 창이 표시될 것입니다.

<figure><img src="/assets/devtools/partial-graph-modules-view.png" /></figure>

보시다시피 강조 표시된 `TasksModule`은 우리가 살펴봐야 할 모듈입니다. 또한 대화 상자 창에서 이 문제를 해결하는 방법에 대한 일부 지침을 이미 볼 수 있습니다.

대신 "클래스" 뷰로 전환하면 다음이 표시됩니다.

<figure><img src="/assets/devtools/partial-graph-classes-view.png" /></figure>

이 그래프는 `TasksService`에 주입하려는 `DiagnosticsService`가 `TasksModule` 모듈의 컨텍스트에서 발견되지 않았음을 보여주며, 이를 수정하려면 `DiagnosticsModule`을 `TasksModule` 모듈로 임포트해야 할 가능성이 높습니다!

#### 라우트 탐색기

**라우트 탐색기** 페이지로 이동하면 등록된 모든 진입점이 표시됩니다.

<figure><img src="/assets/devtools/routes.png" /></figure>

> info **힌트** 이 페이지는 HTTP 라우트뿐만 아니라 다른 모든 진입점(예: WebSockets, gRPC, GraphQL 리졸버 등)도 보여줍니다.

진입점은 호스트 컨트롤러별로 그룹화됩니다. 검색 창을 사용하여 특정 진입점을 찾을 수도 있습니다.

특정 진입점을 클릭하면 **흐름 그래프**가 표시됩니다. 이 그래프는 진입점의 실행 흐름(예: 해당 라우트에 바인딩된 가드, 인터셉터, 파이프 등)을 보여줍니다. 이는 특정 라우트의 요청/응답 주기가 어떻게 보이는지 이해하거나 특정 가드/인터셉터/파이프가 실행되지 않는 이유를 트러블슈팅할 때 특히 유용합니다.

#### 샌드박스

즉석에서 JavaScript 코드를 실행하고 애플리케이션과 실시간으로 상호 작용하려면 **샌드박스** 페이지로 이동하십시오.

<figure><img src="/assets/devtools/sandbox.png" /></figure>

플레이그라운드는 API 엔드포인트를 **실시간으로** 테스트하고 디버그하는 데 사용할 수 있으며, 개발자는 예를 들어 HTTP 클라이언트를 사용하지 않고도 문제를 빠르게 식별하고 수정할 수 있습니다. 또한 인증 레이어를 우회할 수 있으므로 더 이상 로그인하거나 테스트 목적으로 특별 사용자 계정을 만들 필요가 없습니다. 이벤트 기반 애플리케이션의 경우 플레이그라운드에서 이벤트를 직접 트리거하고 애플리케이션이 어떻게 반응하는지 확인할 수도 있습니다.

로그된 모든 내용은 플레이그라운드의 콘솔로 스트리밍되므로 어떤 일이 일어나고 있는지 쉽게 확인할 수 있습니다.

애플리케이션을 다시 빌드하고 서버를 다시 시작할 필요 없이 코드를 **즉석에서** 실행하고 결과를 즉시 확인하십시오.

<figure><img src="/assets/devtools/sandbox-table.png" /></figure>

> info **힌트** 객체 배열을 예쁘게 표시하려면 `console.table()` (또는 그냥 `table()`) 함수를 사용하십시오.

이 비디오를 시청하여 **인터랙티브 플레이그라운드** 기능의 실제 작동 모습을 볼 수 있습니다.

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/liSxEN_VXKM"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### 부트스트랩 성능 분석기

모든 클래스 노드(컨트롤러, 프로바이더, 인핸서 등)와 해당 인스턴스화 시간 목록을 보려면 **부트스트랩 성능** 페이지로 이동하십시오.

<figure><img src="/assets/devtools/bootstrap-performance.png" /></figure>

이 페이지는 애플리케이션 부트스트랩 프로세스에서 가장 느린 부분을 식별하고 싶을 때 특히 유용합니다(예: 서버리스 환경에 매우 중요한 애플리케이션 시작 시간을 최적화하고 싶을 때).

#### 감사 (Audit)

직렬화된 그래프를 분석하면서 애플리케이션이 발견한 자동 생성된 감사 - 오류/경고/힌트를 보려면 **감사** 페이지로 이동하십시오.

<figure><img src="/assets/devtools/audit.png" /></figure>

> info **힌트** 위 스크린샷은 사용 가능한 모든 감사 규칙을 보여주지는 않습니다.

이 페이지는 애플리케이션의 잠재적인 문제를 식별할 때 유용합니다.

#### 정적 파일 미리보기

직렬화된 그래프를 파일로 저장하려면 다음 코드를 사용하십시오.

```typescript
await app.listen(process.env.PORT ?? 3000); // 또는 await app.init()
fs.writeFileSync('./graph.json', app.get(SerializedGraph).toString());
```

> info **힌트** `SerializedGraph`는 `@nestjs/core` 패키지에서 익스포트됩니다.

그런 다음 이 파일을 드래그 앤 드롭/업로드할 수 있습니다.

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

이는 다른 사람(예: 동료)과 그래프를 공유하거나 오프라인으로 분석할 때 유용합니다.
