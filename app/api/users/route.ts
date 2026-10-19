import prisma from "@/lib/prisma";
import { UserRegistrationRequestSchema } from "@/types/dto/userRegistraionRequest";
import type { UserRegistrationRequest } from "@/types/dto/userRegistraionRequest";
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
    const pageNumberInString = request.nextUrl.searchParams.get("pageNumber") || "1"
    const pageSizeInString = request.nextUrl.searchParams.get("pageSize") || "10"
    const pageNumber = parseInt(pageNumberInString)
    const pageSize = parseInt(pageSizeInString)

    const userCount = await prisma.user.count()
    const totalPages = Math.ceil(userCount / pageSize)

    if (pageNumber > totalPages) {
        return NextResponse.json(
            {
                message: "Page number is greater than total pages",
            },
            {
                status: 400
            }
        )
    }


    const users = await prisma.user.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            password: false,
            role: true,
            status: true,
            createdAt: true,
            lastLogin: true,
            privileges: true,
        }
    })
    return NextResponse.json({
        message: "Users fetched successfully",
        users: users,
        pagination: {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalPages: totalPages,
            totalCount: userCount
        }
    })

}
//Customer Account Creation
export async function POST(request: NextRequest) {
    //email, firstName, lastName, password, phone(optional)
    const body = await request.json()

    //validate the body using zod

    try {

        const parseBody = UserRegistrationRequestSchema.parse(body)
        console.log(parseBody)
    }
    catch (error) {
        console.log(error)
        return NextResponse.json(
            {
                message: "Invalid request body"
            },
            {
                status: 400
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

export async function PUT(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id")

    const requestedUser: RequestUser | null = await getUser(request)

    if (requestedUser == null) {
        return NextResponse.json({
            message: "You are not logged in"
        },
            {
                status: 401
            }
        )
    }
    const body = await request.json()
    if (requestedUser.id == id) {
        //user wants to update his own profile
        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        })
        if (user == null) {
            return NextResponse.json(
                {
                    message: "User Not Found"
                },
                {
                    status: 404
                }
            )
        }
        await prisma.user.update({
            where: {
                id: id
            },
            data: {
                email: body.email || user.email,
                firstName: body.firstName || user.firstName,
                lastName: body.lastName || user.lastName,
                phone: body.phone || user.phone,
                profileImage: body.profileImage || user.profileImage
            }
        })
        return NextResponse.json(
            {
                message: "User updated successfully",
            },
            {
                status: 200
            }
        )

    } else {
        //user wants to update another user's profile
        const havePrivilege = await isPrivileged(request, "user:edit")
        if (!havePrivilege) {
            return NextResponse.json(
                {
                    message: "You dont have privilege to edit other users"
                },
                {
                    status: 403
                }
            )

        }
        const user = await prisma.user.findUnique({
            where: {
                id: id || "000000"
            }
        })
        if (user == null) {
            return NextResponse.json(
                {
                    message: "User Not Found"
                },
                {
                    status: 404
                }
            )
        }
        await prisma.user.update({
            where: {
                id: id || "000000"
            },
            data: {
                email: body.email || user.email,
                firstName: body.firstName || user.firstName,
                lastName: body.lastName || user.lastName,
                phone: body.phone || user.phone,
                profileImage: body.profileImage || user.profileImage,
                role: body.role || user.role,
                status: body.status || user.status,
                privileges: body.privileges || user.privileges,

            }

        }
        )
        return NextResponse.json(
            {
                message: "User updated successfully",
            },
            {
                status: 200
            }
        )


    }

} 