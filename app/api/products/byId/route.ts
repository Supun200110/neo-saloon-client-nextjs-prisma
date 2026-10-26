import { ProductStatus } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { isPrivileged } from "@/utils/authentication";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest){
    const id = request.nextUrl.searchParams.get("id")

    if(id==null){
        return NextResponse.json({
            message:"Product ID is required",
            status:400
        })
    }
    try{
    const product = await prisma.product.findUnique({
        where:{
            id:id
        }
    })
    if(product==null){
        return NextResponse.json({
            message:"Product Not Found",
            status:404
        })
    }
    if(product.status==ProductStatus.DELETED){
        return NextResponse.json({
            message:"Product Not Found",
            status:404
        })
    }
    if(product.status==ProductStatus.INACTIVE){
        const hasPrivilege =await isPrivileged(request,"product:read")
        if(!hasPrivilege){
            return NextResponse.json({
                message:"Product Not Found",
                status:404
            })
        }
    }
    return NextResponse.json({
        product:product,
        message:"Product Fetched Successfully"
    },
    {
        status:200
    }
)
}catch(error){
    return NextResponse.json({
        message:"Internal Server Error"
    },{
        status:500
    })
}
}