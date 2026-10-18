"""수준 테스트 6문제. 내용은 planning/v3-1013/level-test.md 그대로다 (코드는 모두 Python 3에서 실제로 돌려 정답을 확인한 것, 6번은 후보 A).
강사와 검토한 뒤 관리자 화면에서 고칠 수 있다.

필드: order, type(choice/short/line), title, scenario, code, question, choices, answer, partial_answer, explanation, better_code, line_notes
"""

ASK_OUTPUT = "다음 코드를 실행하면 무엇이 출력될까요?"

QUESTIONS = [
    dict(
        order=1, type="choice", title="리스트는 복사되지 않는다",
        code='a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))',
        question=ASK_OUTPUT,
        choices=["3", "4", "에러", "None"], answer="2",
        explanation=(
            "`b = a`는 리스트를 복사하지 않습니다. `a`와 `b`는 같은 리스트 하나를 가리키는 두 개의 이름이에요. "
            "그래서 `b`에 넣은 4가 `a`에도 보입니다. 복사하려면 `b = a.copy()`라고 써야 합니다."
        ),
    ),
    dict(
        order=2, type="choice", title="딕셔너리와 max(key=)",
        code='scores = {"kim": 80, "lee": 95, "park": 70}\nbest = max(scores, key=scores.get)\nprint(best)',
        question=ASK_OUTPUT,
        choices=["95", "lee", "('lee', 95)", "park"], answer="2",
        explanation=(
            "딕셔너리를 그대로 `max`에 넣으면 키를 비교합니다. `key=scores.get`은 \"키를 비교할 때 그 키의 값으로 비교하라\"는 뜻이에요. "
            "그래서 값이 가장 큰 키인 `lee`가 나옵니다. 키 자체를 알파벳순으로 비교했다면 `park`이 나왔을 거예요."
        ),
    ),
    dict(
        order=3, type="choice", title="map, filter, lambda",
        code='nums = [1, 2, 3, 4]\nresult = list(map(lambda x: x * 2, filter(lambda x: x % 2 == 0, nums)))\nprint(result)',
        question=ASK_OUTPUT,
        choices=["[2, 4, 6, 8]", "[4, 8]", "[2, 6]", "[1, 2, 3, 4]"], answer="2",
        explanation=(
            "안쪽부터 읽습니다. `filter`가 짝수 `[2, 4]`만 남기고, `map`이 그것을 두 배로 만들어 `[4, 8]`이 됩니다. "
            "이렇게 함수를 이어 붙이는 방식을 SWAN의 \"함수 활용법\" 단원에서 다룹니다."
        ),
    ),
    dict(
        order=4, type="choice", title="함수 기본값의 함정",
        code='def add(item, box=[]):\n    box.append(item)\n    return box\n\nadd(1)\nprint(add(2))',
        question=ASK_OUTPUT,
        choices=["[2]", "[1, 2]", "[1]", "에러"], answer="2",
        explanation=(
            "함수의 기본값 `[]`은 함수를 부를 때마다 새로 만들어지지 않습니다. 함수가 처음 정의될 때 한 번만 만들어지고 계속 같은 리스트가 쓰여요. "
            "그래서 첫 번째 호출에서 넣은 1이 남아 있습니다. AI가 짠 코드에서도 자주 보이는 실수예요. "
            "고치려면 `box=None`으로 두고 함수 안에서 `if box is None: box = []`라고 씁니다."
        ),
    ),
    dict(
        order=5, type="short", title="재귀 함수의 실행 순서",
        code='def f(n):\n    if n == 0:\n        return ""\n    return f(n - 1) + str(n)\n\nprint(f(4))',
        question="다음 코드를 실행하면 무엇이 출력될까요? 출력되는 그대로 적어 주세요.",
        answer="1234",
        explanation=(
            "`f(4)`는 `f(3) + \"4\"`이고, `f(3)`은 `f(2) + \"3\"`이고, … `f(0)`은 빈 문자열입니다. "
            "가장 안쪽부터 채워지면서 `\"\" + \"1\" + \"2\" + \"3\" + \"4\"`가 돼요. 그래서 `4321`이 아니라 `1234`입니다.\n\n"
            "재귀는 \"먼저 부른 것이 나중에 끝난다\"는 순서를 머릿속에 그릴 수 있어야 해요. "
            "SWAN의 \"알고리즘 기초\" 단원과 Equation parser 실습에서 깊이 다룹니다."
        ),
    ),
    dict(
        order=6, type="line", title="에러를 고쳐 달라고 했더니, 에러를 숨겼다",
        scenario=(
            "설비 로그에서 평균 온도를 구하는 코드를 돌렸더니 이런 에러가 났어요.\n\n"
            "```error 원래 에러\n"
            "ValueError: could not convert string to float: 'N/A'\n"
            "```\n\n"
            "에러 메시지를 AI에게 붙여넣고 \"고쳐 줘\"라고 했더니, AI가 아래처럼 고쳤어요. **이제 에러 없이 숫자가 나옵니다.**\n\n"
            "```log 로그 파일\n"
            "temp\n80\n82\nN/A\n78\n-\n"
            "```"
        ),
        code=(
            'import csv\n'
            '\n'
            'def average_temp(path):\n'
            '    total = 0\n'
            '    count = 0\n'
            '    with open(path, encoding="utf-8") as f:\n'
            '        for row in csv.DictReader(f):\n'
            '            try:\n'
            '                total += float(row["temp"])\n'
            '            except Exception:\n'
            '                pass\n'
            '            count += 1\n'
            '    return total / count'
        ),
        question="이 코드를 그대로 쓰면 결과가 틀립니다. 결과를 틀리게 만드는 줄을 클릭하세요.",
        answer="12", partial_answer=[10, 11],
        line_notes={"10": "에러를 통째로 숨기는 줄", "11": "에러를 통째로 숨기는 줄", "12": "결과를 틀리게 만드는 줄"},
        explanation=(
            "에러는 사라졌지만 문제는 사라지지 않았어요. 두 가지가 숨어 있습니다.\n\n"
            "### 실제로 돌린 결과\n"
            "| 경우 | 나와야 할 값 | 이 코드의 값 |\n"
            "|---|---|---|\n"
            "| 위 로그 (숫자 80, 82, 78) | 80.0 | **48.0** (240 ÷ 5칸) |\n"
            "| 누가 열 이름을 `temp`에서 `Temp`로 바꾼 로그 | 에러로 알려 줘야 함 | **0.0** (에러 없이) |\n\n"
            "### 숨은 문제 두 가지\n"
            "1. `count += 1`이 `try` 밖에 있어서, 숫자로 바꾸지 못하고 건너뛴 칸도 개수에 셉니다. 평균이 80이 아니라 48이 나와요. "
            "온도 경고 기준이 75도라면, 실제로는 넘었는데도 경고가 울리지 않습니다.\n"
            "2. `except Exception: pass`는 **모든 에러**를 조용히 삼킵니다. 'N/A' 같은 칸뿐 아니라, 누가 열 이름을 바꿔서 `temp` 열이 아예 없어져도 "
            "에러 없이 0을 돌려줘요. 툴이 망가졌는데 아무도 모르게 됩니다.\n\n"
            "==AI에게 \"에러를 고쳐 줘\"라고 하면, AI는 에러가 **안 나게** 만듭니다. **맞게** 만드는 것과는 다른 일이에요.==\n\n"
            "### 더 나은 코드\n"
            "{{better_code}}\n\n"
            "이 코드는 위 로그에서 80.0을 내고, 열 이름이 바뀌면 `KeyError`로 바로 알려 줍니다.\n\n"
            "> 에러가 사라졌다고 문제가 사라진 건 아닙니다. AI가 고친 코드가 「돌아가는지」가 아니라 「맞는지」를 보는 눈, SWAN에서 기릅니다.\n"
            "> 이 내용은 'AI와 함께 만들기' 단원의 'AI가 짠 코드 읽고 검증하기'에서 다룹니다."
        ),
        better_code=(
            'def average_temp(path):\n'
            '    values = []\n'
            '    with open(path, encoding="utf-8") as f:\n'
            '        for row in csv.DictReader(f):\n'
            '            v = row["temp"].strip()\n'
            '            if v in ("", "N/A", "-"):   # 빈 값으로 정한 것만 건너뛴다\n'
            '                continue\n'
            '            values.append(float(v))      # 그 밖의 이상한 값은 에러로 알린다\n'
            '    return sum(values) / len(values)'
        ),
    ),
]
