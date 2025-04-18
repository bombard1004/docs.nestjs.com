### Nest CLI 및 스크립트

이 섹션에서는 DevOps 인력이 개발 환경을 관리하는 데 도움이 되도록 `nest` 명령이 컴파일러 및 스크립트와 상호 작용하는 방법에 대한 추가 배경 정보를 제공합니다.

Nest 애플리케이션은 실행 전에 JavaScript로 컴파일되어야 하는 **표준** TypeScript 애플리케이션입니다. 컴파일 단계를 수행하는 다양한 방법이 있으며, 개발자/팀은 자신에게 가장 적합한 방식을 자유롭게 선택할 수 있습니다. 이를 염두에 두고 Nest는 다음과 같은 작업을 수행하려는 일련의 도구를 즉시 제공합니다.

- 합리적인 기본값으로 "그냥 작동하는" 표준 빌드/실행 프로세스를 명령 줄에서 사용할 수 있도록 제공합니다.
- 빌드/실행 프로세스가 **개방적**임을 보장하여 개발자가 기본 도구에 직접 접근하여 네이티브 기능 및 옵션을 사용하여 사용자 정의할 수 있도록 합니다.
- 완전히 표준적인 TypeScript/Node.js 프레임워크로 유지하여 전체 컴파일/배포/실행 파이프라인이 개발 팀이 사용하기로 선택한 외부 도구로 관리될 수 있도록 합니다.

이 목표는 `nest` 명령, 로컬에 설치된 TypeScript 컴파일러 및 `package.json` 스크립트의 조합을 통해 달성됩니다. 이러한 기술이 어떻게 함께 작동하는지는 아래에서 설명합니다. 이는 빌드/실행 프로세스의 각 단계에서 무슨 일이 일어나고 있는지, 그리고 필요한 경우 해당 동작을 사용자 정의하는 방법을 이해하는 데 도움이 될 것입니다.

#### nest 바이너리

