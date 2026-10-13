# AI DJ · Free Mixing Studio

33modeling의 무료 음원 DJ 작업실. 서버 설치 없이 두 덱에서 실제 오디오를 재생하고 믹싱합니다.

- 자체 제작 CC0 MP3 6곡: House, Tech House, Lo-fi, Downtempo, Techno, Breakbeat.
- 내 음원 여러 파일 추가·드롭, 실제 BPM·에너지·파형 분석, BPM 수정, IndexedDB 파일 보관.
- A/B 덱 재생·일시정지·스크럽·큐·4/8박 루프·템포 동기화.
- 3밴드 EQ, 로우패스 필터, 에코, equal-power 크로스페이더, 마스터 볼륨과 출력 미터.
- BPM·에너지 기반 셋 추천, 순서 이동·드래그, 자동 전환과 중지.
- 실시간 조작 녹음(WebM/Opus 또는 지원 브라우저의 M4A), 셋리스트 자동 믹스 WAV 합성, 라이선스 포함 JSON 내보내기·가져오기.
- 로컬 OpenAI 호환 모델에 metadata만 전달하는 AI 디렉팅. 요청한 서버·모델이 켜져 있을 때 실제 `/v1/chat/completions` 응답을 검증해 적용합니다. 키는 브라우저 저장소에 보관하지 않습니다. 기본 모델 필드는 사용자가 요청한 `Qwen3.8-27B`이며 서버에 등록된 실제 모델 이름으로 바꿀 수 있습니다.

기본 곡은 `scripts/create-free-music.py`의 오실레이터·노이즈로 합성한 오리지널입니다. 외부 음원의 권리를 추측해 무료라고 표시하지 않습니다. [LICENSE-AUDIO.md](LICENSE-AUDIO.md)에 CC0 범위를 기록했습니다. 음원 파일과 코드를 함께 배포합니다.

## Run and verify

```sh
npm test
npm run test:browser
GAME_PROFILE=pages npm run build
GAME_PROFILE=local npm run build
python3 -m http.server 4300 --directory dist
```

정적 출력은 `dist/`. 새 의존성 없이 최신 브라우저의 Web Audio API를 사용합니다. 음악 재생은 사용자 클릭으로 시작합니다. 템포 조절은 음정도 바꿉니다. BPM 분석값이 불확실하면 직접 수정할 수 있습니다. 브라우저가 음원 저장을 차단하거나 용량이 부족하면 새 파일을 현재 세션에서 유지하고 보관 실패를 표시합니다.

`npm run test:browser`는 실제 MP3 재생, 박자·루프, 녹음의 오디오 스트림, WAV 길이와 비영점 샘플, 파일 재접속 복원, 유효·잘못된 셋 JSON, AI API 응답 검증, API 키 비저장, 320/390/820/1440px 화면을 검사합니다. AI 모델만 모의 응답으로 대체하고 오디오 처리는 실제 브라우저·FFmpeg로 검증합니다. 테스트 브라우저 위치는 기존 33modeling 개발 환경의 Playwright를 사용합니다. `DJ_UI`, `DJ_LABEL`, `DJ_EVIDENCE`로 공개·로컬 배포 화면도 같은 검증을 실행할 수 있습니다.
