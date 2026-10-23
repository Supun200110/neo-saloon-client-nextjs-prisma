import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { getUser, isPrivileged } from "@/utils/authentication";

export async function GET(request: NextRequest) {
    

    
    
} 

export async function POST(request: NextRequest) {
    const hasPrivilege= await isPrivileged(request,"products:add")

    if(hasPrivilege){
        const body=await request.json()

    }else{
        return NextResponse.json({
            message:"You Dont have Privilege to Create Product",
            status:401
        })
    }
}