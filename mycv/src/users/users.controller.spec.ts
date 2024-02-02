import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeAuthService = {
      // signup: () => {},
      signin: (email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as User);
      },
    };
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({
          id,
          email: 'Ali@gmail.com',
          password: '123',
        } as User);
      },
      find: (email: string) => {
        return Promise.resolve([
          { id: 1, email: 'Ali@gmail.com', password: '123' } as User,
        ]);
      },
      // remove: () => {},
      // update: () => {},
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllUsers return a list of users with the given email', async () => {
    const users = await controller.findAllUsers('Ali@gmail.com');
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('Ali@gmail.com');
  });

  it('findUser return a single user with the given id', async () => {
    const user = await controller.findUser('1');
    expect(user.email).toEqual('Ali@gmail.com');
  });

  it('findUser throws an error if user with given id is not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  });

  it('signin updates session object and return user', async () => {
    const session = { userId: -1 };
    const user = await controller.signin(
      { email: 'Ali@gmail.com', password: '123' },
      session,
    );

    expect(user.email).toEqual('Ali@gmail.com');
    expect(session.userId).toEqual(1);
  });
});
