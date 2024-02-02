import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) => {
        const filterdUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filterdUsers);
      },
      create: (email: string, password: string) => {
        const user = { id: Math.random() * 9999, email, password } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('Can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('Created a new user with salted and hashed password', async () => {
    const user = await service.signup('yaman@gmail.com', 'hello');

    expect(user.password).not.toEqual('hello');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('Throw an error if user signed in with email that used before', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'e', password: 'p' } as User]);
    const user = service.signup('Ali@gmail.com', '123');
    expect(user).rejects.toThrow(BadRequestException);
  });

  it('Throw an error if user signed in with unused email', () => {
    const user = service.signin('Ali@gmail.com', '123');
    expect(user).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ email: 'Ali@gmail.com', password: '123' } as User]);
    const user = service.signin('Ali@gmail.com', '12345');
    expect(user).rejects.toThrow(BadRequestException);
  });

  it('returns user if correct username & password', async () => {
    await service.signup('Ali@gmail.com', '123');
    await expect(service.signin('Ali@gmail.com', '123')).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('hi@gmail.com', '123');
    await expect(service.signup('hi@gmail.com', '123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(service.signin('hi@gmail.com', '123')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('hi@gmail.com', '123');
    await expect(service.signin('hi@gmail.com', '1233')).rejects.toThrow(
      BadRequestException,
    );
  });
});
