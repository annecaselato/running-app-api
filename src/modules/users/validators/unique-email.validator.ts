import { Injectable } from '@nestjs/common';
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from 'class-validator';
import { UserService } from '../user.service';

@ValidatorConstraint({ name: 'email', async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private readonly userService: UserService) {}

  async validate(value: string): Promise<boolean> {
    return this.userService.findOneByEmail(value).then((user) => !user);
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: { message: 'Email already exists', ...validationOptions },
      constraints: [],
      validator: IsUniqueEmailConstraint
    });
  };
}
