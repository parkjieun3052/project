from js import Response, fetch, Headers, JSON

async def on_fetch(request, env, ctx):
    # 1. 대시보드에 등록한 환경 변수에서 API 키 가져오기
    api_key = env.OPENAI_API_KEY 
    
    # 2. 외부 API로 보낼 헤더 및 데이터 세팅
    url = "https://openai.com"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 예시 데이터 (프론트에서 받은 값을 활용하거나 직접 세팅)
    body = JSON.stringify({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hello!"}]
    })
    
    # 3. 외부 API 호출 (클라우드플레어 내장 fetch 사용)
    # 파이썬 requests 라이브러리 대신 클라우드플레어 환경의 fetch를 사용해야 안전하고 빠릅니다.
    api_response = await fetch(url, method="POST", headers=headers, body=body)
    res_data = await api_response.text()
    
    # 4. 프론트엔드(HTML)로 결과 전달 (CORS 헤더 추가)
    response_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" # 프론트 주소가 다를 경우 CORS 허용
    }
    
    return Response.new(res_data, headers=response_headers)
