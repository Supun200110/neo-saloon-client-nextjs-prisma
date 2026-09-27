import { NextRequest } from "next/server";
import * as jose from "jose";
import { getUser } from "@/utils/authentication";

export async function GET(request: NextRequest) {
    const user = getUser(request)
    console.log(user)

    
    
}