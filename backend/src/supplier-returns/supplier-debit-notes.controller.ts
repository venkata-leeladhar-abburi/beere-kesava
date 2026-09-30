import { BadRequestException, Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AdminOnly, RequireRoles } from "../auth/decorators/require-roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UserRole } from "../generated/prisma/client";
import { CancelSupplierDebitNoteDto } from "./dto/cancel-supplier-debit-note.dto";
import { CreateSupplierDebitNoteDto } from "./dto/create-supplier-debit-note.dto";
import { DecideSupplierDebitNoteDto } from "./dto/decide-supplier-debit-note.dto";
import { ListSupplierDebitNotesQueryDto } from "./dto/list-supplier-debit-notes-query.dto";
import { LookupReturnablePiecesQueryDto } from "./dto/lookup-returnable-pieces-query.dto";
import { SupplierDebitNotesService } from "./supplier-debit-notes.service";

// Same role split as supplier-returns: ACCOUNTANT raises and views, an admin decides.
@Controller("supplier-debit-notes")
@RequireRoles(UserRole.ACCOUNTANT)
export class SupplierDebitNotesController {
  constructor(private readonly debitNotesService: SupplierDebitNotesService) {}

  @Post()
  create(@Body() dto: CreateSupplierDebitNoteDto) {
    return this.debitNotesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListSupplierDebitNotesQueryDto) {
    return this.debitNotesService.findAll(query);
  }

  // Declared before ":id" so "lookup" isn't read as a debit note number.
  @Get("lookup")
  lookup(@Query() query: LookupReturnablePiecesQueryDto) {
    return this.debitNotesService.lookupReturnable(query.q);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.debitNotesService.findOne(id);
  }

  @Post(":id/decide")
  @AdminOnly()
  decide(@Param("id") id: string, @Body() dto: DecideSupplierDebitNoteDto) {
    return this.debitNotesService.decide(id, dto);
  }

  // Raiser or admin — checked in the service, since the raiser is an ACCOUNTANT.
  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelSupplierDebitNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const actorId = user?.id ?? dto.cancelledById;
    if (!actorId) {
      throw new BadRequestException("cancelledById is required.");
    }
    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
    return this.debitNotesService.cancel(id, { id: actorId, isAdmin }, dto.note);
  }
}
