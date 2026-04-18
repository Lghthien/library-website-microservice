import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LoansDetailsService } from './loans_details.service';
import { CreateLoansDetailDto } from './dto/create-loans_detail.dto';
import { UpdateLoansDetailDto } from './dto/update-loans_detail.dto';

@Controller('loans-details')
export class LoansDetailsController {
  constructor(private readonly loansDetailsService: LoansDetailsService) {}

  @Post()
  create(@Body() createLoansDetailDto: CreateLoansDetailDto) {
    return this.loansDetailsService.create(createLoansDetailDto);
  }

  @Get()
  findAll() {
    return this.loansDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loansDetailsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLoansDetailDto: UpdateLoansDetailDto,
  ) {
    return this.loansDetailsService.update(id, updateLoansDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loansDetailsService.remove(id);
  }
}
