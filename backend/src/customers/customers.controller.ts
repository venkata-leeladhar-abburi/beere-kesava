import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { ListCustomersQueryDto } from "./dto/list-customers-query.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

// NOTE: RBAC guards intentionally not yet applied — see the same note in
// src/users/users.controller.ts.
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListCustomersQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }
}
