import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateAccessLevelDto } from "./dto/update-access-level.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

// NOTE: RBAC guards (users.manage permission) are intentionally not yet applied here —
// the JWT/OTP auth module that would populate req.user is still deferred. Add
// @UseGuards(JwtAuthGuard, PermissionsGuard) + @RequirePermissions("users.manage")
// to every mutating route below once auth exists. See project memory
// project_backend_scaffold_status for the decision record.
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(":id/access-level")
  updateAccessLevel(@Param("id") id: string, @Body() dto: UpdateAccessLevelDto) {
    return this.usersService.updateAccessLevel(id, dto.accessLevel);
  }
}
