'use client';

import { useState } from 'react';
import LayoutsDialog from '@/components/ui/LayoutsDialog';

export default function TestLayoutsPage() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-6">LayoutsDialog 테스트 페이지</h1>

      <div className="space-y-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">현재 LayoutsDialog 확인</h2>
          <p className="text-muted-foreground mb-4">
            저장 버튼 클릭 시 나타나는 모달 확인<br />
            - 년월일시분초 디폴트 입력 확인<br />
            - 저장/로드 기능 확인
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            💾 LayoutsDialog 열기
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">기대 동작</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>모달 열기 시 년-월-일-시-분-초 형식의 디폴트 이름 표시</li>
            <li>저장 버튼 클릭 시 저장 폼 표시</li>
            <li>이름 수정 가능</li>
            <li>저장된 배치안 목록 표시</li>
            <li>로드 및 삭제 기능</li>
          </ul>
        </div>
      </div>

      <LayoutsDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        mode="save"
      />
    </div>
  );
}
