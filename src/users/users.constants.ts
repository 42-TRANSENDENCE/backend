import { ApiBodyOptions } from '@nestjs/swagger';

export const userIdApiBody: ApiBodyOptions = {
  description: 'user id',
  schema: {
    type: 'object',
    properties: { id: { type: 'integer', example: 42 } },
  },
};

export const userAvatarApiBody: ApiBodyOptions = {
  description: 'File upload',
  schema: {
    type: 'object',
    properties: { file: { type: 'string', format: 'binary' } },
  },
};
