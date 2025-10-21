// 112㎡ (34평) 아파트 도면 데이터
export interface FloorPlanData {
  id: string;
  name: {
    ko: string;
    en: string;
  };
  totalArea: number; // ㎡
  exclusiveArea: number; // ㎡
  width: number; // mm
  height: number; // mm
  imagePath: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  name: {
    ko: string;
    en: string;
  };
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
  color: string;
}

export const floorPlan112: FloorPlanData = {
  id: '112-90',
  name: {
    ko: '112㎡ (34평형)',
    en: '112㎡ Floor Plan',
  },
  totalArea: 69.08,
  exclusiveArea: 51.57,
  width: 11300,
  height: 6900,
  imagePath: '/floor-plans/112_90_1_72_GA1_1283409035154.jpg',
  rooms: [
    {
      id: 'room1',
      name: { ko: '방1', en: 'Room 1' },
      x: 0,
      y: 0,
      width: 2700,
      height: 3900,
      color: 'rgba(255, 235, 205, 0.3)',
    },
    {
      id: 'room2',
      name: { ko: '방2', en: 'Room 2' },
      x: 7700,
      y: 0,
      width: 3300,
      height: 3900,
      color: 'rgba(255, 235, 205, 0.3)',
    },
    {
      id: 'bathroom',
      name: { ko: '화장실', en: 'Bathroom' },
      x: 2700,
      y: 0,
      width: 2400,
      height: 1900,
      color: 'rgba(173, 216, 230, 0.3)',
    },
    {
      id: 'entrance',
      name: { ko: '현관', en: 'Entrance' },
      x: 0,
      y: 3900,
      width: 1600,
      height: 2100,
      color: 'rgba(211, 211, 211, 0.3)',
    },
    {
      id: 'kitchen',
      name: { ko: '주방 및 식사', en: 'Kitchen' },
      x: 1600,
      y: 1900,
      width: 3300,
      height: 3100,
      color: 'rgba(255, 200, 124, 0.3)',
    },
    {
      id: 'living',
      name: { ko: '거실', en: 'Living Room' },
      x: 4900,
      y: 3900,
      width: 4800,
      height: 3000,
      color: 'rgba(144, 238, 144, 0.3)',
    },
    {
      id: 'balcony',
      name: { ko: '발코니', en: 'Balcony' },
      x: 9700,
      y: 3900,
      width: 1600,
      height: 3000,
      color: 'rgba(192, 192, 192, 0.3)',
    },
  ],
};
