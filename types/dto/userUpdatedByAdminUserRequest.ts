import { z } from "zod";

const UserUpdatedByAdminUserRequestSchema = z.object({
    id:z.never().optional(),
    password: z.never().optional(),
})

export type UserUpdatedByAdminUserRequest = z.infer<typeof UserUpdatedByAdminUserRequestSchema>;
export {UserUpdatedByAdminUserRequestSchema}