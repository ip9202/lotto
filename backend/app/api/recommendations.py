from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user_history import UserHistory
from ..models.recommendation import Recommendation
from ..schemas.recommendation import (
    RecommendationRequest, 
    RecommendationResponse, 
    CombinationDetail, 
    CombinationAnalysis,
    APIResponse
)
from ..services.recommendation_engine import RecommendationEngine
from ..services.lotto_analyzer import LottoAnalyzer

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])

@router.post("/generate", response_model=APIResponse)
async def generate_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """번호 추천 생성"""
    try:
        # 디버깅을 위한 로깅
        print(f"받은 요청 데이터: {request}")
        print(f"수동 조합 개수: {len(request.manual_combinations)}")
        print(f"총 개수: {request.total_count}")
        print(f"선호 설정: {request.preferences}")
        # 1. 추천 기록 생성
        history = UserHistory(
            session_id=request.session_id,
            draw_number=request.target_draw,
            total_count=request.total_count,
            manual_count=len(request.manual_combinations),
            auto_count=request.total_count - len(request.manual_combinations),
            preferences=request.preferences.dict()
        )
        db.add(history)
        db.flush()
        
        # 2. 수동 조합 저장
        combinations = []
        for manual_combo in request.manual_combinations:
            recommendation = Recommendation(
                history_id=history.id,
                combination_type="manual",
                numbers=sorted(manual_combo.numbers),
                is_manual=True
            )
            db.add(recommendation)
            combinations.append(recommendation)
        
        # 3. AI 자동 추천 생성
        engine = RecommendationEngine(db)
        auto_count = request.total_count - len(request.manual_combinations)
        
        if auto_count > 0:
            auto_recommendations = engine.generate_combinations(
                count=auto_count,
                preferences=request.preferences,
                exclude_combinations=[combo.numbers for combo in combinations]
            )
            
            for auto_combo in auto_recommendations:
                recommendation = Recommendation(
                    history_id=history.id,
                    combination_type="auto",
                    numbers=auto_combo.numbers,
                    is_manual=False,
                    confidence_score=float(auto_combo.confidence_score)
                )
                db.add(recommendation)
                combinations.append(recommendation)
        
        db.commit()
        
        # 4. 응답 생성
        analyzer = LottoAnalyzer(db)
        response_combinations = []
        
        for rec in combinations:
            analysis = None
            if not rec.is_manual:
                analysis = analyzer.analyze_combination(rec.numbers)
            
            response_combinations.append(CombinationDetail(
                numbers=rec.numbers,
                is_manual=rec.is_manual,
                confidence_score=float(rec.confidence_score) if rec.confidence_score else None,
                analysis=CombinationAnalysis(**analysis) if analysis else None
            ))
        
        response_data = RecommendationResponse(
            history_id=history.id,
            session_id=history.session_id,
            target_draw=history.draw_number or 0,
            total_count=history.total_count,
            manual_count=history.manual_count,
            auto_count=history.auto_count,
            combinations=response_combinations,
            created_at=history.created_at.isoformat()
        )
        
        return APIResponse(
            success=True,
            data=response_data,
            message=f"{request.total_count}개의 번호 조합을 성공적으로 생성했습니다"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"추천 생성 실패: {str(e)}")

# 중복된 regenerate 함수 제거됨 - 이 함수는 사용하지 않음

# 추천기록 기능 일시 비활성화
# @router.get("/history/{session_id}", response_model=APIResponse)
# async def get_recommendation_history(
#     session_id: str,
#     db: Session = Depends(get_db)
# ):
#     """사용자 추천 기록 조회"""
#     try:
#         histories = db.query(UserHistory)\
#             .filter(UserHistory.session_id == session_id)\
#             .order_by(UserHistory.created_at.desc())\
#             .all()
#         
#         if not histories:
#             return APIResponse(
#                 success=True,
#                 data=[],
#                 message="추천 기록이 없습니다"
#             )
#         
#         data = []
#         for history in histories:
#             recommendations = db.query(Recommendation)\
#                 .filter(Recommendation.history_id == history.id)\
#                 .all()
#             
#             history_data = {
#                 "id": history.id,
#                 "draw_number": history.draw_number,
#                 "total_count": history.total_count,
#                 "manual_count": history.manual_count,
#                 "auto_count": history.auto_count,
#                 "preferences": history.preferences,
#                 "created_at": history.created_at.isoformat(),
#                 "recommendations": [
#                     {
#                         "id": rec.id,
#                         "numbers": rec.numbers,
#                         "is_manual": rec.is_manual,
#                         "confidence_score": float(rec.confidence_score) if rec.confidence_score else None,
#                         "win_rank": rec.win_rank,
#                         "win_amount": rec.win_amount
#                     } for rec in recommendations
#                 ]
#             }
#             data.append(history_data)
#         
#         return APIResponse(
#             success=True,
#             data=data,
#             message=f"{len(data)}개의 추천 기록을 성공적으로 조회했습니다"
#         )
#         
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"기록 조회 실패: {str(e)}")

