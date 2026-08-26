import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { UserRole } from '../generated/prisma/client';
import { DesignDispatchesService } from './design-dispatches.service';
import { CreateDesignDispatchDto } from './dto/create-design-dispatch.dto';

// Recording a design dispatch is the same operation, by the same people, as
// POST /design-library/:code/dispatch - so it carries the same role list.
// Reads stay open: the weaver portal lists its own dispatches.
@Controller('design-dispatches')
export class DesignDispatchesController {
  constructor(private readonly designDispatchesService: DesignDispatchesService) {}

  @RequireRoles(UserRole.WORKER, UserRole.ADMIN, UserRole.SUPERADMIN)
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
