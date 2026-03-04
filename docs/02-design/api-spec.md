# API 명세서

## Base URL

`/api`

---

## POST /api/generate-report

탐구보고서를 생성합니다.

### Request

```json
{
  "subject": "string",    // 과목명 (예: "국어", "수학", "영어" 등)
  "topic": "string",      // 세부 탐구 주제
  "length": "string",     // 길이 옵션: "short" | "medium" | "long"
  "tone": "string"        // 톤 옵션: "formal" | "casual" | "academic"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| subject | string | Yes | 8개 과목 중 하나 |
| topic | string | Yes | 선택한 과목의 세부 주제 |
| length | string | Yes | "short"(500자), "medium"(1000자), "long"(1500자) |
| tone | string | Yes | "formal", "casual", "academic" |

### Response (200)

```json
{
  "report": "string",     // 생성된 탐구보고서 본문
  "wordCount": 0          // 글자 수
}
```

### Error Responses

**400 Bad Request** - 필수 필드 누락 또는 잘못된 값

```json
{
  "error": "subject, topic, length, tone은 필수 항목입니다."
}
```

**500 Internal Server Error** - AI 생성 실패

```json
{
  "error": "보고서 생성 중 오류가 발생했습니다. 다시 시도해주세요."
}
```

---

## POST /api/generate-setech

세부능력 및 특기사항(세특) 500자를 생성합니다.

### Request

```json
{
  "subject": "string",         // 과목명
  "topic": "string",           // 세부 탐구 주제
  "reportContent": "string"    // (선택) 탐구보고서 내용 기반 생성
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| subject | string | Yes | 8개 과목 중 하나 |
| topic | string | Yes | 선택한 과목의 세부 주제 |
| reportContent | string | No | 기존 탐구보고서 내용 (있으면 이를 기반으로 세특 생성) |

### Response (200)

```json
{
  "setech": "string",    // 생성된 세특 문구
  "charCount": 0         // 글자 수 (500자 이내)
}
```

### Error Responses

**400 Bad Request** - 필수 필드 누락

```json
{
  "error": "subject와 topic은 필수 항목입니다."
}
```

**500 Internal Server Error** - AI 생성 실패

```json
{
  "error": "세특 생성 중 오류가 발생했습니다. 다시 시도해주세요."
}
```
