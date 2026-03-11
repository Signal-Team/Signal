# 🦜 LangChain Q&A — Signal 프로젝트 기반 학습 가이드

> LangChain을 처음 배우는 분을 위한 Q&A 모음입니다.
> Signal 프로젝트(키워드 추적 플랫폼) 맥락에 맞춰 설명합니다.

---

## 목차

1. [LangChain이란?](#1-langchain이란)
2. [핵심 개념](#2-핵심-개념)
3. [LangChain vs Anthropic SDK 직접 사용](#3-langchain-vs-anthropic-sdk-직접-사용)
4. [설치 및 환경 설정](#4-설치-및-환경-설정)
5. [PromptTemplate — 프롬프트 템플릿](#5-prompttemplate--프롬프트-템플릿)
6. [Chain — 체인으로 로직 연결](#6-chain--체인으로-로직-연결)
7. [Tool & Agent — 외부 도구 사용](#7-tool--agent--외부-도구-사용)
8. [Memory — 대화 기억](#8-memory--대화-기억)
9. [Output Parser — 출력 파싱](#9-output-parser--출력-파싱)
10. [Next.js에서 LangChain 사용하기](#10-nextjs에서-langchain-사용하기)
11. [Signal 프로젝트에 적용하기](#11-signal-프로젝트에-적용하기)
12. [자주 발생하는 에러 & 해결법](#12-자주-발생하는-에러--해결법)

---

## 1. LangChain이란?

### Q. LangChain이 뭔가요?

**A.** LangChain은 LLM(대형 언어 모델, 예: Claude, GPT)을 이용한 애플리케이션을
더 쉽게 만들 수 있도록 도와주는 **프레임워크**입니다.

AI 앱을 만들 때 반복되는 패턴들(프롬프트 관리, 외부 도구 연결, 결과 파싱 등)을
미리 만들어 놓은 레고 블록처럼 가져다 쓸 수 있게 해줍니다.

```
LangChain 없이:
  1. 프롬프트 문자열 직접 조합
  2. API 직접 호출
  3. 응답 텍스트 직접 파싱
  4. 에러 처리 직접 구현

LangChain 있으면:
  1. PromptTemplate으로 프롬프트 관리
  2. Model 객체로 API 호출 통일
  3. OutputParser로 파싱 자동화
  4. 공통 에러 처리 내장
```

### Q. LangChain은 Python만 되나요?

**A.** 아니요. Python(`langchain`)과 JavaScript/TypeScript(`langchain` npm 패키지) 둘 다 지원합니다.
Signal 프로젝트는 Next.js(TypeScript)이므로 **JS 버전**을 사용합니다.

```
Python  → pip install langchain langchain-anthropic
JS/TS   → npm install langchain @langchain/anthropic
```

### Q. LangChain을 꼭 써야 하나요?

**A.** 아닙니다. LangChain은 선택사항입니다.
단순히 Claude에게 텍스트를 보내고 받는 정도라면 `@anthropic-ai/sdk` 직접 사용이 더 간단합니다.
LangChain이 빛을 발하는 상황:
- 웹 검색, DB 조회 등 **외부 도구를 AI가 스스로 선택해서 실행**할 때 (Agent)
- 여러 단계의 AI 작업을 **순서대로 연결**할 때 (Chain)
- **대화 맥락을 기억**시켜야 할 때 (Memory)

---

## 2. 핵심 개념

### Q. LangChain의 핵심 개념을 한눈에 볼 수 있나요?

**A.**

```
┌─────────────────────────────────────────────────────┐
│                   LangChain 생태계                   │
│                                                     │
│  PromptTemplate  →  Model  →  OutputParser          │
│        ↑              ↑            ↑                │
│     프롬프트       Claude 등      결과 파싱           │
│     템플릿        LLM 모델                           │
│                                                     │
│  이것들을 연결한 것이 → Chain                        │
│  Chain + Tool 묶음이  → Agent                        │
│  대화 기록 저장은     → Memory                       │
└─────────────────────────────────────────────────────┘
```

| 개념 | 한 줄 설명 | Signal에서의 역할 |
|------|-----------|------------------|
| **PromptTemplate** | 재사용 가능한 프롬프트 틀 | "키워드 {keyword}를 분석해줘" |
| **Model** | Claude 등 LLM 연결 | Claude Sonnet 호출 |
| **Chain** | 여러 단계 순서 연결 | 검색 → 요약 → 분석 |
| **Tool** | AI가 쓸 수 있는 외부 도구 | Tavily 웹 검색 |
| **Agent** | 상황 판단해서 Tool 자동 선택 | 키워드별 자동 검색·분석 |
| **Memory** | 이전 대화 기억 | 추적 히스토리 유지 |
| **OutputParser** | AI 응답을 구조화된 데이터로 변환 | JSON 형태 분석 결과 반환 |

---

## 3. LangChain vs Anthropic SDK 직접 사용

### Q. 기존 `@anthropic-ai/sdk`랑 뭐가 다른가요?

**A.** 같은 Claude를 쓰지만 접근 방식이 다릅니다.

```typescript
// ── 방법 1: @anthropic-ai/sdk 직접 사용 ──────────────────────
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "영화 굿즈 트렌드 분석해줘" }],
});

const text = response.content[0].text; // 직접 꺼내야 함
```

```typescript
// ── 방법 2: LangChain + @langchain/anthropic 사용 ─────────────
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";

// LangChain이 제공하는 통일된 인터페이스
const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await model.invoke([
  new HumanMessage("영화 굿즈 트렌드 분석해줘"),
]);

const text = response.content; // LangChain이 꺼내줌
```

**핵심 차이**: LangChain은 Claude, GPT, Gemini 등 어떤 모델이든
**같은 방식으로 쓸 수 있도록** 공통 인터페이스를 제공합니다.
나중에 모델을 바꿔도 코드를 거의 수정하지 않아도 됩니다.

---

## 4. 설치 및 환경 설정

### Q. Signal 프로젝트에 LangChain을 설치하려면?

**A.**

```bash
# 핵심 패키지 (LangChain 코어)
npm install langchain @langchain/core

# Claude 연동 패키지
npm install @langchain/anthropic

# 웹 검색 도구 (Tavily - 무료 API 키 발급 가능)
npm install @langchain/community
```

### Q. 환경 변수는 어떻게 설정하나요?

**A.** `.env.local`에 추가합니다.

```env
# 기존
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...

# LangChain 웹 검색용 추가 (Tavily: https://tavily.com 에서 무료 발급)
TAVILY_API_KEY=...
```

---

## 5. PromptTemplate — 프롬프트 템플릿

### Q. PromptTemplate이 왜 필요한가요?

**A.** 프롬프트에 변수를 넣고 싶을 때 사용합니다.
문자열 직접 조합 대신 **재사용 가능한 틀**을 만드는 것입니다.

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

// ── 기본 사용법 ──────────────────────────────────────────────
// {keyword}와 {question}은 나중에 채워질 자리 표시자(placeholder)
const prompt = ChatPromptTemplate.fromTemplate(`
  당신은 마케팅 트렌드 분석 전문가입니다.

  키워드: {keyword}
  분석 질문: {question}

  위 키워드에 대해 최신 트렌드를 분석하고,
  질문에 대한 전략적 인사이트를 제공해주세요.
`);

// 실제 값을 넣어서 최종 프롬프트 생성
const formattedPrompt = await prompt.format({
  keyword: "영화 굿즈",
  question: "한정판 프로모션 수요가 있을까?",
});
// 결과: "당신은 마케팅 트렌드 분석 전문가입니다. 키워드: 영화 굿즈..."
```

```typescript
// ── System + Human 메시지 분리 (더 권장되는 방식) ────────────
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    // system: AI의 역할/성격을 정의하는 지시사항
    "당신은 마케팅 전략 분석 전문가입니다. 데이터 기반의 인사이트를 제공합니다.",
  ],
  [
    "human",
    // human: 실제 사용자 질문 (변수 포함 가능)
    "키워드 '{keyword}'에 대해 분석해주세요. 질문: {question}",
  ],
]);
```

### Q. PromptTemplate에서 변수가 여러 개면 어떻게 하나요?

**A.** `{}` 안에 변수명을 원하는 만큼 넣으면 됩니다.

```typescript
const analysisPrompt = ChatPromptTemplate.fromTemplate(`
  분석 대상 키워드: {keywords}
  카테고리: {category}
  추적 기간: {period}
  전략 질문: {question}

  위 정보를 바탕으로 트렌드를 분석해주세요.
`);

// format() 호출 시 모든 변수를 채워줘야 함
const result = await analysisPrompt.format({
  keywords: "영화, 굿즈, 한정판",
  category: "영화",
  period: "최근 6개월",
  question: "한정판 프로모션 성공 가능성은?",
});
```

---

## 6. Chain — 체인으로 로직 연결

### Q. Chain이 뭔가요?

**A.** 여러 단계(프롬프트 → 모델 호출 → 결과 파싱)를 **파이프라인처럼 연결**하는 것입니다.
`|` 연산자(파이프)로 연결하며, 앞 단계의 출력이 뒷 단계의 입력이 됩니다.

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// ── 각 부품 준비 ─────────────────────────────────────────────
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "마케팅 트렌드 분석 전문가입니다."],
  ["human", "키워드 '{keyword}'를 분석해주세요."],
]);

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
});

// StringOutputParser: AI 응답 객체에서 텍스트만 꺼내주는 파서
const parser = new StringOutputParser();

// ── | 연산자로 파이프라인 구성 ───────────────────────────────
// prompt의 출력 → model의 입력 → parser의 입력 → 최종 텍스트
const chain = prompt.pipe(model).pipe(parser);

// ── 체인 실행 ────────────────────────────────────────────────
const result = await chain.invoke({
  keyword: "영화 굿즈", // prompt의 {keyword} 자리에 들어감
});

console.log(result); // 최종 분석 텍스트
```

### Q. Chain을 여러 개 이어 붙일 수 있나요?

**A.** 네. 체인을 조합해 복잡한 파이프라인을 만들 수 있습니다.

```typescript
// ── 1단계: 웹에서 키워드 관련 정보 요약 ─────────────────────
const summarizeChain = summarizePrompt.pipe(model).pipe(parser);

// ── 2단계: 요약된 정보를 바탕으로 전략 분석 ─────────────────
const analyzeChain = analyzePrompt.pipe(model).pipe(parser);

// ── 두 체인을 순서대로 실행 ──────────────────────────────────
// 1단계 결과를 2단계 입력으로 넘김
const summary = await summarizeChain.invoke({ keyword: "영화 굿즈" });
const analysis = await analyzeChain.invoke({
  summary,           // 1단계 결과
  question: "수요 예측",
});
```

---

## 7. Tool & Agent — 외부 도구 사용

### Q. Tool이 뭔가요?

**A.** AI가 호출할 수 있는 **외부 기능**입니다.
예: 웹 검색, 계산기, DB 조회, 날씨 확인 등.

```typescript
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { tool } from "@langchain/core/tools";
import { z } from "zod"; // 입력값 유효성 검사용

// ── 내장 Tool: Tavily 웹 검색 ────────────────────────────────
// Tavily는 AI용으로 최적화된 웹 검색 API
const searchTool = new TavilySearchResults({
  maxResults: 5,           // 검색 결과 최대 5개
  apiKey: process.env.TAVILY_API_KEY,
});

// 직접 사용할 수도 있음
const searchResult = await searchTool.invoke("영화 굿즈 한정판 트렌드 2025");
console.log(searchResult); // 검색 결과 JSON 배열
```

```typescript
// ── 커스텀 Tool: 직접 만들기 ─────────────────────────────────
// Signal 프로젝트의 Supabase에서 과거 분석 데이터를 가져오는 Tool
const getPastAnalysisTool = tool(
  async ({ keyword, limit }) => {
    // 실제 구현에서는 Supabase 쿼리
    const data = await supabase
      .from("analyses")
      .select("*")
      .ilike("keywords", `%${keyword}%`)
      .limit(limit);

    return JSON.stringify(data);
  },
  {
    name: "get_past_analysis",
    description:
      "과거 분석 결과를 가져옵니다. 특정 키워드의 이전 트렌드 데이터가 필요할 때 사용하세요.",
    // zod로 입력값의 타입과 설명을 정의 — AI가 Tool을 올바르게 사용하도록 안내
    schema: z.object({
      keyword: z.string().describe("검색할 키워드"),
      limit: z.number().describe("가져올 결과 수").default(5),
    }),
  }
);
```

### Q. Agent가 뭔가요? Tool이랑 뭐가 달라요?

**A.** Tool은 도구 자체이고, Agent는 **어떤 도구를 언제 쓸지 스스로 판단하는 AI**입니다.

```
Tool   = 망치, 드라이버, 톱 (개별 도구)
Agent  = 목수 (상황 보고 적절한 도구를 골라 쓰는 존재)
```

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const model = new ChatAnthropic({ model: "claude-sonnet-4-6" });

// Agent가 사용할 수 있는 도구 목록
const tools = [
  new TavilySearchResults({ maxResults: 5 }), // 웹 검색 도구
  getPastAnalysisTool,                         // 커스텀 DB 조회 도구
];

// Agent 생성: model + tools를 묶어서 Agent 완성
const agent = createReactAgent({ llm: model, tools });

// Agent 실행: AI가 스스로 판단해서 필요한 Tool을 호출
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      // AI는 이 질문에 답하기 위해 스스로 웹 검색 Tool을 선택해서 실행
      content:
        "영화 굿즈 한정판 트렌드를 분석하고, " +
        "과거 분석 데이터와 비교해서 인사이트를 제공해줘",
    },
  ],
});
```

### Q. Agent 실행 흐름이 어떻게 되나요?

**A.** ReAct(Reasoning + Acting) 패턴으로 동작합니다.

```
1. 사용자 질문 입력
   └→ "영화 굿즈 한정판 트렌드 분석해줘"

2. AI가 생각 (Reasoning)
   └→ "이 질문에 답하려면 최신 웹 검색이 필요하다"

3. Tool 호출 (Acting)
   └→ TavilySearch("영화 굿즈 한정판 2025 트렌드") 실행

4. Tool 결과 확인
   └→ 검색 결과 5개 획득

5. 다시 생각 (Reasoning)
   └→ "충분한 정보를 얻었다. 이제 분석할 수 있다"

6. 최종 답변 생성
   └→ 검색 결과를 바탕으로 분석 텍스트 작성

※ 2~5 단계는 AI가 판단해서 필요하면 반복함
```

---

## 8. Memory — 대화 기억

### Q. Memory가 왜 필요한가요?

**A.** LLM은 기본적으로 **이전 대화를 기억하지 못합니다**.
매 요청마다 처음부터 새로 시작합니다.
Memory를 사용하면 이전 분석 결과나 대화 맥락을 유지할 수 있습니다.

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

const model = new ChatAnthropic({ model: "claude-sonnet-4-6" });

// ── 수동으로 메시지 히스토리 관리하는 가장 기본적인 방법 ──────
// messages 배열에 순서대로 추가하면 됨
const conversationHistory = [
  new SystemMessage("당신은 마케팅 트렌드 분석 전문가입니다."),
];

// 1번째 사용자 질문
conversationHistory.push(new HumanMessage("영화 굿즈 트렌드를 분석해줘"));
const response1 = await model.invoke(conversationHistory);
// AI 응답도 히스토리에 추가해야 다음 질문에서 기억함
conversationHistory.push(new AIMessage(response1.content as string));

// 2번째 질문 — 이전 분석을 기억하고 있음
conversationHistory.push(
  new HumanMessage("방금 분석한 내용에서 가장 중요한 인사이트 3가지만 뽑아줘")
);
const response2 = await model.invoke(conversationHistory);
```

```typescript
// ── Signal 프로젝트에 적용: 분석 히스토리 관리 ───────────────
// Supabase에 대화 히스토리를 저장하고 불러오는 방식으로 구현 가능

async function analyzeWithHistory(trackerId: string, newQuestion: string) {
  // 1. Supabase에서 이전 대화 기록 로드
  const { data: history } = await supabase
    .from("analysis_history")
    .select("role, content")
    .eq("tracker_id", trackerId)
    .order("created_at", { ascending: true });

  // 2. 히스토리를 LangChain 메시지 형식으로 변환
  const messages = [
    new SystemMessage("마케팅 트렌드 분석 전문가입니다."),
    ...(history || []).map((h) =>
      h.role === "human"
        ? new HumanMessage(h.content)
        : new AIMessage(h.content)
    ),
    new HumanMessage(newQuestion), // 새 질문 추가
  ];

  // 3. AI 응답 생성
  const response = await model.invoke(messages);

  // 4. 새 대화 Supabase에 저장
  await supabase.from("analysis_history").insert([
    { tracker_id: trackerId, role: "human", content: newQuestion },
    { tracker_id: trackerId, role: "ai", content: response.content },
  ]);

  return response.content;
}
```

---

## 9. Output Parser — 출력 파싱

### Q. AI 응답을 JSON으로 받고 싶어요.

**A.** `StructuredOutputParser` 또는 `JsonOutputParser`를 사용합니다.

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

// ── 방법 1: JsonOutputParser (간단한 방식) ───────────────────
const model = new ChatAnthropic({ model: "claude-sonnet-4-6" });
const parser = new JsonOutputParser();

const prompt = ChatPromptTemplate.fromTemplate(`
  키워드 '{keyword}'를 분석하고 아래 JSON 형식으로만 응답하세요.
  다른 텍스트 없이 순수 JSON만 출력하세요.

  {{
    "summary": "한줄 요약",
    "trend": "상승 | 하락 | 유지",
    "insights": ["인사이트1", "인사이트2", "인사이트3"],
    "confidence": 0~100 사이 숫자
  }}
`);

const chain = prompt.pipe(model).pipe(parser);

// 결과가 자동으로 JavaScript 객체로 파싱됨
const result = await chain.invoke({ keyword: "영화 굿즈" });
console.log(result.summary);    // "영화 굿즈 시장은 ..."
console.log(result.trend);      // "상승"
console.log(result.insights);   // ["인사이트1", ...]
console.log(result.confidence); // 85
```

```typescript
// ── 방법 2: withStructuredOutput (Claude에서 가장 안정적인 방식) ─
import { z } from "zod"; // 스키마 정의 라이브러리

// zod로 응답 스키마 정의 — TypeScript 타입도 자동으로 생성됨
const analysisSchema = z.object({
  summary: z.string().describe("트렌드 한줄 요약"),
  trend: z
    .enum(["상승", "하락", "유지"])
    .describe("현재 트렌드 방향"),
  insights: z.array(z.string()).describe("핵심 인사이트 목록"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("분석 신뢰도 (0-100)"),
  recommendations: z.array(z.string()).describe("전략 추천 사항"),
});

// withStructuredOutput: 모델이 반드시 이 형식으로 응답하도록 강제
const structuredModel = model.withStructuredOutput(analysisSchema);

const result = await structuredModel.invoke(
  "영화 굿즈 한정판 트렌드를 분석해줘"
);
// result는 위 스키마를 완벽히 따르는 TypeScript 객체
```

---

## 10. Next.js에서 LangChain 사용하기

### Q. Next.js API Route에서 LangChain을 어떻게 써요?

**A.** API Route는 서버에서 실행되므로 LangChain을 그대로 사용할 수 있습니다.

```typescript
// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// POST /api/analyze
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const { keyword, question } = await request.json();

    // 2. 입력값 유효성 검사
    if (!keyword || !question) {
      return NextResponse.json(
        { error: "keyword와 question이 필요합니다." },
        { status: 400 }
      );
    }

    // 3. LangChain 설정
    const model = new ChatAnthropic({
      model: "claude-sonnet-4-6",
      // API 키는 서버에서만 접근 가능 (NEXT_PUBLIC_ 접두사 없음)
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 2048,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "마케팅 트렌드 분석 전문가입니다."],
      [
        "human",
        "키워드: {keyword}\n질문: {question}\n\n분석해주세요.",
      ],
    ]);

    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    // 4. 체인 실행
    const result = await chain.invoke({ keyword, question });

    // 5. 결과 반환
    return NextResponse.json({ analysis: result });
  } catch (error) {
    console.error("분석 오류:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
```

### Q. 스트리밍 응답은 어떻게 하나요?

**A.** `stream()` 메서드와 Next.js의 `StreamingTextResponse`를 사용합니다.

```typescript
// src/app/api/analyze/stream/route.ts

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(request: Request) {
  const { keyword, question } = await request.json();

  const model = new ChatAnthropic({ model: "claude-sonnet-4-6" });
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "마케팅 트렌드 분석 전문가입니다."],
    ["human", "키워드: {keyword}\n질문: {question}"],
  ]);
  const parser = new StringOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  // stream()은 AsyncGenerator를 반환 — 토큰이 생성될 때마다 청크를 내보냄
  const stream = await chain.stream({ keyword, question });

  // ReadableStream으로 변환해서 클라이언트에 전송
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        // 각 청크(부분 텍스트)를 UTF-8 바이트로 인코딩해서 전송
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // 스트리밍 중에 버퍼링 없이 즉시 전송
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

---

## 11. Signal 프로젝트에 적용하기

### Q. Signal의 핵심 기능을 LangChain으로 어떻게 구현하나요?

**A.** 키워드 트래킹 분석 파이프라인 예시입니다.

```typescript
// src/lib/langchain/keyword-analyzer.ts

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

// ── 분석 결과 타입 정의 ──────────────────────────────────────
const AnalysisResultSchema = z.object({
  summary: z.string().describe("AI 한줄 요약"),
  detailedAnswer: z.string().describe("질문에 대한 상세 분석"),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        date: z.string().optional(),
      })
    )
    .describe("참고 출처"),
  trendDirection: z
    .enum(["상승", "하락", "유지", "변동"])
    .describe("트렌드 방향"),
  confidence: z.number().min(0).max(100).describe("분석 신뢰도"),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ── 키워드 분석기 클래스 ─────────────────────────────────────
export class KeywordAnalyzer {
  private model: ChatAnthropic;
  private searchTool: TavilySearchResults;

  constructor() {
    // Claude 모델 초기화
    this.model = new ChatAnthropic({
      model: "claude-sonnet-4-6",
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 4096,
    });

    // Tavily 웹 검색 도구 초기화
    this.searchTool = new TavilySearchResults({
      maxResults: 10,             // 검색 결과 최대 10개
      apiKey: process.env.TAVILY_API_KEY,
    });
  }

  // ── 메인 분석 함수 ────────────────────────────────────────
  async analyze(params: {
    keywords: string[];  // 추적 키워드 배열
    question: string;    // 전략 질문
    category: string;    // 카테고리 (영화, 패션 등)
  }): Promise<AnalysisResult> {
    const { keywords, question, category } = params;

    // 1단계: 웹 검색으로 최신 데이터 수집
    const searchQuery = `${keywords.join(" ")} ${category} 트렌드 최신`;
    const searchResults = await this.searchTool.invoke(searchQuery);

    // 2단계: 검색 결과 + 질문으로 구조화된 분석 생성
    const structuredModel = this.model.withStructuredOutput(AnalysisResultSchema);

    const analysisPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `당신은 마케팅 트렌드 분석 전문가입니다.
         제공된 웹 검색 데이터를 기반으로 정확하고 실용적인 분석을 제공합니다.
         모든 주장은 검색 데이터에 근거해야 합니다.`,
      ],
      [
        "human",
        `다음 정보를 분석해주세요:

         추적 키워드: {keywords}
         카테고리: {category}
         전략 질문: {question}

         최신 웹 검색 데이터:
         {searchResults}

         위 데이터를 바탕으로 분석 결과를 제공해주세요.`,
      ],
    ]);

    const chain = analysisPrompt.pipe(structuredModel);

    const result = await chain.invoke({
      keywords: keywords.join(", "),
      category,
      question,
      // 검색 결과를 문자열로 변환 (JSON 배열 → 텍스트)
      searchResults:
        typeof searchResults === "string"
          ? searchResults
          : JSON.stringify(searchResults, null, 2),
    });

    return result;
  }
}
```

### Q. 주기적 업데이트(6시간/12시간/24시간)는 어떻게 구현하나요?

**A.** Next.js Cron Jobs 또는 Supabase Edge Functions와 LangChain을 조합합니다.

```typescript
// src/app/api/cron/update-trackers/route.ts
// Vercel Cron Job이 주기적으로 이 엔드포인트를 호출

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { KeywordAnalyzer } from "@/lib/langchain/keyword-analyzer";

export async function GET(request: NextRequest) {
  // 보안: Cron Job에서만 호출 가능하도록 검증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const analyzer = new KeywordAnalyzer();

  // 업데이트가 필요한 트래커 조회
  // (마지막 업데이트 시간 + 설정 주기 <= 현재 시간)
  const { data: trackers } = await supabase
    .from("trackers")
    .select("*")
    .lte("next_update_at", new Date().toISOString());

  if (!trackers || trackers.length === 0) {
    return NextResponse.json({ message: "업데이트할 트래커 없음" });
  }

  // 각 트래커 순서대로 분석 실행
  for (const tracker of trackers) {
    try {
      // LangChain으로 분석 실행
      const result = await analyzer.analyze({
        keywords: tracker.keywords,
        question: tracker.question,
        category: tracker.category,
      });

      // 분석 결과 저장
      await supabase.from("analyses").insert({
        tracker_id: tracker.id,
        summary: result.summary,
        detailed_answer: result.detailedAnswer,
        sources: result.sources,
        trend_direction: result.trendDirection,
        confidence: result.confidence,
      });

      // 다음 업데이트 시간 갱신
      const nextUpdate = new Date();
      nextUpdate.setHours(
        nextUpdate.getHours() + tracker.update_interval_hours
      );

      await supabase
        .from("trackers")
        .update({ next_update_at: nextUpdate.toISOString() })
        .eq("id", tracker.id);
    } catch (error) {
      console.error(`트래커 ${tracker.id} 업데이트 실패:`, error);
    }
  }

  return NextResponse.json({ updated: trackers.length });
}
```

---

## 12. 자주 발생하는 에러 & 해결법

### Q. `Module not found: Can't resolve '@langchain/...'` 에러가 나요.

```bash
# 필요한 패키지를 설치했는지 확인
npm install @langchain/core @langchain/anthropic @langchain/community
```

### Q. `API key is missing` 에러가 나요.

```typescript
// ❌ 잘못된 방법: 클라이언트 컴포넌트에서 서버 환경 변수 접근
// ANTHROPIC_API_KEY는 서버에서만 접근 가능
const model = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // 클라이언트에서는 undefined
});

// ✅ 올바른 방법: API Route(서버)에서만 LangChain 사용
// src/app/api/analyze/route.ts (서버 파일)
export async function POST() {
  const model = new ChatAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // 서버에서는 정상 접근
  });
}
```

### Q. 응답이 너무 느려요.

```typescript
// ── 1. 스트리밍 사용 ─────────────────────────────────────────
// 전체 응답을 기다리지 않고 토큰 단위로 즉시 표시
const stream = await chain.stream({ keyword });
for await (const chunk of stream) {
  process.stdout.write(chunk); // 또는 SSE로 클라이언트에 전송
}

// ── 2. maxTokens 줄이기 ──────────────────────────────────────
// 응답 길이를 제한하면 속도 향상
const model = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001", // 빠른 모델로 변경
  maxTokens: 512,                     // 토큰 수 제한
});

// ── 3. 병렬 처리 ────────────────────────────────────────────
// 여러 키워드를 순서대로 처리하지 않고 동시에 처리
const results = await Promise.all(
  keywords.map((keyword) => chain.invoke({ keyword }))
);
```

### Q. JSON 파싱 에러가 자주 나요.

```typescript
// ❌ AI가 JSON 형식을 안 지킬 때가 있음
const parser = new JsonOutputParser();

// ✅ withStructuredOutput 사용 — Claude가 형식을 반드시 지킴
const structuredModel = model.withStructuredOutput(mySchema);
// 실패 시 자동으로 재시도하고 에러를 던짐
```

### Q. `Rate limit exceeded` 에러가 나요.

```typescript
// API 호출 빈도 제한 에러 — 잠시 기다렸다가 재시도해야 함
// LangChain에는 내장 재시도 기능이 있음
const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  maxRetries: 3,       // 실패 시 최대 3번 재시도
  // 재시도 간격은 자동으로 지수 증가 (1초 → 2초 → 4초)
});
```

---

## 더 공부하고 싶다면

- [LangChain JS 공식 문서](https://js.langchain.com)
- [LangChain JS GitHub](https://github.com/langchain-ai/langchainjs)
- [@langchain/anthropic 패키지 문서](https://js.langchain.com/docs/integrations/chat/anthropic)
- [Tavily 웹 검색 API](https://tavily.com) — AI 검색 도구, 무료 플랜 있음

---

*이 문서는 Signal 프로젝트(Next.js + Supabase + Claude) 맥락에 맞춰 작성되었습니다.*
