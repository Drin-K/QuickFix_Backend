import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { Provider, Role, Tenant, User } from '../shared/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthPayload, AuthRole } from './jwt-auth.guard';

type AuthResponse = {
  message: string;
  accessToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: AuthRole;
    tenantId: number | null;
  };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await hash(registerDto.password, 10);

    const result = await this.dataSource.transaction(async (manager) => {
      const rolesRepository = manager.getRepository(Role);
      const usersRepository = manager.getRepository(User);
      const tenantsRepository = manager.getRepository(Tenant);
      const providersRepository = manager.getRepository(Provider);

      const role = await this.findOrCreateRole(
        registerDto.accountType,
        rolesRepository,
      );

      const user = usersRepository.create({
        roleId: role.id,
        fullName: registerDto.fullName.trim(),
        email: registerDto.email.toLowerCase().trim(),
        passwordHash,
        phone: null,
        isActive: true,
      });

      const savedUser = await usersRepository.save(user);

      let tenantId: number | null = null;

      if (registerDto.accountType === 'provider') {
        const tenant = tenantsRepository.create({
          name: registerDto.fullName.trim(),
        });

        const savedTenant = await tenantsRepository.save(tenant);
        tenantId = savedTenant.id;

        const provider = providersRepository.create({
          tenantId,
          ownerUserId: savedUser.id,
          type: 'individual',
          displayName: registerDto.fullName.trim(),
          description: null,
          cityId: null,
          address: null,
          isVerified: false,
          averageRating: null,
        });

        await providersRepository.save(provider);
      }

      return { user: savedUser, role: role.name as AuthRole, tenantId };
    });

    const accessToken = await this.signToken({
      sub: result.user.id,
      tenantId: result.tenantId,
      role: result.role,
    });

    return {
      message: 'User registered successfully',
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.role,
        tenantId: result.tenantId,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email.toLowerCase().trim() },
      relations: {
        role: true,
        provider: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const role = user.role.name as AuthRole;
    const tenantId =
      role === 'provider' ? (user.provider?.tenantId ?? null) : null;

    const accessToken = await this.signToken({
      sub: user.id,
      tenantId,
      role,
    });

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
        tenantId,
      },
    };
  }

  private async findOrCreateRole(
    roleName: AuthRole,
    rolesRepository: Repository<Role>,
  ): Promise<Role> {
    const existingRole = await rolesRepository.findOne({
      where: { name: roleName },
    });

    if (existingRole) {
      return existingRole;
    }

    const role = rolesRepository.create({ name: roleName });
    return rolesRepository.save(role);
  }

  private signToken(payload: AuthPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
