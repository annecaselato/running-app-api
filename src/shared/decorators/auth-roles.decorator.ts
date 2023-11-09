import { SetMetadata } from '@nestjs/common';
import { Role } from '../models/roles';

export const AuthRoles = (...roles: Role[]) => SetMetadata('roles', roles);
