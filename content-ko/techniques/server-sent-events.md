### 서버 전송 이벤트 (Server-Sent Events)

서버 전송 이벤트(Server-Sent Events, SSE)는 클라이언트가 HTTP 연결을 통해 서버로부터 자동 업데이트를 받을 수 있도록 하는 서버 푸시 기술입니다. 각 알림은 두 개의 줄바꿈으로 종료되는 텍스트 블록으로 전송됩니다 ([여기](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)에서 더 자세히 알아보세요).

#### 사용법

경로(및 **컨트롤러 클래스**에 등록된 경로)에서 서버 전송 이벤트를 활성화하려면, 메서드 핸들러에 `@Sse()` 데코레이터를 붙여주세요.

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
```

> info **힌트** `@Sse()` 데코레이터와 `MessageEvent` 인터페이스는 `@nestjs/common`에서 가져오고, `Observable`, `interval`, `map`은 `rxjs` 패키지에서 가져옵니다.

> warning **경고** 서버 전송 이벤트 경로는 `Observable` 스트림을 반환해야 합니다.

위 예제에서는 실시간 업데이트를 전파할 수 있는 `sse`라는 이름의 경로를 정의했습니다. 이러한 이벤트는 [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)를 사용하여 수신할 수 있습니다.

`sse` 메서드는 여러 개의 `MessageEvent`를 방출하는 `Observable`을 반환합니다 (이 예제에서는 매초 새로운 `MessageEvent`를 방출합니다). 사양을 일치시키기 위해 `MessageEvent` 객체는 다음 인터페이스를 따라야 합니다:

```typescript
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

이것이 준비되면, 클라이언트 측 애플리케이션에서 `EventSource` 클래스의 인스턴스를 생성하고, `/sse` 경로(위의 `@Sse()` 데코레이터에 전달한 엔드포인트와 일치)를 생성자 인자로 전달할 수 있습니다.

`EventSource` 인스턴스는 HTTP 서버에 대한 영구적인 연결을 열고, 서버는 `text/event-stream` 형식으로 이벤트를 전송합니다. 연결은 `EventSource.close()`를 호출하여 닫을 때까지 열린 상태를 유지합니다.

연결이 열리면 서버에서 들어오는 메시지는 이벤트 형태로 코드에 전달됩니다. 들어오는 메시지에 event 필드가 있으면, 트리거되는 이벤트는 event 필드 값과 동일합니다. event 필드가 없으면 일반적인 `message` 이벤트가 발생합니다 ([출처](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)).

```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
```

#### 예제

작동하는 예제는 [여기](https://github.com/nestjs/nest/tree/master/sample/28-sse)에서 확인할 수 있습니다.