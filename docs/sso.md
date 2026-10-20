# SSO로 바꾸는 법

지금 SWAN은 **개발용 임시 로그인**으로 동작한다. 화면 오른쪽 아래 "테스트 사용자 고르기" 상자에서 사람을 고르면, 그 사람의 id가 쿠키(`swan_dev_user`)에 담기고 서버가 그 쿠키를 읽는다. 사내 통합 로그인(SSO)으로 바꿀 때 고칠 곳은 **`app/server/auth.py`의 `current_user()` 한 함수**뿐이다. 다른 서버 코드와 화면은 모두 이 함수가 돌려주는 사용자만 쓴다.

## 지금 구조

```
요청 → auth.current_user()  ── 사용자(User) 또는 None
          │
          ├─ require_user()   None이면 401 "로그인이 필요해요"
          └─ require_admin()  관리자가 아니면 403
```

- `current_user()`가 **None**을 돌려주면 "로그인 실패" 상태다. 화면은 모두 볼 수 있고, 버튼을 누르면 "로그인이 필요해요"가 나온다 (CLAUDE.md의 권한 표).
- 사용자 유형(직원·수강생·졸업생)은 따로 저장하지 않는다. `auth.user_type()`이 매번 판별한다 — 사번이 졸업생 명단(Alumni)에 있으면 졸업생, 지금 기수에 유효한 신청이 있으면 수강생, 아니면 직원.
- 관리자 여부만 User의 `is_admin`에 저장된다 (관리자 화면의 '관리자' 메뉴에서 추가·해제).
- 환경 변수 `SWAN_DEV_LOGIN`이 `1`(기본)이면 개발용 로그인, `0`이면 끈다. 끄면 `/api/dev/users`·`/api/dev/login`이 404가 되고, 화면의 테스트 사용자 상자도 나타나지 않는다.

## 바꾸는 순서

1. **SSO에서 무엇을 받는지 확인한다.** 보통 둘 중 하나다.
   - (가) 사내 SSO 게이트웨이(리버스 프록시)가 로그인을 끝내고 **요청 헤더에 사번을 넣어** 넘겨 준다 (예: `X-Remote-User`). 가장 간단하다.
   - (나) SAML·OIDC로 앱이 직접 인증한다. 이때는 사내 표준 라이브러리로 로그인 처리를 한 뒤, 세션(쿠키)에 사번을 담아 두고 아래 함수에서 읽는다.
   - 사번 말고 이름·부서도 함께 받을 수 있으면 받는다 (User를 처음 만들 때 쓴다).
2. **`current_user()`를 고친다.** (가)의 예:

   ```python
   SSO_HEADER = os.environ.get("SWAN_SSO_HEADER", "X-Remote-User")


   def current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
       if DEV_LOGIN_ENABLED:
           ...  # 지금 코드 그대로 (개발 PC에서만)
       emp_no = (request.headers.get(SSO_HEADER) or "").strip()
       if not emp_no:
           return None  # 인증 실패 → 열람만
       user = db.scalars(select(User).where(User.emp_no == emp_no)).first()
       if user is None:
           # 처음 들어온 사람은 그 자리에서 만든다. 이름·부서는 SSO가 주는 값으로 (없으면 사번만이라도)
           user = User(emp_no=emp_no, name=request.headers.get("X-Remote-Name", emp_no),
                       dept=request.headers.get("X-Remote-Dept", ""), sso_id=emp_no)
           db.add(user)
           db.commit()
       return user
   ```

   - 헤더 방식은 **SSO 게이트웨이를 거친 요청만** 서버에 닿게 해야 안전하다 (서버 포트를 직접 열지 않고, 게이트웨이 뒤에만 둔다). 누군가 헤더를 직접 넣어 보내면 다른 사람이 될 수 있기 때문이다.
   - 이름·부서가 SSO에서 바뀌면 들어올 때마다 고쳐 쓰고 싶다면, 찾은 user의 name·dept를 헤더 값으로 갱신하면 된다.
3. **개발용 로그인을 끈다.** 서버를 띄울 때 `SWAN_DEV_LOGIN=0` (docs/deploy.md의 실행 명령에 있다).
4. **확인한다.**
   - 사번이 있는 사람으로 들어가 상단 오른쪽에 이름·부서가 나오는지
   - `init_db.py`로 만든 첫 관리자의 사번으로 들어가 상단 메뉴에 '관리자'가 보이는지
   - 졸업생 명단 엑셀에 있는 사번으로 들어가 [완성작 올리기]가 보이는지
   - SSO를 거치지 않고(헤더 없이) 들어가면 열람만 되고 버튼을 누르면 "로그인이 필요해요"가 나오는지
   - 화면 오른쪽 아래 테스트 사용자 상자가 **없는지**

## 바꾸지 않아도 되는 것
- 화면 코드: 로그인 상태는 `/api/me`로만 받는다.
- 다른 서버 파일: 모두 `auth.current_user` · `require_user` · `require_admin`만 쓴다.
- 데이터: User는 사번(`emp_no`)으로 찾고, 졸업생 명단도 사번으로 이어진다. 개발용 가상 사용자는 `init_db.py`로 만든 운영 DB에 없다.

## 주의
- 개발용 로그인(`SWAN_DEV_LOGIN=1`)을 켠 채로 사내망에 열면 **누구나 관리자를 고를 수 있다.** 운영에서는 SSO를 붙이기 전까지 열지 않거나, 반입 시험 동안만 정해진 PC에서 쓴다.
