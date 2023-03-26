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

export const userNotFoundErr = '존재하지 않는 사용자입니다.';

export const nicknameExistErr = '이미 존재하는 nickname입니다.';

export const nicknameOrIdExistErr =
  '이미 존재하는 사용자이거나 중복된 닉네임입니다.';

export const invalidAvatarUrlErr = '올바르지 않은 아바타 url입니다.';
