### 소개

Nest (NestJS)는 효율적이고 확장 가능한 [Node.js](https://nodejs.org/) 서버 측 애플리케이션을 구축하기 위한 프레임워크입니다. 프로그레시브 자바스크립트를 사용하며, [TypeScript](http://www.typescriptlang.org/)로 구축되고 완벽하게 지원합니다 (하지만 순수 자바스크립트로 코딩하는 것도 가능합니다). OOP (객체 지향 프로그래밍), FP (함수형 프로그래밍), FRP (함수형 반응형 프로그래밍)의 요소를 결합합니다.

Nest는 내부적으로 [Express](https://expressjs.com/) (기본)와 같은 강력한 HTTP 서버 프레임워크를 사용하며, 선택적으로 [Fastify](https://github.com/fastify/fastify)도 사용하도록 구성할 수 있습니다!

Nest는 이러한 일반적인 Node.js 프레임워크 (Express/Fastify) 위에 추상화 레이어를 제공하지만, 개발자에게 해당 API를 직접 노출하기도 합니다. 이를 통해 개발자는 기반 플랫폼에서 사용할 수 있는 수많은 타사 모듈을 자유롭게 사용할 수 있습니다.

#### 철학

최근 몇 년 동안 Node.js 덕분에 자바스크립트는 프론트엔드 및 백엔드 애플리케이션 모두를 위한 웹의 "링구아 프랑카(lingua franca, 공용어)"가 되었습니다. 이로 인해 개발 생산성을 향상시키고 빠르고 테스트 가능하며 확장 가능한 프론트엔드 애플리케이션을 만들 수 있는 [Angular](https://angular.dev/), [React](https://github.com/facebook/react), [Vue](https://github.com/vuejs/vue)와 같은 멋진 프로젝트들이 탄생했습니다. 그러나 Node (및 서버 측 자바스크립트)를 위한 훌륭한 라이브러리, 헬퍼 및 도구는 많이 존재하지만, **아키텍처**라는 주요 문제를 효과적으로 해결하는 것은 없습니다.

Nest는 개발자와 팀이 높은 테스트 가능성, 확장성, 느슨한 결합, 쉬운 유지 보수성을 갖춘 애플리케이션을 만들 수 있도록 하는 즉시 사용 가능한(out-of-the-box) 애플리케이션 아키텍처를 제공합니다. 이 아키텍처는 Angular로부터 많은 영감을 받았습니다.

#### 설치

시작하려면 [Nest CLI](/cli/overview)로 프로젝트 골격을 만들거나, [스타터 프로젝트를 복제](#alternatives)할 수 있습니다 (둘 다 동일한 결과를 산출합니다).

Nest CLI로 프로젝트 골격을 만들려면 다음 명령을 실행합니다. 이렇게 하면 새로운 프로젝트 디렉토리가 생성되고, 초기 코어 Nest 파일 및 지원 모듈로 디렉토리가 채워져 프로젝트의 기본적인 구조가 생성됩니다. **Nest CLI**로 새 프로젝트를 생성하는 것은 처음 사용자에게 권장됩니다. 이 방법은 [첫걸음](first-steps)에서 계속 이어집니다.

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **힌트** 더 엄격한 기능 집합을 가진 새 TypeScript 프로젝트를 만들려면 `nest new` 명령어에 `--strict` 플래그를 전달하세요.

#### 대안

또는 **Git**으로 TypeScript 스타터 프로젝트를 설치합니다:

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

> info **힌트** Git 기록 없이 저장소를 복제하고 싶다면 [degit](https://github.com/Rich-Harris/degit)을 사용할 수 있습니다.

브라우저를 열고 [`http://localhost:3000/`](http://localhost:3000/)으로 이동하세요.

JavaScript 버전의 스타터 프로젝트를 설치하려면 위의 명령어 시퀀스에서 `javascript-starter.git`을 사용하세요.

코어 및 지원 패키지를 설치하여 처음부터 새 프로젝트를 시작할 수도 있습니다. 이 경우 프로젝트 보일러플레이트 파일을 직접 설정해야 합니다. 최소한 `@nestjs/core`, `@nestjs/common`, `rxjs`, `reflect-metadata`와 같은 의존성이 필요합니다. 완전한 프로젝트를 만드는 방법에 대한 다음 짧은 글을 확인해 보세요: [5 steps to create a bare minimum NestJS app from scratch!](https://dev.to/micalevisk/5-steps-to-create-a-bare-minimum-nestjs-app-from-scratch-5c3b).
