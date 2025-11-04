import { socketIO } from '@/server';

export const emitOrderEvent = (event: string, data: any) => {
  socketIO.emit(event, data);
};
