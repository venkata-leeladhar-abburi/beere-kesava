import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { AdminOnly } from "../auth/decorators/require-roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateAccessLevelsDto } from "./dto/update-access-level.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

// User management is the sensitive surface here: creating employees, editing
// their details, and changing access levels are all SUPERADMIN/ADMIN-only
// operations in practice (PermissionsGuard bypasses both roles
// unconditionally — see permissions.guard.ts), enforced for any other role
// via the granular keys below (must match prisma/seed.ts's PERMISSIONS
// catalog exactly — a key that isn't seeded fails closed for every role,
// see PermissionsGuard.hasAllPermissions). Reading is guarded too
// (users.read): the list carries every employee's mobile number, and every
// screen that shows it is an admin screen.
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions("users.create")
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @RequirePermissions("users.read")
  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @RequirePermissions("users.read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @RequirePermissions("users.update")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // Plural: a person can hold several portals and is not necessarily trusted
  // equally in each, so the Manage Access screen saves the whole map at once.
  @RequirePermissions("users.roles.manage")
  @Patch(":id/access-levels")
  updateAccessLevels(@Param("id") id: string, @Body() dto: UpdateAccessLevelsDto) {
    return this.usersService.setPortalAccessLevels(id, dto.levels);
  }

  @RequirePermissions("users.delete")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

  // Signed-in devices, newest first. Admin-only: ending someone's session is
  // the "lost phone" control, and it signs that person out immediately.
  @AdminOnly()
  @Get(":id/sessions")
  listSessions(@Param("id") id: string) {
    return this.usersService.listSessions(id);
  }

  @AdminOnly()
  @Delete(":id/sessions/:sessionId")
  revokeSession(@Param("id") id: string, @Param("sessionId") sessionId: string) {
    return this.usersService.revokeSessions(id, sessionId);
  }

  @AdminOnly()
  @Delete(":id/sessions")
  revokeAllSessions(@Param("id") id: string) {
    return this.usersService.revokeSessions(id);
  }
}
