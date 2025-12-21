import { io } from '@/server';

export const emitOrderEvent = (event: string, data: any) => {
  io.emit(event, data);
};
