import prisma from "@/lib/prisma";
import { RequestUser } from "@/types/requestUser";
import { getUser, isPrivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const havePrivilege = await isPrivileged(request, "users:read")
    if (!havePrivilege) {
        return NextResponse.json(
            {
                message: "You do not have the required privilege to perform this action",
            },
            {
                status: 403
            }
        )
    }
    const users = await prisma.user.findMany()
    return NextResponse.json(
        {
            message: "Users retrieved successfully",
            users: users
        }
    )
}
//Customer Account Creation
export async function POST(request: NextRequest) {
    //email, firstName, lastName, password, phone(optional)
    const body = await request.json()
    if (body.email == null) {
        return NextResponse.json(
            {
                message: "Email is required"
            },
            {
                status: 422
            }
        )
    }
    if (body.firstName == null) {
        return NextResponse.json(
            {
                message: "First name is required"
            },
            {
                status: 422
            }
        )
    }
    if (body.lastName == null) {
        return NextResponse.json(
            {
                message: "Last name is required"
            },
            {
                status: 422
            }
        )
    }
    if (body.password == null) {
        return NextResponse.json(
            {
                message: "Password is required"
            },
            {
                status: 422
            }
        )
    }
    const existingUser = await prisma.user.findFirst({
        where: {
            email: body.email
        }
    })
    if (existingUser != null) {
        return NextResponse.json(
            {
                message: "User already exists"
            },
            {
                status: 409
            }
        )
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.user.create({
        data: {
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            password: passwordHash,
            phone: body.phone || null,

        }
    })
    return NextResponse.json(
        {
            message: "User created successfully",
        },
        {
            status: 201
        }
    )


}

export async function PUT(request:NextRequest){
    const id = request.nextUrl.searchParams.get("id")
    
    const requestedUser:RequestUser|null = await getUser(request)

    if(requestedUser==null){
        return NextResponse.json({
            message: "You are not logged in"
        },
        {
            status: 401
        }
    )
    }
    if(requestedUser.id == id){
        //user wants to update his own profile
        
    }else{
        //user wants to update another user's profile
    }
    
} 