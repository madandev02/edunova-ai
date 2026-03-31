from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.content_audit_service import apply_content_alignment_fixes, build_content_alignment_report
from app.services.context_service import get_current_user_id

router = APIRouter(prefix='/content', tags=['content'])


@router.get('/audit')
def content_audit(
    request: Request,
    include_issues: bool = Query(default=False),
    _: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    report = build_content_alignment_report(db=db)
    startup_report = getattr(request.app.state, 'content_audit_report', None)

    if include_issues:
        return {
            'startup_report': startup_report,
            'live_report': report,
        }

    return {
        'healthy': report['healthy'],
        'summary': report['summary'],
        'startup_summary': startup_report['summary'] if startup_report else None,
    }


@router.post('/audit/fix')
def content_audit_fix(
    request: Request,
    dry_run: bool = Query(default=True),
    _: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    result = apply_content_alignment_fixes(db=db, dry_run=dry_run)
    if not dry_run:
        request.app.state.content_audit_report = result['post_report']
    return result
