import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export type AuthRole = 'client' | 'provider' | 'admin';

export const COMPANY_SCOPED_ROLES: AuthRole[] = ['provider', 'admin'];

export const isCompanyScopedRole = (role: AuthRole): boolean =>
  COMPANY_SCOPED_ROLES.includes(role);

export type AuthPayload = {
  sub: number;
  tenantId: number | null;
  role: AuthRole;
};

export type RequestUser = {
  id: number;
  tenantId: number | null;
  role: AuthRole;
};

type RequestWithUser = Request & {
  user?: RequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'quickfix-dev-secret',
      });

      request.user = {
        id: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
