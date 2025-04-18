### CI/CD 연동

> info **힌트** 이 챕터는 Nest Devtools와 Nest 프레임워크의 연동에 대해 다룹니다. Devtools 애플리케이션을 찾으신다면 [Devtools](https://devtools.nestjs.com) 웹사이트를 방문해주세요.

CI/CD 연동은 **[Enterprise](/settings)** 요금제 사용자가 이용할 수 있습니다.

이 비디오를 시청하여 CI/CD 연동이 왜, 그리고 어떻게 도움이 되는지 알아보세요:

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/r5RXcBrnEQ8"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### 그래프 게시

먼저 애플리케이션 부트스트랩 파일(`main.ts`)이 `GraphPublisher` 클래스를 사용하도록 설정해 봅시다(`@nestjs/devtools-integration`에서 내보냅니다 - 자세한 내용은 이전 챕터를 참고하세요). 설정은 다음과 같습니다:

```typescript
async function bootstrap() {
  const shouldPublishGraph = process.env.PUBLISH_GRAPH === "true";

  const app = await NestFactory.create(AppModule, {
    snapshot: true,
    preview: shouldPublishGraph,
  });

  if (shouldPublishGraph) {
    await app.init();

    const publishOptions = { ... } // 참고: 이 options 객체는 사용 중인 CI/CD 공급자에 따라 달라집니다.
    const graphPublisher = new GraphPublisher(app);
    await graphPublisher.publish(publishOptions);

    await app.close();
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}
```

보시다시피, 여기서 `GraphPublisher`를 사용하여 직렬화된 그래프를 중앙 집중식 레지스트리에 게시하고 있습니다. `PUBLISH_GRAPH`는 그래프를 게시할지(CI/CD 워크플로우) 또는 게시하지 않을지(정상적인 애플리케이션 부트스트랩) 제어할 수 있는 커스텀 환경 변수입니다. 또한, 여기서 `preview` 속성을 `true`로 설정했습니다. 이 플래그를 활성화하면 애플리케이션이 미리보기 모드로 부트스트랩됩니다. 이는 기본적으로 애플리케이션의 모든 컨트롤러, 인핸서, 프로바이더의 생성자(및 라이프사이클 훅)가 실행되지 않음을 의미합니다. 참고 - 이는 **필수 사항은 아니지만**, CI/CD 파이프라인에서 애플리케이션을 실행할 때 데이터베이스 연결 등이 필요 없으므로 작업을 더 간단하게 만듭니다.

`publishOptions` 객체는 사용 중인 CI/CD 공급자에 따라 달라집니다. 아래 섹션에서 가장 인기 있는 CI/CD 공급자에 대한 지침을 제공할 것입니다.

그래프가 성공적으로 게시되면 워크플로우 뷰에서 다음과 같은 출력을 볼 수 있습니다:

<figure><img src="/assets/devtools/graph-published-terminal.png" /></figure>

그래프가 게시될 때마다 프로젝트 해당 페이지에 새 항목이 표시되어야 합니다:

<figure><img src="/assets/devtools/project.png" /></figure>

#### 보고서

Devtools는 중앙 집중식 레지스트리에 해당 스냅샷이 이미 저장되어 **있는 경우** 모든 빌드에 대해 보고서를 생성합니다. 예를 들어, 그래프가 이미 게시된 `master` 브랜치에 대해 PR을 생성하면 애플리케이션은 차이점을 감지하고 보고서를 생성할 수 있습니다. 그렇지 않으면 보고서가 생성되지 않습니다.

보고서를 보려면 프로젝트 해당 페이지로 이동하십시오 (조직 참조).

<figure><img src="/assets/devtools/report.png" /></figure>

이는 코드 검토 중 눈치채지 못했을 수 있는 변경 사항을 식별하는 데 특히 유용합니다. 예를 들어, 누군가가 **깊게 중첩된 프로바이더**의 스코프를 변경했다고 가정해 봅시다. 이 변경 사항은 리뷰어에게 즉시 명확하지 않을 수 있지만, Devtools를 사용하면 이러한 변경 사항을 쉽게 발견하고 의도된 것인지 확인할 수 있습니다. 또는 특정 엔드포인트에서 가드를 제거하면 보고서에 영향을 받은 것으로 표시됩니다. 만약 해당 라우트에 대한 통합 또는 e2e 테스트가 없다면, 보호되지 않는다는 사실을 눈치채지 못할 수 있으며, 알게 되었을 때는 너무 늦을 수 있습니다.

유사하게, **대규모 코드베이스**에서 작업 중이고 모듈을 전역으로 수정한다면, 그래프에 얼마나 많은 엣지가 추가되었는지 볼 수 있으며, 이는 대부분의 경우 무언가 잘못하고 있다는 신호입니다.

#### 빌드 미리보기

게시된 모든 그래프에 대해 **미리보기** 버튼을 클릭하여 이전에는 어떻게 보였는지 시간여행을 할 수 있습니다. 또한, 보고서가 생성되었다면 그래프에서 차이가 강조된 것을 볼 수 있습니다:

- 녹색 노드는 추가된 요소를 나타냅니다.
- 밝은 흰색 노드는 업데이트된 요소를 나타냅니다.
- 빨간색 노드는 삭제된 요소를 나타냅니다.

아래 스크린샷을 참고하십시오:

<figure><img src="/assets/devtools/nodes-selection.png" /></figure>

시간여행 기능은 현재 그래프와 이전 그래프를 비교하여 문제를 조사하고 해결할 수 있게 해줍니다. 설정 방식에 따라 모든 풀 리퀘스트(또는 모든 커밋)는 레지스트리에 해당하는 스냅샷을 가지므로 쉽게 시간여행을 하여 무엇이 변경되었는지 확인할 수 있습니다. Devtools를 Nest가 애플리케이션 그래프를 어떻게 구성하는지 이해하고 이를 **시각화**하는 능력을 가진 Git이라고 생각하십시오.

#### 연동: GitHub Actions

먼저 프로젝트의 `.github/workflows` 디렉토리에 새로운 GitHub 워크플로우를 생성하고 예를 들어 `publish-graph.yml`이라고 명명해 봅시다. 이 파일 안에 다음 정의를 사용합니다:

```yaml
name: Devtools

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - '*'

jobs:
  publish:
    if: github.actor!= 'dependabot[bot]'
    name: Publish graph
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Setup Environment (PR)
        if: {{ '${{' }} github.event_name == 'pull_request' {{ '}}' }}
        shell: bash
        run: |
          echo "COMMIT_SHA={{ '${{' }} github.event.pull_request.head.sha {{ '}}' }}" >>\${GITHUB_ENV}
      - name: Setup Environment (Push)
        if: {{ '${{' }} github.event_name == 'push' {{ '}}' }}
        shell: bash
        run: |
          echo "COMMIT_SHA=\${GITHUB_SHA}" >> \${GITHUB_ENV}
      - name: Publish
        run: PUBLISH_GRAPH=true npm run start
        env:
          DEVTOOLS_API_KEY: CHANGE_THIS_TO_YOUR_API_KEY
          REPOSITORY_NAME: {{ '${{' }} github.event.repository.name {{ '}}' }}
          BRANCH_NAME: {{ '${{' }} github.head_ref || github.ref_name {{ '}}' }}
          TARGET_SHA: {{ '${{' }} github.event.pull_request.base.sha {{ '}}' }}
```

이상적으로, `DEVTOOLS_API_KEY` 환경 변수는 GitHub Secrets에서 가져와야 합니다. 자세한 내용은 [여기](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository)에서 읽어보세요.

이 워크플로우는 `master` 브랜치를 대상으로 하는 각 풀 리퀘스트 또는 `master` 브랜치에 직접 커밋이 발생하는 경우 실행됩니다. 이 구성을 프로젝트의 필요에 맞게 자유롭게 조정하십시오. 여기서 중요한 것은 `GraphPublisher` 클래스가 실행될 수 있도록 필요한 환경 변수를 제공하는 것입니다.

하지만 이 워크플로우를 사용하기 전에 업데이트해야 하는 변수가 하나 있습니다 - `DEVTOOLS_API_KEY`입니다. 이 [페이지](https://devtools.nestjs.com/settings/manage-api-keys)에서 프로젝트 전용 API 키를 생성할 수 있습니다.

마지막으로, `main.ts` 파일로 다시 이동하여 이전에 비워둔 `publishOptions` 객체를 업데이트해 봅시다.

```typescript
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.REPOSITORY_NAME,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  sha: process.env.COMMIT_SHA,
  target: process.env.TARGET_SHA,
  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',
  branch: process.env.BRANCH_NAME,
};
```

최고의 개발 경험을 위해 "Integrate GitHub app" 버튼을 클릭하여 프로젝트에 대한 **GitHub 애플리케이션**을 통합하십시오 (아래 스크린샷 참고). 참고 - 이는 필수는 아닙니다.

<figure><img src="/assets/devtools/integrate-github-app.png" /></figure>

이 통합을 통해 풀 리퀘스트에서 바로 미리보기/보고서 생성 프로세스의 상태를 확인할 수 있습니다:

<figure><img src="/assets/devtools/actions-preview.png" /></figure>

#### 연동: Gitlab Pipelines

먼저 프로젝트의 루트 디렉토리에 새로운 GitLab CI 설정 파일을 만들고, 예를 들어 `.gitlab-ci.yml`이라고 이름을 짓겠습니다. 이 파일 안에 다음 정의를 사용해 보겠습니다.

```typescript
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.REPOSITORY_NAME,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  sha: process.env.COMMIT_SHA,
  target: process.env.TARGET_SHA,
  trigger: process.env.GITHUB_BASE_REF ? 'pull' : 'push',
  branch: process.env.BRANCH_NAME,
};
```

> info **힌트** 이상적으로, `DEVTOOLS_API_KEY` 환경 변수는 secrets에서 가져와야 합니다.

이 워크플로우는 `master` 브랜치를 대상으로 하는 각 풀 리퀘스트 또는 `master` 브랜치에 직접 커밋이 발생하는 경우 실행됩니다. 이 구성을 프로젝트의 필요에 맞게 자유롭게 조정하십시오. 여기서 중요한 것은 `GraphPublisher` 클래스가 실행될 수 있도록 필요한 환경 변수를 제공하는 것입니다.

하지만 이 워크플로우 정의에서 사용하기 전에 업데이트해야 하는 변수가 하나 있습니다 - `DEVTOOLS_API_KEY`입니다. 이 **페이지**에서 프로젝트 전용 API 키를 생성할 수 있습니다.

마지막으로, `main.ts` 파일로 다시 이동하여 이전에 비워둔 `publishOptions` 객체를 업데이트해 봅시다.

```yaml
image: node:16

stages:
  - build

cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: always
    - if: $CI_COMMIT_BRANCH == "master" && $CI_PIPELINE_SOURCE == "push"
      when: always
    - when: never

install_dependencies:
  stage: build
  script:
    - npm ci

publish_graph:
  stage: build
  needs:
    - install_dependencies
  script: npm run start
  variables:
    PUBLISH_GRAPH: 'true'
    DEVTOOLS_API_KEY: 'CHANGE_THIS_TO_YOUR_API_KEY'
```

#### 기타 CI/CD 도구

Nest Devtools CI/CD 연동은 원하는 모든 CI/CD 도구(예: [Bitbucket Pipelines](https://bitbucket.org/product/features/pipelines), [CircleCI](https://circleci.com/) 등)와 함께 사용할 수 있으므로 여기에 설명된 공급자에만 제한될 필요는 없습니다.

다음 `publishOptions` 객체 구성을 보고 특정 커밋/빌드/PR에 대한 그래프를 게시하는 데 필요한 정보가 무엇인지 이해하십시오.

```typescript
const publishOptions = {
  apiKey: process.env.DEVTOOLS_API_KEY,
  repository: process.env.CI_PROJECT_NAME,
  owner: process.env.CI_PROJECT_ROOT_NAMESPACE,
  sha: process.env.CI_COMMIT_SHA,
  target: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA,
  trigger: process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA ? 'pull' : 'push',
  branch: process.env.CI_COMMIT_BRANCH ?? process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,
};
```

이 정보의 대부분은 CI/CD 내장 환경 변수를 통해 제공됩니다([CircleCI built-in environment list](https://circleci.com/docs/variables/#built-in-environment-variables) 및 [Bitbucket variables](https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/) 참고).

그래프 게시를 위한 파이프라인 구성과 관련하여 다음 트리거 사용을 권장합니다:

- `push` 이벤트 - 현재 브랜치가 배포 환경(예: `master`, `main`, `staging`, `production` 등)을 나타내는 경우에만 해당합니다.
- `pull request` 이벤트 - 항상, 또는 **대상 브랜치**가 배포 환경을 나타내는 경우(위 참조)입니다.