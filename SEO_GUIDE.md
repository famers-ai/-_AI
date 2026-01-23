# SEO & Indexing Guide for ForHuman AI

구글 검색 결과에 사이트가 노출되지 않는 것은 **아직 구글이 사이트를 수집(크롤링)하지 않았기 때문**일 가능성이 높습니다. 다음 단계들을 따라하시면 구글 검색에 더 빠르게 노출될 수 있습니다.

## 1. Google Search Console 등록 (가장 중요) ⭐️
구글에게 "내 사이트가 여기 있다"고 직접 알려주는 절차입니다.
1. [Google Search Console](https://search.google.com/search-console/about)에 접속합니다.
2. '속성 추가'를 클릭하고 도메인(`forhumanai.net` 또는 Streamlit 앱 주소)을 입력합니다.
3. 소유권 확인 절차를 거칩니다 (DNS 레코드 추가 방식 추천).
4. **URL 검사** 메뉴에서 내 사이트 주소를 입력하고 **"색인 생성 요청"** 버튼을 누릅니다.

## 2. 페이지 Title 및 메타데이터 최적화 (완료됨) ✅
방금 코드 업데이트를 통해 앱의 제목을 단순한 "ForHuman AI"에서 검색에 유리한 **"ForHuman AI - Future Smart Farming & AI Agronomist"**로 변경했습니다.
* 구글은 페이지 제목(Title)을 가장 중요한 검색 키워드로 인식합니다.

## 3. 키워드 강화
앱 화면에 텍스트 형태로 핵심 키워드들이 포함되어 있어야 구글이 내용을 이해합니다.
* Smart Farm, AI, Agriculture, Disease Detection, Price Forecast 등의 단어를 사이드바나 푸터에 자연스럽게 녹여내는 것이 좋습니다.

## 4. 백링크(Backlink) 확보
다른 웹사이트(블로그, SNS, GitHub, LinkedIn 등)에 내 사이트 링크(`forhumanai.net`)를 걸어두세요.
* 구글 봇은 링크를 타고 이동하므로, 링크가 많을수록 더 빨리 발견됩니다.

## 5. 시간 (Sandbox Effect) ⏳
새로 만든 도메인은 신뢰도 검증을 위해 일정 기간(몇 주 ~ 몇 달) 동안 검색 결과 상위에 잘 노출되지 않는 경향이 있습니다. 이를 '샌드박스 기간'이라고 합니다. 꾸준히 운영하면 자연스럽게 해결됩니다.

---
**Tip:** Streamlit Cloud를 유료로 사용 중이거나 커스텀 배포 환경이라면 `sitemap.xml`이나 `robots.txt`를 설정하여 크롤링을 도울 수도 있습니다.
