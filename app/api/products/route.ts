import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { getUser, isPrivileged } from "@/utils/authentication";
import ProductCreationRequestSchema, { MediaArraySchema } from "@/types/dto/productCreationRequest";
import z from "zod";
import prisma from "@/lib/prisma";
import getPaginationInfo from "@/utils/pageInfoRetieval";
import { ProductStatus } from "@/app/generated/prisma/enums";
import ProductUpdateRequestSchema from "@/types/dto/productUpdateReuest";

export async function GET(request: NextRequest) {

    const params = getPaginationInfo(request)

    const hasPrivilege = await isPrivileged(request, "products:read")

    if (!hasPrivilege) {

        const totalProducts = await prisma.product.count(
            {
                where: {
                    NOT: {
                        status: ProductStatus.DELETED
                    }
                }
            }
        )

        const totalPages = Math.ceil(totalProducts / params.pageSize)

        const products = await prisma.product.findMany({
            skip: (params.pageNumber - 1) * params.pageSize,
            take: params.pageSize,
            include: {
                media: true
            },
            where: {
                NOT: {
                    status: ProductStatus.DELETED
                }
            }

        })
        return NextResponse.json(
            {
                message: "Products fetched successfully",
                products: products,
                pagination: {
                    pageNumber: params.pageNumber,
                    pageSize: params.pageSize,
                    totalPages: totalPages,
                    totalCount: totalProducts
                }
            },
            {
                status: 200
            }
        )
    } else {
        const totalProducts = await prisma.product.count(
            {
                where: {
                    status: ProductStatus.ACTIVE
                }
            }
        )
        const totalPages = Math.ceil(totalProducts / params.pageSize)

        const products = await prisma.product.findMany({
            skip: (params.pageNumber - 1) * params.pageSize,
            take: params.pageSize,
            include: {
                media: true
            },
            where: {
                status: ProductStatus.ACTIVE
            }

        })
        return NextResponse.json(
            {
                message: "Products fetched successfully",
                products: products,
                pagination: {
                    pageNumber: params.pageNumber,
                    pageSize: params.pageSize,
                    totalPages: totalPages,
                    totalCount: totalProducts
                }
            },
            {
                status: 200
            }
        )
    }

}

export async function POST(request: NextRequest) {
    const hasPrivilege = await isPrivileged(request, "products:add")

    if (hasPrivilege) {
        try {
            const body = await request.json()
            const parsedBody = ProductCreationRequestSchema.parse(body)

            await prisma.product.create({
                data: {
                    sku: parsedBody.sku,
                    name: parsedBody.name,
                    altNames: parsedBody.altNames,
                    description: parsedBody.description,
                    stock: parsedBody.stock,
                    status: parsedBody.status,
                    price: parsedBody.price,
                    compareAt: parsedBody.compareAt,
                    brand: parsedBody.brand,
                    model: parsedBody.model,
                    media: {
                        create: parsedBody.media
                    }
                }
            })
            return NextResponse.json(
                {
                    message: "Product Created Successfully"
                },
                {
                    status: 200
                }
            )


        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json({
                    message: error.issues[0].message ?? "Invalid Input",
                },
                    {
                        status: 400,
                    });
            }
            return NextResponse.json({
                message: "Internal Error"
            }, {
                status: 500
            })
        }

    } else {

        return NextResponse.json({
            message: "You Dont have Privilege to Create Product",
            status: 401
        })
    }
}

export async function DELETE(request: NextRequest) {

    const hasPrivilege = await isPrivileged(request, "products:delete")
    if (!hasPrivilege) {
        return NextResponse.json({
            message: "You Dont have Privilege to Delete Product",
            status: 401
        })
    }
    try {
        const id = request.nextUrl.searchParams.get("id")
        if (id == null) {
            return NextResponse.json({
                message: "Product Id is required",
                status: 400
            })
        }

        const existingProduct = await prisma.product.findUnique({
            where: {
                id: id
            },
        })
        if (existingProduct == null) {
            return NextResponse.json({
                message: "Product Not Found",
                status: 404
            })
        }
        await prisma.product.update({
            where: {
                id: id
            },
            data: {
                status: ProductStatus.DELETED
            }
        })
        return NextResponse.json(
            {
                message: "Product Deleted Successfully"
            },
            {
                status: 200
            }
        )

    } catch (error) {
        return NextResponse.json({
            message: "Internal Server Error"
        }, {
            status: 500
        })
    }
}

export async function PUT(request: NextRequest) {
    const hasPrivilege = await isPrivileged(request, "products:edit")

    if (!hasPrivilege) {
        return NextResponse.json({
            message: "You do not have the required privilege to update a product"
        },
            {
                status: 403
            },
        )
    }
    const id = request.nextUrl.searchParams.get("id")
    if (id == null) {
        return NextResponse.json({
            message: "Product id is required"
        },
            {
                status: 400
            }
        )
    }
    try {
        const body = await request.json()
        const parseBody = ProductUpdateRequestSchema.parse(body)

        const existingProduct = await prisma.product.findUnique({
            where: {
                id: id
            }
        })
        if (existingProduct == null) {
            return NextResponse.json({ message: "Product Not Found" }, { status: 404 })
        }
        if (existingProduct.status == ProductStatus.DELETED) {
            return NextResponse.json({ message: "Product Not Found" }, { status: 400 })
        }
        await prisma.product.update(
            {
                where: {
                    id: id
                },
                data: {
                    sku: parseBody.sku || existingProduct.sku,
                    name: parseBody.name || existingProduct.name,
                    altNames: parseBody.altNames || existingProduct.altNames,
                    description: parseBody.description || existingProduct.description,
                    stock: parseBody.stock || existingProduct.stock,
                    status: parseBody.status || existingProduct.status,
                    price: parseBody.price || existingProduct.price,
                    compareAt: parseBody.compareAt || existingProduct.compareAt,
                    brand: parseBody.brand || existingProduct.brand,
                    model: parseBody.model || existingProduct.model,

                }
            }
        )
        if (parseBody.media != null && parseBody.media.length > 0) {
            const parsedMediaArray = MediaArraySchema.parse(parseBody.media);

            await prisma.media.deleteMany({
                where: {
                    productId: id
                }
            })
            await prisma.product.update(
                {
                    where: {
                        id: id
                    },
                    data: {
                        media: {
                            create: parsedMediaArray
                        }
                    }
                }
            )
        }
        return NextResponse.json(
            {
                message: "Product Updated Successfully",
            },
            {
                status: 200
            }
        )

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    message: error.issues[0].message ?? "Invalid Input",
                },
                {
                    status: 400,
                }
            );
        }
        return NextResponse.json(
            {
                message: "Interval Server Error"
            },
            {
                status: 500
            }
        )
    }
}

