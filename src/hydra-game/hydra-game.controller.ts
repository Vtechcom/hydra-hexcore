import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HydraGameService } from './hydra-game.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtPayload } from './interfaces/jwtPayload.type';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('hydra-game')
export class HydraGameController {
  constructor(private hydraGameService: HydraGameService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('create-user')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.hydraGameService.createUser(createUserDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() userLoginDto: UserLoginDto) {
    return this.hydraGameService.signIn(userLoginDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get('user-info')
  auth(@Req() req: any) {
    const user = req.user as JwtPayload;
    return this.hydraGameService.getUserInfo(user.id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Delete('delete-user')
  deleteUser(@Req() req: any) {
    const user = req.user as JwtPayload;
    return this.hydraGameService.deleteUser(user.id);
  }
}
