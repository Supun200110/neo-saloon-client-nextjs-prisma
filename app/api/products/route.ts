import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { getUser, isPrivileged } from "@/utils/authentication";
import ProductCreationRequestSchema from "@/types/dto/productCreationRequest";
import z from "zod";
import prisma from "@/lib/prisma";
import getPaginationInfo from "@/utils/pageInfoRetieval";

export async function GET(request: NextRequest) {

    const params = getPaginationInfo(request)

    const totalProducts = await prisma.product.count()

    const totalPages = Math.ceil(totalProducts / params.pageSize)

    const products = await prisma.product.findMany({
        skip: (params.pageNumber - 1) * params.pageSize,
        take: params.pageSize,
        include: {
            media: true
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


