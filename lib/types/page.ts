import { FurnitureItem } from '../stores/furniture-store';
import { DrawingElement } from '../stores/drawing-store';

/**
 * 단일 페이지 정보 (도면 1장 + 가구 배치 + 도형)
 */
export interface Page {
  id: string; // 고유 ID
  name: string; // 사용자 지정 이름 (예: "거실", "침실 1")
  imageUrl: string; // base64 이미지
  furniture: FurnitureItem[]; // 이 페이지의 가구 배치
  drawings: DrawingElement[]; // 이 페이지의 도형
  createdAt: number;
}

/**
 * 멀티 페이지 작업 파일 (저장/불러오기)
 */
export interface WorkFile {
  version: string; // 파일 버전 (예: "1.0")
  pages: Page[];
  currentPageId: string | null;
  createdAt: number;
  updatedAt: number;
}