@router.put("/{recommendation_id}/result", response_model=APIResponse)
async def update_winning_result(
    recommendation_id: int,
    winning_numbers: List[int],
    bonus_number: int,
    db: Session = Depends(get_db)
):
    """당첨 결과 업데이트"""
    try:
        recommendation = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
        if not recommendation:
            raise HTTPException(status_code=404, detail="추천 조합을 찾을 수 없습니다")
        
        # 당첨 결과 확인
        engine = RecommendationEngine(db)
        result = engine.check_winning_result(recommendation.numbers, winning_numbers, bonus_number)
        
        # 결과 업데이트
        recommendation.win_rank = result['rank']
        recommendation.win_amount = result['amount']
        
        db.commit()
        
        return APIResponse(
            success=True,
            data={
                "recommendation_id": recommendation_id,
                "numbers": recommendation.numbers,
                "win_rank": result['rank'],
                "win_amount": result['amount'],
                "matched": result['matched']
            },
            message="당첨 결과를 성공적으로 업데이트했습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"결과 업데이트 실패: {str(e)}")

import logging

# 로거 설정
logger = logging.getLogger(__name__)

@router.post("/regenerate/{history_id}/{combination_index}", response_model=APIResponse)
async def regenerate_combination(
    history_id: int,
    combination_index: int,
    db: Session = Depends(get_db)
):
    """개별 조합 재생성"""
    print(f"🔄 재생성 시작: history_id={history_id}, combination_index={combination_index}")
    
    try:
        print(f"🔄 재생성 시작: history_id={history_id}, combination_index={combination_index}")
        
        # 1. 히스토리 확인
        history = db.query(UserHistory).filter(UserHistory.id == history_id).first()
        if not history:
            print(f"❌ 히스토리를 찾을 수 없음: {history_id}")
            raise HTTPException(status_code=404, detail="추천 기록을 찾을 수 없습니다")
        
        print(f"✅ 히스토리 찾음: {history.id}")
        print(f"📊 히스토리 preferences: {history.preferences}")
        print(f"📊 preferences 타입: {type(history.preferences)}")
        
        # 2. 기존 추천 조합들 조회
        existing_recommendations = db.query(Recommendation)\
            .filter(Recommendation.history_id == history_id)\
            .order_by(Recommendation.id)\
            .all()
        
        print(f"📋 기존 추천 조합 개수: {len(existing_recommendations)}")
        
        if combination_index >= len(existing_recommendations):
            print(f"❌ 유효하지 않은 조합 인덱스: {combination_index} >= {len(existing_recommendations)}")
            raise HTTPException(status_code=400, detail="유효하지 않은 조합 인덱스입니다")
        
        target_recommendation = existing_recommendations[combination_index]
        print(f"🎯 대상 조합: {target_recommendation.id}, 수동여부: {target_recommendation.is_manual}")
        
        # 3. AI 재생성 (수동 조합이 아닌 경우에만)
        if target_recommendation.is_manual:
            print(f"❌ 수동 조합은 재생성 불가: {target_recommendation.id}")
            raise HTTPException(status_code=400, detail="수동 조합은 재생성할 수 없습니다")
        
        # 4. 새로운 AI 추천 생성
        print("🤖 AI 추천 엔진 초기화 중...")
        engine = RecommendationEngine(db)
        
        # preferences가 딕셔너리이므로 올바른 형태로 변환
        print("🔧 preferences 변환 중...")
        from ..schemas.recommendation import PreferenceSettings
        try:
            preferences_obj = PreferenceSettings(**history.preferences)
            print(f"✅ preferences 변환 성공: {preferences_obj}")
        except Exception as e:
            print(f"❌ preferences 변환 실패: {str(e)}")
            print(f"❌ 원본 preferences: {history.preferences}")
            raise HTTPException(status_code=500, detail=f"preferences 변환 실패: {str(e)}")
        
        # 기존 조합들을 제외하고 새로 생성
        exclude_combinations = [rec.numbers for rec in existing_recommendations if rec.id != target_recommendation.id]
        print(f"🚫 제외할 조합 개수: {len(exclude_combinations)}")
        
        print("🎲 새로운 AI 추천 생성 중...")
        try:
            new_recommendation = engine.generate_combinations(
                count=1,
                preferences=preferences_obj,
                exclude_combinations=exclude_combinations
            )[0]
            print(f"✅ AI 추천 생성 성공: {new_recommendation.numbers}")
        except Exception as e:
            print(f"❌ AI 추천 생성 실패: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI 추천 생성 실패: {str(e)}")
        
        # 5. 기존 조합 업데이트
        print("📝 기존 조합 업데이트 중...")
        target_recommendation.numbers = new_recommendation.numbers
        target_recommendation.confidence_score = float(new_recommendation.confidence_score)
        
        # 6. 분석 결과 생성
        print("📊 분석 결과 생성 중...")
        try:
            analyzer = LottoAnalyzer(db)
            analysis = analyzer.analyze_combination(new_recommendation.numbers)
            print(f"✅ 분석 완료: {analysis}")
        except Exception as e:
            print(f"❌ 분석 실패: {str(e)}")
            analysis = None
        
        db.commit()
        print("💾 데이터베이스 저장 완료")
        
        return APIResponse(
            success=True,
            data={
                "numbers": new_recommendation.numbers,
                "confidence_score": float(new_recommendation.confidence_score),
                "analysis": analysis
            },
            message="조합이 성공적으로 재생성되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 재생성 오류: {str(e)}")
        print(f"❌ 오류 타입: {type(e)}")
        import traceback
        print(f"❌ 스택 트레이스: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"조합 재생성 실패: {str(e)}")

@router.get("/health", response_model=APIResponse)
async def health_check():
    """추천 시스템 헬스체크"""
    return APIResponse(
        success=True,
        data={
            "status": "healthy",
            "service": "recommendation_engine",
            "version": "1.0.0"
        },
        message="추천 시스템이 정상적으로 작동하고 있습니다"
    )


