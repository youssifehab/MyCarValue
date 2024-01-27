import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password } as User),
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

  //   it('throws if an invalid password is provided', async () => {
  //     fakeUsersService.find = () =>
  //       Promise.resolve([
  //         { email: 'asdf@asdf.com', password: 'laskdjf' } as User,
  //       ]);
  //     await expect(
  //       service.signin('laskdjf@alskdfj.com', 'passowrd'),
  //     ).rejects.toThrow(BadRequestException);
  //   });
});
