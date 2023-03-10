import { Request } from 'express';
import { SessionPayload } from './session-payload.interface';

export interface RequestWithSession extends Request {
  info: SessionPayload;
}
