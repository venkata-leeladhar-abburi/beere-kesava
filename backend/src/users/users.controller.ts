import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateAccessLevelDto } from "./dto/update-access-level.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

// User management is the sensitive surface here: creating employees, editing
// their details, and changing access levels are all SUPERADMIN/ADMIN-only
// operations in practice (PermissionsGuard bypasses both roles
// unconditionally — see permissions.guard.ts), enforced for any other role
// via the granular keys below (must match prisma/seed.ts's PERMISSIONS
// catalog exactly — a key that isn't seeded fails closed for every role,
// see PermissionsGuard.hasAllPermissions). Read-only listing is left open to
// any authenticated user.
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions("users.create")
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

  @RequirePermissions("users.update")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @RequirePermissions("users.roles.manage")
  @Patch(":id/access-level")
  updateAccessLevel(@Param("id") id: string, @Body() dto: UpdateAccessLevelDto) {
    return this.usersService.updateAccessLevel(id, dto.accessLevel);
  }

  @RequirePermissions("users.delete")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
