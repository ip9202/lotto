from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.lotto import LottoDraw
from ..models.public_recommendation import PublicRecommendation
from ..models.saved_recommendation import SavedRecommendation
from ..schemas.recommendation import APIResponse

router = APIRouter(prefix="/api/v1/winning-comparison", tags=["당첨 비교"])

def compare_numbers(recommended_numbers: List[int], winning_numbers: List[int], bonus_number: int) -> dict:
    """추천 번호와 당첨 번호 비교"""
    # 일치하는 번호 개수 계산
    matches = len(set(recommended_numbers) & set(winning_numbers))
    bonus_match = bonus_number in recommended_numbers
    
    # 당첨 등급 결정
    if matches == 6:
        grade = 1  # 1등
    elif matches == 5 and bonus_match:
        grade = 2  # 2등
    elif matches == 5:
        grade = 3  # 3등
    elif matches == 4:
        grade = 4  # 4등
    elif matches == 3:
        grade = 5  # 5등
    else:
        grade = 0  # 낙첨
    
    return {
        "matches": matches,
        "bonus_match": bonus_match,
        "grade": grade,
        "is_winner": grade > 0
    }

@router.get("/public/{draw_number}", response_model=APIResponse)
async def compare_public_recommendations(
    draw_number: int,
    db: Session = Depends(get_db)
):
    """공공 추천 데이터와 당첨번호 비교"""
    try:
        # 당첨번호 조회
        winning_draw = db.query(LottoDraw).filter(LottoDraw.draw_number == draw_number).first()
        if not winning_draw:
            raise HTTPException(status_code=404, detail=f"{draw_number}회차 당첨번호를 찾을 수 없습니다")
        
        # 해당 회차 공공 추천 데이터 조회
        public_recommendations = db.query(PublicRecommendation).filter(
            PublicRecommendation.draw_number == draw_number
        ).all()
        
        if not public_recommendations:
            return APIResponse(
                success=True,
                data={
                    "draw_number": draw_number,
                    "winning_numbers": winning_draw.numbers,
                    "bonus_number": winning_draw.bonus_number,
                    "total_recommendations": 0,
                    "results": []
                },
                message=f"{draw_number}회차 공공 추천 데이터가 없습니다"
            )
        
        # 각 추천에 대해 당첨 비교
        results = []
        for rec in public_recommendations:
            # 더미 데이터는 저장된 당첨 정보 사용 (당첨번호 매칭 로직 완전 건너뛰기)
            if rec.is_dummy and rec.winning_rank is not None:
                comparison = {
                    "matches": rec.matched_count,
                    "bonus_match": False,  # 더미 데이터는 보너스 매칭 정보 없음
                    "grade": rec.winning_rank,
                    "is_winner": rec.winning_rank > 0
                }
            else:
                # 일반 데이터는 당첨번호 매칭 로직 사용
                comparison = compare_numbers(
                    rec.numbers, 
                    winning_draw.numbers, 
                    winning_draw.bonus_number
                )
            
            results.append({
                "id": rec.id,
                "numbers": rec.numbers,
                "generation_method": rec.generation_method,
                "user_type": rec.user_type,
                "confidence_score": rec.confidence_score,
                "created_at": rec.created_at.isoformat(),
                **comparison
            })
        
        # 통계 계산
        total_recommendations = len(results)
        winners = [r for r in results if r["is_winner"]]
        grade_stats = {}
        for grade in range(1, 6):
            grade_stats[f"grade_{grade}"] = len([r for r in winners if r["grade"] == grade])
        
        return APIResponse(
            success=True,
            data={
                "draw_number": draw_number,
                "winning_numbers": winning_draw.numbers,
                "bonus_number": winning_draw.bonus_number,
                "total_recommendations": total_recommendations,
                "total_winners": len(winners),
                "win_rate": len(winners) / total_recommendations if total_recommendations > 0 else 0,
                "grade_stats": grade_stats,
                "results": results
            },
            message=f"{draw_number}회차 공공 추천 데이터 비교 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"공공 추천 데이터 비교 실패: {str(e)}")

@router.get("/personal/{draw_number}", response_model=APIResponse)
async def compare_personal_recommendations(
    draw_number: int,
    user_id: Optional[int] = Query(None, description="사용자 ID (지정하지 않으면 전체)"),
    db: Session = Depends(get_db)
):
    """개인 저장 데이터와 당첨번호 비교"""
    try:
        # 당첨번호 조회
        winning_draw = db.query(LottoDraw).filter(LottoDraw.draw_number == draw_number).first()
        if not winning_draw:
            raise HTTPException(status_code=404, detail=f"{draw_number}회차 당첨번호를 찾을 수 없습니다")
        
        # 해당 회차 개인 저장 데이터 조회
        query = db.query(SavedRecommendation).filter(
            SavedRecommendation.target_draw_number == draw_number
        )
        
        if user_id:
            query = query.filter(SavedRecommendation.user_id == user_id)
        
        personal_recommendations = query.all()
        
        if not personal_recommendations:
            return APIResponse(
                success=True,
                data={
                    "draw_number": draw_number,
                    "winning_numbers": winning_draw.numbers,
                    "bonus_number": winning_draw.bonus_number,
                    "total_recommendations": 0,
                    "results": []
                },
                message=f"{draw_number}회차 개인 저장 데이터가 없습니다"
            )
        
        # 각 추천에 대해 당첨 비교
        results = []
        for rec in personal_recommendations:
            comparison = compare_numbers(
                rec.numbers, 
                winning_draw.numbers, 
                winning_draw.bonus_number
            )
            
            results.append({
                "id": rec.id,
                "user_id": rec.user_id,
                "numbers": rec.numbers,
                "title": rec.title,
                "generation_method": rec.generation_method,
                "confidence_score": rec.confidence_score,
                "created_at": rec.created_at.isoformat(),
                **comparison
            })
        
        # 통계 계산
        total_recommendations = len(results)
        winners = [r for r in results if r["is_winner"]]
        grade_stats = {}
        for grade in range(1, 6):
            grade_stats[f"grade_{grade}"] = len([r for r in winners if r["grade"] == grade])
        
        return APIResponse(
            success=True,
            data={
                "draw_number": draw_number,
                "winning_numbers": winning_draw.numbers,
                "bonus_number": winning_draw.bonus_number,
                "total_recommendations": total_recommendations,
                "total_winners": len(winners),
                "win_rate": len(winners) / total_recommendations if total_recommendations > 0 else 0,
                "grade_stats": grade_stats,
                "results": results
            },
            message=f"{draw_number}회차 개인 저장 데이터 비교 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"개인 저장 데이터 비교 실패: {str(e)}")

@router.get("/stats/{draw_number}", response_model=APIResponse)
async def get_winning_stats(
    draw_number: int,
    db: Session = Depends(get_db)
):
    """특정 회차 당첨 통계 조회"""
    try:
        # 당첨번호 조회
        winning_draw = db.query(LottoDraw).filter(LottoDraw.draw_number == draw_number).first()
        if not winning_draw:
            raise HTTPException(status_code=404, detail=f"{draw_number}회차 당첨번호를 찾을 수 없습니다")
        
        # 공공 데이터 통계
        public_count = db.query(PublicRecommendation).filter(
            PublicRecommendation.draw_number == draw_number
        ).count()
        
        # 개인 저장 데이터 통계
        personal_count = db.query(SavedRecommendation).filter(
            SavedRecommendation.target_draw_number == draw_number
        ).count()
        
        return APIResponse(
            success=True,
            data={
                "draw_number": draw_number,
                "winning_numbers": winning_draw.numbers,
                "bonus_number": winning_draw.bonus_number,
                "public_recommendations": public_count,
                "personal_recommendations": personal_count,
                "total_recommendations": public_count + personal_count
            },
            message=f"{draw_number}회차 당첨 통계 조회 완료"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"당첨 통계 조회 실패: {str(e)}")
