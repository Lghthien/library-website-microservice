import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ParametersService } from './parameters.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('parameters')
export class ParametersController {
  constructor(private readonly parametersService: ParametersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @RequirePermissions('Q015') // Thay đổi quy định
  create(@Body() createParameterDto: CreateParameterDto) {
    return this.parametersService.create(createParameterDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.parametersService.findAll();
  }

  @Get('name/:paramName')
  @UseGuards(JwtAuthGuard)
  findByName(@Param('paramName') paramName: string) {
    return this.parametersService.findByName(paramName);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.parametersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @RequirePermissions('Q015')
  update(
    @Param('id') id: string,
    @Body() updateParameterDto: UpdateParameterDto,
  ) {
    return this.parametersService.update(id, updateParameterDto);
  }

  @Patch('name/:paramName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @RequirePermissions('Q015')
  updateByName(
    @Req() req: any,
    @Param('paramName') paramName: string,
    @Body() body: { paramValue: string },
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.parametersService.updateByName(
      paramName,
      body.paramValue,
      userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @RequirePermissions('Q015')
  remove(@Param('id') id: string) {
    return this.parametersService.remove(id);
  }
}
