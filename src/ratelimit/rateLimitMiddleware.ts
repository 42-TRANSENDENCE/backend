import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter: RateLimiterMemory;

  constructor() {
    // Initialize a rate limiter that allows up to 10 requests per second
    this.limiter = new RateLimiterMemory({
      points: 1, // number of points
      duration: 1, // per second
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Consume a point from the rate limiter
      await this.limiter.consume(req.ip);
      next();
    } catch (err) {
      // The user has exceeded the request rate, send a 429 response
      res.status(429).send('Too Many Requests');
    }
  }
}