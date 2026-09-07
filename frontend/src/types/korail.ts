export interface TrainSchedule {
  trainNo: string;
  trainType: string;
  departureStation: string;
  departureStationCode: string;
  departureDate: string;
  departureTime: string;
  departureTimeRaw: string;
  arrivalStation: string;
  arrivalStationCode: string;
  arrivalTime: string;
  arrivalTimeRaw: string;
  runTime: string;
  price: number;
  generalSeatStatus: string;
  generalAvailable: boolean;
  specialSeatStatus: string;
  specialAvailable: boolean;
  waitAvailable: boolean;
  waitQueueCount: number;
  runDate: string;
  trainGroupCode: string;
  trainClassCode: string;
}

export interface LoginSession {
  loggedIn: boolean;
  memberNo?: string;
  customerName?: string;
  customerNo?: string;
  message?: string;
}

export interface MonitorEvent {
  taskId: string;
  trainNo: string;
  trainType: string;
  route: string;
  departureTime: string;
  status: string; // POLLING, SUCCESS_RESERVE, SUCCESS_WAITLIST, STOPPED, ERROR
  attempts: number;
  lastResponseTimeMs: number;
  message: string;
  timestamp: string;
}

export type BookingMode = 'AUTO_ALL' | 'RESERVE_ONLY' | 'WAIT_ONLY';
