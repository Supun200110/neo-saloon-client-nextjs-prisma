import { ProductStatus } from "@/app/generated/prisma/enums";
import {z} from "zod";

const ProductStatusEnum = z.enum(ProductStatus)
const MediaTypeEnum = z.enum(["IMAGE","VIDEO"])

const ProductUpdateRequestSchema= z.object({
    sku:z.string().max(50).optional(),
    name:z.string().max(100).optional(),
    altNames : z.array(z.string().max(100)).optional().default([]),
    description:z.string().optional(),
    stock: z.number().min(0).int().optional(),
    status:ProductStatusEnum.optional(),
    price:z.number().min(0).optional(),
    compareAt:z.number().min(0).optional(),
    brand:z.string().max(100).optional(),
    model:z.string().max(100).optional(),
    media:z.array(z.object({
        url:z.url(),
        type:MediaTypeEnum,
    })).default([])
    
})

export type ProductUpdateRequest = z.infer<typeof ProductUpdateRequestSchema>;
export default ProductUpdateRequestSchema;
