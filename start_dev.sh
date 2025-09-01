#!/bin/bash

# 🚨 로또리아 AI 개발 환경 시작 스크립트
# 이 스크립트를 실행하기 전에 conda가 설치되어 있어야 합니다!

echo "🎯 로또리아 AI 개발 환경을 시작합니다..."

# 1. conda 가상환경 활성화
echo "📦 conda 가상환경을 활성화합니다..."
source ~/opt/anaconda3/etc/profile.d/conda.sh
conda activate py3_12

# 2. 가상환경 상태 확인
echo "✅ 가상환경 상태를 확인합니다..."
if [ "$CONDA_DEFAULT_ENV" = "py3_12" ]; then
    echo "✅ py3_12 가상환경이 활성화되었습니다."
else
    echo "❌ 가상환경 활성화에 실패했습니다."
    echo "🚨 수동으로 다음 명령어를 실행하세요:"
    echo "   conda activate py3_12"
    exit 1
fi

# 3. 프로젝트 디렉토리 확인
echo "📁 프로젝트 디렉토리를 확인합니다..."
if [ -f "docker-compose.yml" ] && [ -d "backend" ] && [ -d "frontend" ]; then
    echo "✅ 올바른 프로젝트 디렉토리에 있습니다."
else
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다."
    echo "🚨 올바른 디렉토리로 이동하세요:"
    echo "   cd ~/develop/vibe/lotto"
    exit 1
fi

# 4. Docker 서비스 시작
echo "🐳 Docker 서비스를 시작합니다..."
docker-compose up -d

# 5. 서비스 상태 확인
echo "🔍 서비스 상태를 확인합니다..."
sleep 5
docker-compose ps

echo ""
echo "🎉 개발 환경이 준비되었습니다!"
echo ""
echo "📝 다음 단계:"
echo "   1. 백엔드 서버: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "   2. 프론트엔드 서버: cd frontend && npm run dev"
echo ""
echo "🌐 접속 주소:"
echo "   - 프론트엔드: http://localhost:5173"
echo "   - 백엔드 API: http://localhost:8000"
echo "   - API 문서: http://localhost:8000/docs"
echo ""
echo "💡 문제가 발생하면 DEVELOPMENT_CHECKLIST.md를 참고하세요!"
