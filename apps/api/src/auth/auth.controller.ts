import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto.email, loginDto.password).then((user) => {
      if (!user) {
        throw new Error('Invalid credentials');
      }
      return this.authService.login(user);
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current user' })
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const decoded = JSON.parse(
        Buffer.from(refreshTokenDto.refreshToken.split('.')[1], 'base64').toString(),
      );
      return this.authService.refreshTokens(decoded.sub, refreshTokenDto.refreshToken);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }
}
