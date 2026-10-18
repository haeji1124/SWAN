"""모든 시험 파일보다 먼저 실행된다. 올린 파일 폴더를 임시 폴더로 돌려, 시험이 개발용 data/uploads를 건드리지 않게 한다.
(DB는 시험 파일마다 SWAN_DB로 임시 파일을 정한다)
"""
import os
import tempfile

os.environ.setdefault("SWAN_UPLOADS", tempfile.mkdtemp(prefix="swan-uploads-"))
os.environ.setdefault("SWAN_DB", os.path.join(tempfile.mkdtemp(), "test.db"))
