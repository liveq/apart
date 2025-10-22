'use client';

import { useTranslation } from '@/lib/hooks/useTranslation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpDialog({ open, onClose }: HelpDialogProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-4 sm:pt-8 md:pt-16 overflow-y-auto"
      style={{ zIndex: 50000 }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-300 rounded-lg shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">사용 가이드</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            style={{ fontSize: '24px', lineHeight: '1', padding: '4px 8px' }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
          {/* 배율 적용 (Calibration) */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              배율 적용 (Calibration)
            </h3>
            <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-3">
                <p className="font-semibold text-amber-900">
                  ⚠️ 도면 업로드 시 필수 작업입니다
                </p>
                <p className="text-amber-800 text-xs mt-1">
                  * 도면 생성(직접 그리기)으로 처음부터 그리는 경우에는 배율 적용이 필요 없습니다.
                </p>
              </div>
              <p className="font-semibold text-gray-900">사용 이유:</p>
              <p>
                업로드한 도면 이미지의 실제 비율과 컴퓨터 화면의 픽셀 기준을 일치시키는 작업입니다.
                도면을 스캔하거나 사진으로 찍으면 실제 크기와 화면에 표시되는 크기가 달라지기 때문에,
                정확한 가구 배치와 치수 측정을 위해서는 반드시 배율 보정이 필요합니다.
              </p>
              <p className="font-semibold text-gray-900 mt-3">사용법:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>도면에서 실제 길이가 표시된 선(벽면, 방 크기 등)을 찾습니다.</li>
                <li>상단 툴바에서 '배율적용' 버튼을 클릭합니다.</li>
                <li>도면의 해당 선 위를 따라 시작점을 클릭하고 끝점까지 드래그합니다.</li>
                <li>대화상자에 도면에 표시된 실제 길이를 cm 단위로 입력합니다.</li>
                <li>확인을 누르면 배율이 자동 계산되어 적용됩니다.</li>
              </ol>
              <p className="text-gray-600 mt-2">
                * 배율 적용 후에는 모든 치수가 실제 크기(cm/m)로 정확하게 표시됩니다.
              </p>
              <div className="bg-gray-100 border-l-4 border-gray-400 p-3 mt-3">
                <p className="text-xs text-gray-700">
                  <strong>예시:</strong> 도면에 "3.6m" 또는 "360cm"로 표시된 벽이 있다면,
                  그 벽의 시작점부터 끝점까지 배율적용 도구로 선을 그리고 "360"을 입력하면
                  도면 전체의 배율이 정확하게 맞춰집니다.
                </p>
              </div>
            </div>
          </section>

          {/* 키보드 단축키 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              키보드 단축키
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono text-xs min-w-[80px] text-center">
                  Ctrl
                </kbd>
                <div className="ml-4 text-gray-700">
                  <p className="font-semibold text-gray-900">연속 선 그리기 / 펜 도구 직선 모드</p>
                  <p className="text-gray-600 mt-1">
                    • 선 그리기 도구: Ctrl을 누르고 있으면 이전 끝점에서 계속 선을 그립니다.<br/>
                    • 펜 도구: Ctrl을 누르고 있으면 5도 단위로 각도가 스냅되는 직선 모드로 전환됩니다.
                  </p>
                </div>
              </div>

              <div className="flex">
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono text-xs min-w-[80px] text-center">
                  Space
                </kbd>
                <div className="ml-4 text-gray-700">
                  <p className="font-semibold text-gray-900">캔버스 이동 (패닝)</p>
                  <p className="text-gray-600 mt-1">
                    Space를 누르고 드래그하면 캔버스를 자유롭게 이동할 수 있습니다.
                    모든 도구에서 사용 가능하며, 화면을 확대한 상태에서 도면의 다른 부분을 보고 싶을 때 유용합니다.
                  </p>
                </div>
              </div>

              <div className="flex">
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono text-xs min-w-[80px] text-center">
                  Esc
                </kbd>
                <div className="ml-4 text-gray-700">
                  <p className="font-semibold text-gray-900">작업 취소</p>
                  <p className="text-gray-600 mt-1">
                    현재 그리고 있는 작업을 취소하고 도구를 초기화합니다.
                  </p>
                </div>
              </div>

              <div className="flex">
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 font-mono text-xs min-w-[80px] text-center">
                  Enter
                </kbd>
                <div className="ml-4 text-gray-700">
                  <p className="font-semibold text-gray-900">펜 도구 완성</p>
                  <p className="text-gray-600 mt-1">
                    펜 도구의 직선 모드(Ctrl+클릭)에서 작업을 완료합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 도구별 사용법 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              도구별 사용법
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900">선택 도구</p>
                <p className="text-gray-700 mt-1">
                  • 요소를 클릭하여 선택합니다.<br/>
                  • 선택한 요소를 드래그하여 이동할 수 있습니다.<br/>
                  • 모서리/변의 핸들을 드래그하여 크기를 조절합니다.<br/>
                  • 텍스트를 더블클릭하면 수정할 수 있습니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">선 그리기</p>
                <p className="text-gray-700 mt-1">
                  • 시작점을 클릭하고 끝점을 클릭하여 직선을 그립니다.<br/>
                  • 자동으로 수평/수직 스냅이 적용됩니다.<br/>
                  • 연속 모드를 활성화하거나 Ctrl을 누르면 이전 끝점에서 계속 그릴 수 있습니다.<br/>
                  • 실시간으로 선의 길이가 표시됩니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">사각형 / 원형</p>
                <p className="text-gray-700 mt-1">
                  • 첫 번째 클릭으로 시작점을 정하고, 두 번째 클릭으로 완성합니다.<br/>
                  • 드래그하는 동안 가로/세로 치수가 실시간으로 표시됩니다.<br/>
                  • 스마트 가이드라인이 다른 요소와의 정렬을 도와줍니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">펜 도구 (프리핸드)</p>
                <p className="text-gray-700 mt-1">
                  • 기본 모드: 마우스를 드래그하면 자유롭게 곡선을 그릴 수 있습니다.<br/>
                  • Ctrl 모드: Ctrl을 누르고 클릭하면 5도 단위로 스냅되는 직선을 그립니다.<br/>
                  • Ctrl 모드에서는 각도와 거리가 실시간으로 표시됩니다.<br/>
                  • Enter 키로 완성하거나, Ctrl을 놓으면 자동으로 완성됩니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">텍스트</p>
                <p className="text-gray-700 mt-1">
                  • 원하는 위치를 클릭하여 텍스트를 입력합니다.<br/>
                  • Enter: 텍스트 완성 / Shift+Enter: 줄바꿈<br/>
                  • 글꼴, 크기, 색상을 툴바에서 조절할 수 있습니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">지우개</p>
                <p className="text-gray-700 mt-1">
                  • 지우기 모드를 선택합니다 (도형 전용 / 가구 전용 / 전체).<br/>
                  • 삭제할 요소를 클릭합니다.
                </p>
              </div>
            </div>
          </section>

          {/* 스마트 기능 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              스마트 기능
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">스마트 가이드라인</p>
                <p className="mt-1">
                  요소를 그리거나 이동할 때, 다른 요소의 모서리/중심점과 자동으로 정렬됩니다.
                  청록색 가이드라인과 원형 마커가 스냅 위치를 표시합니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">그리드 스냅</p>
                <p className="mt-1">
                  격자 표시가 활성화되면 모든 점이 격자에 자동으로 스냅됩니다.
                  정확한 배치와 정렬에 유용합니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">실시간 치수 표시</p>
                <p className="mt-1">
                  선, 사각형, 원형을 그릴 때 실시간으로 치수가 표시됩니다.
                  배율이 적용되면 cm/m 단위로, 미적용 시 px 단위로 표시됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 가구 배치 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              가구 배치
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">가구 추가</p>
                <p className="mt-1">
                  • 좌측 패널에서 카테고리를 선택합니다.<br/>
                  • 원하는 가구를 클릭하여 도면에 추가합니다.<br/>
                  • 검색 기능으로 가구를 빠르게 찾을 수 있습니다 (초성 검색 지원).
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">가구 조작</p>
                <p className="mt-1">
                  • 드래그하여 위치를 이동합니다.<br/>
                  • 회전 핸들(🔄)을 드래그하여 회전합니다.<br/>
                  • 모서리 핸들을 드래그하여 크기를 조절합니다.<br/>
                  • 더블클릭하여 이름을 편집할 수 있습니다.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">사용자 정의 가구</p>
                <p className="mt-1">
                  좌측 패널 하단의 '사용자정의가구' 버튼으로 원하는 크기의 사각형/원형 가구를 만들 수 있습니다.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
