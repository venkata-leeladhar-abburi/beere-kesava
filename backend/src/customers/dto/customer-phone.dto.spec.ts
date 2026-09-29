import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCustomerDto } from "./create-customer.dto";
import { UpdateCustomerDto } from "./update-customer.dto";

/**
 * A counter sale may be billed to a walk-in who leaves no phone — the sale is
 * still recorded and the bill still reaches the admin feed. A phone that is
 * given is stored in one canonical form (last 10 digits) so the same number
 * can't be saved under several spellings, and on create it must be a full
 * mobile because the retail bill is sent to it on WhatsApp.
 */
describe("Customer phone validation", () => {
  const create = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(CreateCustomerDto, { name: "Padma", type: "RETAIL", ...payload });
    const errors = await validate(dto);
    return { dto, errors: errors.map((e) => e.property) };
  };

  const update = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateCustomerDto, payload);
    const errors = await validate(dto);
    return { dto, errors: errors.map((e) => e.property) };
  };

  describe("create", () => {
    it("accepts a customer with no phone", async () => {
      const { dto, errors } = await create({});
      expect(errors).toEqual([]);
      expect(dto.phone).toBeUndefined();
    });

    it("treats a blank phone as not given rather than storing an empty string", async () => {
      const { dto, errors } = await create({ phone: "   " });
      expect(errors).toEqual([]);
      expect(dto.phone).toBeUndefined();
    });

    it("stores a formatted number in canonical 10-digit form", async () => {
      const { dto, errors } = await create({ phone: "+91 98765 43210" });
      expect(errors).toEqual([]);
      expect(dto.phone).toBe("9876543210");
    });

    it("rejects a number that is too short", async () => {
      const { errors } = await create({ phone: "98765" });
      expect(errors).toEqual(["phone"]);
    });

    it("rejects a non-string phone", async () => {
      const { errors } = await create({ phone: 9876543210 });
      expect(errors).toEqual(["phone"]);
    });
  });

  describe("update", () => {
    it("clears the phone when the field is blanked", async () => {
      const { dto, errors } = await update({ phone: "" });
      expect(errors).toEqual([]);
      expect(dto.phone).toBeNull();
    });

    it("leaves the phone untouched when it isn't sent", async () => {
      const { dto, errors } = await update({ address: "Main Road" });
      expect(errors).toEqual([]);
      expect(dto.phone).toBeUndefined();
    });

    it("still accepts a legacy short number so old customers stay editable", async () => {
      const { dto, errors } = await update({ phone: "98765-432" });
      expect(errors).toEqual([]);
      expect(dto.phone).toBe("98765432");
    });
  });
});