`nest` 명령은 OS 수준 바이너리(즉, OS 명령 줄에서 실행)입니다. 이 명령은 실제로는 아래에서 설명하는 3가지 영역을 포함합니다. 프로젝트를 스캐폴딩할 때 자동으로 제공되는 `package.json` 스크립트를 통해 빌드(`nest build`) 및 실행(`nest start`) 하위 명령을 실행하는 것을 권장합니다 ([`nest new` 대신 레포를 클론하여 시작하려면 typescript starter](https://github.com/nestjs/typescript-starter)를 참조하세요).

#### 빌드

`nest build`는 표준 `tsc` 컴파일러 또는 `swc` 컴파일러([표준 프로젝트](https://docs.nestjs.com/cli/overview#project-structure)의 경우) 또는 `ts-loader`를 사용하는 webpack 번들러([모노레포](https://docs.nestjs.com/cli/overview#project-structure)의 경우) 위에 있는 래퍼입니다. `tsconfig-paths`를 즉시 처리하는 것 외에는 다른 컴파일 기능이나 단계를 추가하지 않습니다. 이 명령이 존재하는 이유는 대부분의 개발자가 특히 Nest를 처음 시작할 때 때때로 까다로울 수 있는 컴파일러 옵션(예: `tsconfig.json` 파일)을 조정할 필요가 없기 때문입니다.

자세한 내용은 [nest build](https://docs.nestjs.com/cli/usages#nest-build) 문서를 참조하세요.

#### 실행

`nest start`는 프로젝트가 빌드되었는지 확인하고(`nest build`와 동일), 컴파일된 애플리케이션을 실행하기 위해 이식 가능하고 쉬운 방식으로 `node` 명령을 호출합니다. 빌드와 마찬가지로, `nest start` 명령 및 해당 옵션을 사용하거나 완전히 대체하여 필요에 따라 이 프로세스를 자유롭게 사용자 정의할 수 있습니다. 전체 프로세스는 표준 TypeScript 애플리케이션 빌드 및 실행 파이프라인이며, 프로세스를 그렇게 관리하는 것을 자유롭게 할 수 있습니다.

자세한 내용은 [nest start](https://docs.nestjs.com/cli/usages#nest-start) 문서를 참조하세요.

#### 생성

`nest generate` 명령은 이름에서 알 수 있듯이 새로운 Nest 프로젝트 또는 그 안에 있는 구성 요소를 생성합니다.

#### 패키지 스크립트

OS 명령 수준에서 `nest` 명령을 실행하려면 `nest` 바이너리가 전역적으로 설치되어야 합니다. 이는 npm의 표준 기능이며, Nest의 직접적인 제어 범위 밖에 있습니다. 이로 인한 한 가지 결과는 전역적으로 설치된 `nest` 바이너리가 `package.json`에서 프로젝트 종속성으로 관리되지 않는다는 것입니다. 예를 들어, 두 명의 다른 개발자가 `nest` 바이너리의 두 가지 다른 버전을 실행할 수 있습니다. 이에 대한 표준 솔루션은 패키지 스크립트를 사용하여 빌드 및 실행 단계에서 사용되는 도구를 개발 종속성으로 취급하는 것입니다.

`nest new`를 실행하거나 [typescript starter](https://github.com/nestjs/typescript-starter)를 클론하면 Nest는 새 프로젝트의 `package.json` 스크립트에 `build` 및 `start`와 같은 명령을 채웁니다. 또한 기본 컴파일러 도구(예: `typescript`)를 **개발 종속성**으로 설치합니다.

다음과 같은 명령으로 빌드 및 실행 스크립트를 실행합니다.

```bash
$ npm run build
```

그리고

```bash
$ npm run start
```

이 명령은 npm의 스크립트 실행 기능을 사용하여 **로컬에 설치된** `nest` 바이너리를 사용하여 `nest build` 또는 `nest start`를 실행합니다. 이러한 내장된 패키지 스크립트를 사용함으로써 Nest CLI 명령에 대한 전체 종속성 관리를 할 수 있습니다*. 즉, 이 **권장되는** 사용법을 따르면 조직의 모든 구성원이 동일한 버전의 명령을 실행하고 있다고 확신할 수 있습니다.

\*이는 `build` 및 `start` 명령에 적용됩니다. `nest new` 및 `nest generate` 명령은 빌드/실행 파이프라인의 일부가 아니므로 다른 컨텍스트에서 작동하며 내장된 `package.json` 스크립트와 함께 제공되지 않습니다.

대부분의 개발자/팀은 Nest 프로젝트를 빌드하고 실행하기 위해 패키지 스크립트를 활용하는 것이 권장됩니다. 해당 옵션(`--path`, `--webpack`, `--webpackPath`)을 통해 또는 `tsc` 또는 webpack 컴파일러 옵션 파일(예: `tsconfig.json`)을 필요에 따라 사용자 정의하여 이러한 스크립트의 동작을 완전히 사용자 정의할 수 있습니다. TypeScript를 컴파일하기 위한 완전히 사용자 정의된 빌드 프로세스를 실행하거나 심지어 `ts-node`로 TypeScript를 직접 실행할 수도 있습니다.

#### 하위 호환성

Nest 애플리케이션은 순수한 TypeScript 애플리케이션이므로 이전 버전의 Nest 빌드/실행 스크립트는 계속 작동합니다. 업그레이드할 필요는 없습니다. 준비가 되면 새로운 `nest build` 및 `nest start` 명령을 활용하거나 이전 또는 사용자 정의된 스크립트를 계속 실행할 수 있습니다.

#### 마이그레이션

변경할 필요는 없지만 `tsc-watch` 또는 `ts-node`와 같은 도구를 사용하는 대신 새로운 CLI 명령을 사용하도록 마이그레이션할 수 있습니다. 이 경우 `@nestjs/cli`의 최신 버전을 전역적으로 및 로컬로 설치하십시오.

```bash
$ npm install -g @nestjs/cli
$ cd  /some/project/root/folder
$ npm install -D @nestjs/cli
```

그런 다음 `package.json`에 정의된 `scripts`를 다음으로 바꿀 수 있습니다.

```typescript
"build": "nest build",
"start": "nest start",
"start:dev": "nest start --watch",
"start:debug": "nest start --debug --watch",
```