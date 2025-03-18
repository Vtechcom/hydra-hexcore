import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Docker from 'dockerode';
import bcrypt from 'bcryptjs';

import { HydraParty } from '../hydra-main/entities/HydraParty.entity';
import { HydraNode } from '../hydra-main/entities/HydraNode.entity';
import { Account } from '../hydra-main/entities/Account.entity';
import { GameUser } from './entities/User.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtPayload } from './interfaces/jwtPayload.type';
import { ResUserInfoDto } from './dto/response/user-info.dto';

@Injectable()
export class HydraGameService implements OnModuleInit {
  private docker: Docker;

  constructor(
    @InjectRepository(HydraNode)
    private hydraNodeRepository: Repository<HydraNode>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(HydraParty)
    private hydraPartyRepository: Repository<HydraParty>,
    @InjectRepository(GameUser)
    private gameUserRepository: Repository<GameUser>,
    private jwtService: JwtService,
  ) {
    const DOCKER_SOCKET = process.env.NEST_DOCKER_SOCKET_PATH || '\\\\.\\pipe\\docker_engine';
    this.docker = new Docker({ socketPath: DOCKER_SOCKET });
  }

  async onModuleInit() {}

  async getListRoom() {
    // Get node container
    const containers = await this.docker.listContainers({
      all: false,
      filters: {
        name: ['hexcore-hydra-node-'],
        status: ['running'],
        // label: ['party_name=party-1']
      },
    });

    const partyRuningIds = Array.from(
      new Set(containers.map((containerInfo) => parseInt(containerInfo.Labels.party_id))),
    );
    const queryBuilder = this.hydraPartyRepository
      .createQueryBuilder('party')
      .where('party.id IN (:...ids)', { ids: partyRuningIds })
      .leftJoinAndSelect('party.hydraNodes', 'hydraNodes')
      .leftJoinAndSelect('hydraNodes.cardanoAccount', 'cardanoAccount');

    console.log(queryBuilder.getSql());

    const parties = await queryBuilder.getMany();
    return parties;
  }

  async createUser(createUserDto: CreateUserDto) {
    const existed = await this.gameUserRepository.findOne({
      where: { address: createUserDto.address },
    });
    if (existed) {
      throw new BadRequestException('User already existed');
    }
    const saltRounds = 10;
    const password = createUserDto.password;
    const passwordHashed = await bcrypt.hash(password, saltRounds);
    const user = this.gameUserRepository.create({
      address: createUserDto.address,
      password: passwordHashed,
    });
    return this.gameUserRepository.save(user);
  }

  async signIn({ address, password }: UserLoginDto): Promise<{ accessToken: string }> {
    const user = await this.gameUserRepository.findOne({
      where: { address },
    });
    const isPasswordValid = await bcrypt.compare(password, user?.password);
    if (!isPasswordValid) {
      throw new BadRequestException({
        message: 'Invalid address or password',
      });
    }
    const payload: JwtPayload = { address: user.address, id: user.id };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async getUserInfo(id: GameUser['id']): Promise<ResUserInfoDto> {
    const user = await this.gameUserRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException();
    }
    return new ResUserInfoDto(user);
  }

  async deleteUser(id: GameUser['id']): Promise<Record<string, any>> {
    const deletedUser = await this.gameUserRepository.delete({ id });
    if (!deletedUser) {
      throw new NotFoundException();
    }
    return {
      id,
      data: deletedUser.raw,
      message: 'User deleted successfully',
    };
  }
}
