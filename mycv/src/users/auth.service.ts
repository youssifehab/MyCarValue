import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // See if email is in use
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('email is in use.');
    }
    // Hash the user password
    // Generate salt
    const salt = randomBytes(8).toString('hex');

    // Hash Password and salt together
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Join the hashed result and salt together
    const result = salt + '.' + hash.toString('hex');

    // Create new user and save it
    const user = await this.usersService.create(email, result);

    // return the user
    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new NotFoundException('Invalid email or password.');
    }

    const [salt, storedHash] = user.password.split('.');

    const Hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== Hash.toString('hex')) {
      throw new BadRequestException('Invalid email or password');
    }
    return user;
  }
}
