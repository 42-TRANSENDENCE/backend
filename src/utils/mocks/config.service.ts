export const mockedConfigService = {
  get(key: string) {
    switch (key) {
      case 'JWT_ACCESS_TOKEN_SECRET':
        return 'test access token';
      case 'JWT_ACCESS_TOKEN_EXPIRATION_TIME':
        return '3600';
      case 'JWT_REFRESH_TOKEN_SECRET':
        return 'test refresh token';
      case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
        return '7200';
    }
  },
};
