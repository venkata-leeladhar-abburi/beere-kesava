import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DesignDispatchesService } from './design-dispatches.service';
import { CreateDesignDispatchDto } from './dto/create-design-dispatch.dto';

@Controller('design-dispatches')
export class DesignDispatchesController {
  constructor(private readonly designDispatchesService: DesignDispatchesService) {}

  @Post()
  create(@Body() createDesignDispatchDto: CreateDesignDispatchDto) {
    return this.designDispatchesService.create(createDesignDispatchDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '100',
  ) {
    return this.designDispatchesService.findAll(+page, +pageSize);
  }

  @Get('weaver/:weaverId')
  findByWeaver(@Param('weaverId') weaverId: string) {
    return this.designDispatchesService.findByWeaver(weaverId);
  }
}
